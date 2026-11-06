import type { TrackingExecution } from 'services/crossChain/adapters/KyberCrossAdapter/api'
import { isExecutionFinished } from 'services/crossChain/adapters/KyberCrossAdapter/utils'
import { describe, expect, it } from 'vitest'

import {
  getExecutionSteps,
  getLocalExecutionSteps,
} from 'components/SwapTransactions/TransactionDetail/kyberCrossDetail'

const execution = (overrides: Partial<TrackingExecution> = {}): TrackingExecution => ({
  route_plan_id: 'route-1',
  source_tx_hash: '0x123',
  source_chain: 'ethereum',
  dest_chain: 'base',
  from_address: '0x111',
  to_address: '0x222',
  token_in: '0x333',
  token_out: '0x444',
  bridge_provider: 'relay',
  flow_type: 'bridge_only',
  route_state: 'BRIDGE_PENDING',
  data: {},
  ...overrides,
})

describe('KyberCross detail progress', () => {
  it('only includes swap steps that belong to the execution flow', () => {
    expect(getExecutionSteps(execution()).map(step => step.id)).toEqual(['created', 'bridge', 'settlement'])
    expect(getExecutionSteps(execution({ flow_type: 'swap_bridge_swap' })).map(step => step.id)).toEqual([
      'created',
      'source-swap',
      'bridge',
      'destination-swap',
      'settlement',
    ])
  })

  it('keeps destination swap pending after a bridge fill rather than completing the route', () => {
    const steps = getExecutionSteps(
      execution({
        flow_type: 'bridge_then_swap',
        route_state: 'SWAP_PENDING',
        data: {
          bridge: {
            source: { tx_hash: '0x123', token: '0x333', amount: '100' },
            dest: { tx_hash: '0x456', token: '0x333', amount: '99' },
          },
        },
      }),
    )
    expect(steps.map(step => [step.id, step.status])).toEqual([
      ['created', 'complete'],
      ['bridge', 'complete'],
      ['destination-swap', 'pending'],
      ['settlement', 'waiting'],
    ])
  })

  it('does not show later steps as processing after bridge failure', () => {
    const current = execution({ flow_type: 'bridge_then_swap', route_state: 'BRIDGE_FAILED' })
    expect(getExecutionSteps(current).map(step => step.status)).toEqual(['complete', 'failed', 'skipped', 'skipped'])
    expect(isExecutionFinished(current)).toBe(false)
  })

  it('tracks refund separately from output delivery and stops after refund settlement', () => {
    const pending = getExecutionSteps(execution({ flow_type: 'bridge_then_swap', route_state: 'SWAP_REFUND_PENDING' }))
    expect(pending.filter(step => step.status === 'pending').map(step => step.id)).toEqual(['settlement'])
    const refunded = execution({ flow_type: 'bridge_then_swap', route_state: 'REFUNDED' })
    expect(getExecutionSteps(refunded).find(step => step.id === 'destination-swap')?.status).toBe('skipped')
    expect(getExecutionSteps(refunded).at(-1)?.status).toBe('complete')
    expect(isExecutionFinished(refunded)).toBe(true)
  })

  it('marks a missing gas drop failed when the main swap succeeds', () => {
    const current = execution({ route_state: 'SUCCESS' })
    expect(getExecutionSteps(current, true).find(step => step.id === 'gas-drop')?.status).toBe('failed')
    expect(isExecutionFinished(current)).toBe(true)
  })

  it.each([
    ['ethereum', 'skipped'],
    ['base', 'failed'],
  ] as const)('distinguishes gas non-execution from failure when refunded on %s', (chain, status) => {
    const current = execution({
      route_state: 'REFUNDED',
      data: { refund: { chain, token: '0x333', amount: '100' } },
    })
    expect(getExecutionSteps(current, true).find(step => step.id === 'gas-drop')?.status).toBe(status)
  })

  it('keeps delivered gas complete even when the main swap is refunded', () => {
    const current = execution({
      route_state: 'REFUNDED',
      data: { gas_drop: { token_in: '0x333', token_out: '0x444', output_amount: '1' } },
    })
    expect(getExecutionSteps(current).find(step => step.id === 'gas-drop')?.status).toBe('complete')
  })
})

describe('local KyberCross route progress', () => {
  it('does not treat quoted swap amounts as proof of completion', () => {
    const steps = getLocalExecutionSteps({
      status: 'Processing',
      kyberCrossRoute: {
        id: 'route',
        bridgeProvider: 'relay',
        flowType: 'swap_bridge_swap',
        sourceSwap: { tokenIn: 'input', tokenOut: 'bridge', inputAmount: '100', outputAmount: '99' },
        gasDropSwap: { tokenIn: 'bridge', tokenOut: 'native', inputAmount: '1', outputAmount: '1' },
      },
    })
    expect(steps.map(step => [step.id, step.status])).toEqual([
      ['created', 'complete'],
      ['source-swap', 'pending'],
      ['bridge', 'waiting'],
      ['gas-drop', 'waiting'],
      ['destination-swap', 'waiting'],
      ['settlement', 'waiting'],
    ])
  })

  it('shows generic steps for older records and does not guess the failed step', () => {
    expect(getLocalExecutionSteps({ status: 'Processing' }).map(step => step.id)).toEqual([
      'created',
      'bridge',
      'settlement',
    ])
    expect(getLocalExecutionSteps({ status: 'Failed' }).map(step => step.status)).toEqual([
      'complete',
      'unknown',
      'failed',
    ])
    expect(getLocalExecutionSteps({ status: 'Success' }).map(step => step.status)).toEqual([
      'complete',
      'complete',
      'complete',
    ])
  })
})

it('does not claim gas delivery or non-execution without a local gas result', () => {
  const kyberCrossRoute = { id: 'route', bridgeProvider: 'relay', gasDropSwap: { tokenIn: 'in', tokenOut: 'native' } }
  for (const status of ['Success', 'Failed', 'Refunded'] as const) {
    expect(getLocalExecutionSteps({ status, kyberCrossRoute }).find(step => step.id === 'gas-drop')?.status).toBe(
      'unknown',
    )
  }
  expect(
    getLocalExecutionSteps({
      status: 'Success',
      kyberCrossRoute,
      gasDropStatus: { status: 'Delivered', amount: '1' },
    }).find(step => step.id === 'gas-drop')?.status,
  ).toBe('complete')
})

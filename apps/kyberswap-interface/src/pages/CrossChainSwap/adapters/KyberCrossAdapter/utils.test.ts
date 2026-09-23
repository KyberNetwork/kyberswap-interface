import { type Address, type Hash } from 'viem'
import { describe, expect, it } from 'vitest'

import type { TrackingExecution } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/api'
import {
  getGasDropQuote,
  getKyberCrossBridgeProviders,
  mapRouteStateToSwapStatus,
  normalizeProvider,
} from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/utils'

const ADDRESS = '0x1111111111111111111111111111111111111111' as Address
const SOURCE_TX_HASH = `0x${'1'.repeat(64)}` as Hash
const FINAL_DEST_TX_HASH = `0x${'2'.repeat(64)}` as Hash
const BRIDGE_DEST_TX_HASH = `0x${'3'.repeat(64)}` as Hash

const createTrackingExecution = (overrides: Partial<TrackingExecution> = {}): TrackingExecution => ({
  route_plan_id: 'route-plan-id',
  from_address: ADDRESS,
  to_address: ADDRESS,
  source_chain: 'ethereum',
  dest_chain: 'base',
  flow_type: 'bridge_only',
  source_tx_hash: SOURCE_TX_HASH,
  token_in: ADDRESS,
  token_out: ADDRESS,
  bridge_provider: 'relay',
  route_state: 'BRIDGE_PENDING',
  data: {},
  ...overrides,
})

describe('KyberCross bridge providers', () => {
  it('normalizes and maps the CCIP source to the KyberCross provider id', () => {
    expect(normalizeProvider('CCIP')).toBe('ccip')
    expect(getKyberCrossBridgeProviders(['CCIP'])).toEqual(['ccip'])
  })
})

describe('mapRouteStateToSwapStatus', () => {
  it('uses the final destination hash and destination swap output for a successful swap route', () => {
    const result = mapRouteStateToSwapStatus(
      createTrackingExecution({
        flow_type: 'bridge_then_swap',
        route_state: 'SUCCESS',
        dest_tx_hash: FINAL_DEST_TX_HASH,
        data: {
          bridge: {
            source: { tx_hash: SOURCE_TX_HASH, token: ADDRESS, amount: '100' },
            dest: { tx_hash: BRIDGE_DEST_TX_HASH, token: ADDRESS, amount: '99' },
          },
          dest_swap: {
            token_in: ADDRESS,
            token_out: ADDRESS,
            output_amount: '95',
          },
        },
      }),
    )

    expect(result).toEqual({ txHash: FINAL_DEST_TX_HASH, status: 'Success', amountOut: '95' })
  })

  it('does not use the bridge fill hash as a destination swap fallback', () => {
    const result = mapRouteStateToSwapStatus(
      createTrackingExecution({
        flow_type: 'bridge_then_swap',
        route_state: 'SUCCESS',
        data: {
          bridge: {
            source: { tx_hash: SOURCE_TX_HASH, token: ADDRESS, amount: '100' },
            dest: { tx_hash: BRIDGE_DEST_TX_HASH, token: ADDRESS, amount: '99' },
          },
          dest_swap: {
            token_in: ADDRESS,
            token_out: ADDRESS,
            output_amount: '95',
          },
        },
      }),
    )

    expect(result).toEqual({ txHash: '', status: 'Success', amountOut: '95' })
  })

  it('falls back to the destination bridge amount and hash for a successful bridge-only route', () => {
    const result = mapRouteStateToSwapStatus(
      createTrackingExecution({
        route_state: 'SUCCESS',
        data: {
          bridge: {
            source: { tx_hash: SOURCE_TX_HASH, token: ADDRESS, amount: '100' },
            dest: { tx_hash: BRIDGE_DEST_TX_HASH, token: ADDRESS, amount: '99' },
          },
        },
      }),
    )

    expect(result).toEqual({ txHash: BRIDGE_DEST_TX_HASH, status: 'Success', amountOut: '99' })
  })

  it('uses the destination withdrawal amount when it is the final action', () => {
    const result = mapRouteStateToSwapStatus(
      createTrackingExecution({
        route_state: 'SUCCESS',
        dest_tx_hash: FINAL_DEST_TX_HASH,
        data: {
          dest_withdraw: { token: ADDRESS, withdraw_amount: '98', to_address: ADDRESS },
        },
      }),
    )

    expect(result).toEqual({ txHash: FINAL_DEST_TX_HASH, status: 'Success', amountOut: '98' })
  })

  it.each([
    ['REFUNDED', 'Refunded'],
    ['FAILED', 'Failed'],
  ] as const)('maps terminal route state %s to %s', (routeState, status) => {
    expect(mapRouteStateToSwapStatus(createTrackingExecution({ route_state: routeState }))).toEqual({
      txHash: '',
      status,
    })
  })

  it('keeps non-terminal route states processing', () => {
    expect(mapRouteStateToSwapStatus(createTrackingExecution({ route_state: 'BRIDGE_CLAIM_PENDING' }))).toEqual({
      txHash: '',
      status: 'Processing',
    })
  })
})

describe('Gas Drop settlement', () => {
  const bridge = {
    source: { tx_hash: SOURCE_TX_HASH, token: ADDRESS, amount: '100' },
    dest: { tx_hash: BRIDGE_DEST_TX_HASH, token: ADDRESS, amount: '99' },
  }
  const gasDrop = { token_in: ADDRESS, token_out: ADDRESS, output_amount: '1234' }

  it('keeps native gas separate from the actual main withdrawal on bridge-only routes', () => {
    expect(
      mapRouteStateToSwapStatus(
        createTrackingExecution({
          route_state: 'SUCCESS',
          dest_tx_hash: FINAL_DEST_TX_HASH,
          data: { bridge, gas_drop: gasDrop, withdraw: { token: ADDRESS, withdraw_amount: '97', to_address: ADDRESS } },
        }),
        true,
      ),
    ).toEqual({
      txHash: FINAL_DEST_TX_HASH,
      status: 'Success',
      amountOut: '97',
      gasDropStatus: { status: 'Delivered', amount: '1234' },
    })
  })

  it('does not overwrite the net output with the bridge amount or use the bridge fill as the gas transaction', () => {
    expect(
      mapRouteStateToSwapStatus(
        createTrackingExecution({
          route_state: 'SUCCESS',
          data: { bridge, gas_drop: gasDrop },
        }),
        true,
      ),
    ).toEqual({
      txHash: '',
      status: 'Success',
      amountOut: undefined,
      gasDropStatus: { status: 'Delivered', amount: '1234' },
    })
  })

  it('can deliver gas even when the main action is refunded', () => {
    expect(
      mapRouteStateToSwapStatus(
        createTrackingExecution({
          route_state: 'REFUNDED',
          data: { bridge, gas_drop: gasDrop },
        }),
        true,
      ),
    ).toMatchObject({ status: 'Refunded', gasDropStatus: { status: 'Delivered', amount: '1234' } })
  })

  it.each(['SUCCESS', 'REFUNDED'] as const)(
    'resolves an omitted gas leg after destination settlement: %s',
    route_state => {
      expect(mapRouteStateToSwapStatus(createTrackingExecution({ route_state, data: { bridge } }), true)).toMatchObject(
        { gasDropStatus: { status: 'Failed' } },
      )
    },
  )

  it('keeps the gas line pending until settlement, including GAS_DROP_PENDING', () => {
    expect(
      mapRouteStateToSwapStatus(createTrackingExecution({ route_state: 'GAS_DROP_PENDING', data: { bridge } }), true),
    ).toMatchObject({ status: 'Processing', gasDropStatus: { status: 'Pending' } })
  })

  it('does not claim a gas fallback on a source-chain refund', () => {
    expect(
      mapRouteStateToSwapStatus(
        createTrackingExecution({
          route_state: 'REFUNDED',
          data: { refund: { chain: 'ethereum', token: ADDRESS, amount: '100' } },
        }),
        true,
      ),
    ).toMatchObject({ gasDropStatus: { status: 'NotExecuted' } })
  })
})

describe('Gas Drop quote normalization', () => {
  it('uses the backend amounts without assuming $2 or 10% slippage', () => {
    expect(
      getGasDropQuote({
        gas_drop_swap: {
          token_in: ADDRESS,
          token_out: ADDRESS,
          input_amount: '1002716',
          expected_output_amount: '361515123138071',
          min_output_amount: '289212098510456',
          metadata: { route_id: 'route', route_summary: { amountOutUsd: '1.00201514', amountInUsd: '0.99972771' } },
        },
      }),
    ).toEqual({
      amount: '361515123138071',
      minAmount: '289212098510456',
      amountUsd: 1.00201514,
      inputAmountUsd: 0.99972771,
      inputToken: ADDRESS,
    })
  })
  it('treats an absent gas_drop_swap as not included', () => {
    expect(getGasDropQuote({})).toBeUndefined()
  })
})

import { type Address, type Hash } from 'viem'
import { describe, expect, it } from 'vitest'

import type { TrackingExecution } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/api'
import { mapRouteStateToSwapStatus } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/utils'

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

import type { Quote } from 'services/crossChain/registry'
import { describe, expect, it } from 'vitest'

import { getCrossChainRouteSteps } from 'components/TradeRouting/getCrossChainRouteSteps'

const quote = (provider: string, rawQuote: unknown) =>
  ({
    adapter: { getName: () => provider, getIcon: () => 'provider.svg' },
    quote: { rawQuote },
  } as Quote)

const token = { address: '0x1', symbol: 'USDC', decimals: 6, chainId: 8453 }
const swap = { tokenOut: token, outputAmount: '1000000', swapProvider: { name: '0x' } }

describe('cross-chain route display', () => {
  it.each<[string, unknown]>([
    ['LI.FI', { includedSteps: [{ type: 'swap', toolDetails: { name: 'OKX' }, action: { toToken: token } }] }],
    ['Across', { steps: { originSwap: swap, bridge: swap, destinationSwap: swap } }],
    ['Symbiosis', { routes: [{ provider: 'bitget', tokens: [token, token] }] }],
    [
      'Bungee',
      {
        routes: [
          {
            userOp: 'tx',
            quoteId: 'route',
            routeTags: ['SUGGESTED'],
            txData: { object: {} },
            routeDetails: { bridgeDetails: { protocol: { displayName: 'Across' } } },
          },
        ],
      },
    ],
    ['Relay', null],
  ])('shows only the %s provider even when internal route metadata exists', (provider, raw) => {
    expect(getCrossChainRouteSteps(quote(provider, raw))).toEqual([{ type: 'route', provider, logo: 'provider.svg' }])
  })

  it.each<[string, string[]]>([
    ['bridge_only', ['Across']],
    ['swap_then_bridge', ['KyberSwap', 'Across']],
    ['bridge_then_swap', ['Across', 'KyberSwap']],
    ['swap_bridge_swap', ['KyberSwap', 'Across', 'KyberSwap']],
  ])('preserves the KyberCross %s route plan', (flowType, providers) => {
    const raw = { data: { route_plan: { bridge: { provider: 'Across' }, flow_type: flowType } } }
    expect(getCrossChainRouteSteps(quote('KyberCross', raw))).toEqual(
      providers.map(provider => ({ type: provider === 'Across' ? 'bridge' : 'swap', provider })),
    )
  })

  it.each([null, { data: { route_plan: { bridge: { provider: 'Across' } } } }])(
    'shows the KyberCross provider when its route plan is unavailable or incomplete',
    raw => {
      expect(getCrossChainRouteSteps(quote('KyberCross', raw))).toEqual([
        { type: 'route', provider: 'KyberCross', logo: 'provider.svg' },
      ])
    },
  )
})

import { describe, expect, it } from 'vitest'

import type { Quote } from 'pages/CrossChainSwap/registry'

import { getRouteSteps } from './getRouteSteps'

const usdc = { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', decimals: 6, chainId: 8453 }
const quote = (provider: string, rawQuote: unknown) =>
  ({
    adapter: { getName: () => provider, getIcon: () => 'provider.svg' },
    quote: { rawQuote },
  } as Quote)

describe('cross-chain route display', () => {
  it('uses the ordered LI.FI swap and bridge steps with their own providers and raw output units', () => {
    const steps = getRouteSteps(
      quote('LI.FI', {
        includedSteps: [
          {
            type: 'swap',
            toolDetails: { name: 'OKX' },
            action: { toToken: { ...usdc, chainId: 1 } },
            estimate: { toAmount: '242750598' },
          },
          {
            type: 'cross',
            toolDetails: { name: 'Across' },
            action: { toToken: usdc },
            estimate: { toAmount: '242700000' },
          },
        ],
      }),
    )
    expect(steps.map(step => [step.type, step.provider, step.tokenOut?.chainId, step.amountOut])).toEqual([
      ['swap', 'OKX', 1, '242750598'],
      ['bridge', 'Across', 8453, '242700000'],
    ])
  })

  it('renders an Across bridge-only quote without fabricated swap legs', () => {
    expect(getRouteSteps(quote('Across', { steps: { bridge: { tokenOut: usdc, outputAmount: '1000000' } } }))).toEqual([
      { type: 'bridge', provider: 'Across', logo: 'provider.svg', tokenOut: usdc, amountOut: '1000000' },
    ])
  })

  it('keeps Across source and destination swaps in order', () => {
    const swap = { tokenOut: usdc, outputAmount: '1000000', swapProvider: { name: '0x' } }
    expect(
      getRouteSteps(quote('Across', { steps: { originSwap: swap, bridge: swap, destinationSwap: swap } })).map(
        step => step.type,
      ),
    ).toEqual(['swap', 'bridge', 'swap'])
  })

  it('uses the Socket route selected by execution, not another returned alternative', () => {
    const route = (name: string, suggested = false) => ({
      userOp: 'tx',
      quoteId: name,
      routeTags: suggested ? ['SUGGESTED'] : [],
      txData: { object: {} },
      routeDetails: { bridgeDetails: { protocol: { displayName: name } } },
    })
    expect(getRouteSteps(quote('Bungee', { routes: [route('Other'), route('Across', true)] }))).toEqual([
      { type: 'bridge', provider: 'Across', logo: undefined },
    ])
  })

  it('does not invent amounts or display placeholder token names from Symbiosis', () => {
    const steps = getRouteSteps(
      quote('Symbiosis', {
        routes: [
          { provider: 'symbiosis', tokens: [{ ...usdc, chainId: 1 }, usdc] },
          { provider: 'bitget', tokens: [usdc, { ...usdc, symbol: 'tokenOut' }] },
        ],
      }),
    )
    expect(steps.map(step => step.type)).toEqual(['bridge', 'swap'])
    expect(steps[0].amountOut).toBeUndefined()
    expect(steps[1].tokenOut).toBeUndefined()
  })

  it('uses the explicit KyberCross flow type, but does not infer it from bridge metadata alone', () => {
    const raw = { data: { route_plan: { bridge: { provider: 'Across' }, flow_type: 'swap_bridge_swap' } } }
    expect(getRouteSteps(quote('KyberCross', raw)).map(step => step.type)).toEqual(['swap', 'bridge', 'swap'])
    expect(getRouteSteps(quote('KyberCross', { data: { route_plan: { bridge: { provider: 'Across' } } } }))).toEqual([
      { type: 'route', provider: 'KyberCross', logo: 'provider.svg' },
    ])
  })

  it.each(['Relay', 'LI.FI', 'Across', 'Bungee'])('shows an aggregate route for missing %s metadata', provider => {
    expect(getRouteSteps(quote(provider, null))).toEqual([{ type: 'route', provider, logo: 'provider.svg' }])
  })
})

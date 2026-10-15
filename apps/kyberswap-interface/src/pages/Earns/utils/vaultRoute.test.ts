import { SwapRouteAction, SwapRouteDetail } from 'services/zap'
import { describe, expect, it } from 'vitest'

import { toRouteInputs, toRouteTokenMap } from 'pages/Earns/utils/vaultRoute'

const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const SHARE = '0xf0bb20865277aBd641a307eCe5Ee04E79073416C'

const tokens = toRouteTokenMap([
  { address: USDC, symbol: 'USDC', decimals: 6 },
  { address: WETH, symbol: 'WETH', decimals: 18 },
  { address: SHARE, symbol: 'liquidETH', decimals: 18 },
])

const amount = (address: string, raw: string) => ({ address, amount: raw, amountUsd: '0' })

const swap = (tokenIn: string, amountIn: string, tokenOut: string, amountOut: string): SwapRouteAction => ({
  type: 'ACTION_TYPE_AGGREGATOR_SWAP',
  aggregatorSwap: { swaps: [{ tokenIn: amount(tokenIn, amountIn), tokenOut: amount(tokenOut, amountOut) }] },
})

const vaultDeposit = (amountIn: string, sharesOut: string): SwapRouteAction => ({
  type: 'ACTION_TYPE_VAULT_DEPOSIT',
  vaultDeposit: { protocol: 'etherfi-liquid', tokenIn: amount(WETH, amountIn), tokenOut: amount(SHARE, sharesOut) },
})

const refund = (sharesOut: string): SwapRouteAction => ({
  type: 'ACTION_TYPE_REFUND',
  refund: { tokens: [amount(SHARE, sharesOut)] },
})

const routeOf = (actions: SwapRouteAction[]) =>
  ({
    zapDetails: { initialAmountUsd: '0', finalAmountUsd: '0', priceImpact: 0, suggestedSlippage: 0, actions },
  } as unknown as SwapRouteDetail)

describe('toRouteInputs', () => {
  it('lists the asset a vault deposit spends straight from the wallet', () => {
    const route = routeOf([vaultDeposit('13493701615947233', '12178088259483793'), refund('12178088259483793')])

    expect(toRouteInputs(route, tokens).map(leg => [leg.symbol, leg.amount])).toEqual([['WETH', '0.0134937']])
  })

  it('lists only the swap input when the swap produces everything the vault deposit spends', () => {
    const route = routeOf([
      swap(USDC, '100000000', WETH, '39913861676836288'),
      vaultDeposit('39913861676836288', '36022326868624670'),
      refund('36022326868624670'),
    ])

    expect(toRouteInputs(route, tokens).map(leg => leg.symbol)).toEqual(['USDC'])
  })

  it('lists the part of the vault deposit the swap did not produce as its own leg', () => {
    const route = routeOf([
      swap(USDC, '100000000', WETH, '40000000000000000'),
      vaultDeposit('50000000000000000', '45000000000000000'),
    ])

    expect(toRouteInputs(route, tokens).map(leg => [leg.symbol, leg.amount])).toEqual([
      ['USDC', '100'],
      ['WETH', '0.01'],
    ])
  })

  it('lists aggregator swaps into the share token as they are', () => {
    const route = routeOf([swap(USDC, '100000000', SHARE, '36000000000000000')])

    expect(toRouteInputs(route, tokens).map(leg => leg.symbol)).toEqual(['USDC'])
  })
})

import { PoolType as ZapPoolType } from '@kyberswap/liquidity-widgets'

import { EARN_DEXES, Exchange } from 'pages/Earns/constants'

export const ZAPIN_DEX_MAPPING: Record<Exchange, ZapPoolType> = {
  [Exchange.DEX_UNISWAPV3]: ZapPoolType.DEX_UNISWAPV3,
  [Exchange.DEX_PANCAKESWAPV3]: ZapPoolType.DEX_PANCAKESWAPV3,
  [Exchange.DEX_SUSHISWAPV3]: ZapPoolType.DEX_SUSHISWAPV3,
  [Exchange.DEX_QUICKSWAPV3ALGEBRA]: ZapPoolType.DEX_QUICKSWAPV3ALGEBRA,
  [Exchange.DEX_CAMELOTV3]: ZapPoolType.DEX_CAMELOTV3,
  [Exchange.DEX_THENAFUSION]: ZapPoolType.DEX_THENAFUSION,
  [Exchange.DEX_KODIAK_V3]: ZapPoolType.DEX_KODIAK_V3,
  [Exchange.DEX_UNISWAPV2]: ZapPoolType.DEX_UNISWAPV2,
  [Exchange.DEX_UNISWAP_V4]: ZapPoolType.DEX_UNISWAP_V4,
  [Exchange.DEX_UNISWAP_V4_FAIRFLOW]: ZapPoolType.DEX_UNISWAP_V4_FAIRFLOW,
  [Exchange.DEX_PANCAKE_INFINITY_CL]: ZapPoolType.DEX_PANCAKE_INFINITY_CL,
  [Exchange.DEX_PANCAKE_INFINITY_CL_FAIRFLOW]: ZapPoolType.DEX_PANCAKE_INFINITY_CL_FAIRFLOW,
}

export const getDexFromPoolType = (poolType: ZapPoolType): Exchange | undefined => {
  const entry = Object.entries(ZAPIN_DEX_MAPPING).find(
    ([exchange, type]) => type === poolType && EARN_DEXES[exchange as Exchange],
  )

  if (!entry) return undefined
  return entry[0] as Exchange
}

import { captureException } from '@sentry/react'

import { EVMNetworkInfo } from 'constants/networks/type'
import { ElasticPoolDetail } from 'types/pool'

type KNResponseType<T> = {
  data: T
}

type Token = {
  id: string
  symbol: string
  name: string
  decimals: string
  priceUSD: string
}

type AllChainElasticPool = {
  chain: EVMNetworkInfo['poolFarmRoute']
  id: string
  token0: Token
  token1: Token

  feeTier: string
  liquidity: string
  reinvestL: string
  sqrtPrice: string
  tick: string
  volumeToken0: string
  volumeToken1: string
  totalValueLockedToken0: string
  totalValueLockedToken1: string
  volumeUsd: string
  volumeUsdOneDayAgo: string
  volumeUsdTwoDaysAgo: string
  feesUsd: string
  feesUsdOneDayAgo: string
  feesUsdTwoDaysAgo: string
  totalValueLockedUsd: string
  totalValueLockedUsdOneDayAgo: string
  totalValueLockedUsdInRange: string
  apr: string
  farmApr: string
}

export const transformResponseAllChainElasticPool = (
  response: KNResponseType<{ pools: AllChainElasticPool[] }>,
): {
  [address: string]: ElasticPoolDetail
} => {
  try {
    return response.data.pools.reduce((acc, pool) => {
      acc[pool.id] = {
        chain: pool.chain,
        address: pool.id,

        token0: {
          address: pool.token0.id,
          name: pool.token0.name,
          symbol: pool.token0.symbol,
          decimals: parseInt(pool.token0.decimals),
        },
        token1: {
          address: pool.token1.id,
          name: pool.token1.name,
          symbol: pool.token1.symbol,
          decimals: parseInt(pool.token1.decimals),
        },

        feeTier: Number(pool.feeTier),

        volumeUSDLast24h: Number(pool.volumeUsd) - Number(pool.volumeUsdOneDayAgo),

        tvlUSD: Number(pool.totalValueLockedUsd),
        tvlUSDLast24h: Number(pool.totalValueLockedUsd),
        apr: Number(pool.apr),
        farmAPR: Number(pool.farmApr),

        liquidity: pool.liquidity,
        sqrtPrice: pool.sqrtPrice,
        reinvestL: pool.reinvestL,
        tick: Number(pool.tick),

        // TODO Hung Doan: do we need this?
        token0Price: 0,
        token1Price: 0,
        tvlToken0: 0,
        tvlToken1: 0,
      }
      return acc
    }, {} as { [address: string]: ElasticPoolDetail })
  } catch (error) {
    const e = new Error('API error', { cause: error })
    e.name = '[API error] KN elastic all chain'
    e.stack = ''
    console.error('API error', { e })
    captureException(e, {
      level: 'warning',
      extra: { error },
    })
    throw e
  }
}

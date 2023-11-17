import { ChainId, Token as TokenSDK, WETH } from '@kyberswap/ks-sdk-core'
import { FetchBaseQueryMeta } from '@reduxjs/toolkit/dist/query'
import { captureException } from '@sentry/react'

import { ZERO_ADDRESS } from 'constants/index'
import { EVM_NETWORKS, NETWORKS_INFO } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { ClassicPoolData } from 'hooks/pool/classic/type'
import { ElasticPoolDetail } from 'types/pool'
import { get24hValue } from 'utils'
import { toString } from 'utils/numbers'

type KNResponseType<T> = {
  data: T
}
export type Token = {
  id: string
  symbol: string
  name: string
  decimals: string
  priceUSD: string
}

export type AllChainClassicPool = {
  chain: EVMNetworkInfo['poolFarmRoute']
  protocol: 'classic'
  id: string
  feeUSD0: string
  feeUSD1: string
  feeAmount0: string
  feeAmount1: string
  token0: Token
  token1: Token
  reserve0: string
  reserve1: string
  vReserve0: string
  vReserve1: string
  totalSupply: string
  pair: string
  fee: string
  amp: string
  reserveUSD: string
  volumeUsd: string
  volumeUsdOneDayAgo: string
  volumeUsdTwoDaysAgo: string
  feeUSD: string
  feesUsdOneDayAgo: string
  feesUsdTwoDaysAgo: string
  apr: string
  farmApr: string
}

type AllChainElasticPool = {
  chain: EVMNetworkInfo['poolFarmRoute']
  protocol: 'elastic'
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
  volumeUsd7DaysAgo: string
  volumeUsd30DaysAgo: string
  feesUsd: string
  feesUsdOneDayAgo: string
  feesUsdTwoDaysAgo: string
  feesUsd7DaysAgo: string
  feesUsd30DaysAgo: string
  totalValueLockedUsd: string
  totalValueLockedUsdOneDayAgo: string
  totalValueLockedUsdInRange: string
  apr: string
  apr7d: string
  apr30d: string
  farmApr: string
}

const transformElasticPool = (pool: AllChainElasticPool, timeframe: '24h' | '7d' | '30d'): ElasticPoolDetail => {
  return {
    chain: pool.chain,
    protocol: pool.protocol,
    address: pool.id,
    feeTier: Number(pool.feeTier),

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

    liquidity: pool.liquidity,
    sqrtPrice: pool.sqrtPrice,
    reinvestL: pool.reinvestL,
    tick: Number(pool.tick),

    tvlUSD: Number(pool.totalValueLockedUsd),

    volumeUSDLast:
      Number(pool.volumeUsd) -
      (timeframe === '24h'
        ? Number(pool.volumeUsdOneDayAgo)
        : timeframe === '7d'
        ? Number(pool.volumeUsd7DaysAgo)
        : timeframe === '30d'
        ? Number(pool.volumeUsd30DaysAgo)
        : Number(pool.volumeUsdOneDayAgo)),
    volumeUSDLast24h: Number(pool.volumeUsd) - Number(pool.volumeUsdOneDayAgo),
    tvlUSDLast24h: Number(pool.totalValueLockedUsd),

    apr: Number(
      timeframe === '24h' ? pool.apr : timeframe === '7d' ? pool.apr7d : timeframe === '30d' ? pool.apr30d : pool.apr,
    ),
    farmAPR: Number(pool.farmApr),
  }
}

const transformClassicPool = (pool: AllChainClassicPool, _timeframe: '24h' | '7d' | '30d'): ClassicPoolData => {
  const oneDayVolumeUSD = toString(get24hValue(pool.volumeUsd, pool.volumeUsdOneDayAgo))
  const oneDayFeeUSD = toString(get24hValue(pool.feeUSD, pool.feesUsdOneDayAgo))
  const chainId = EVM_NETWORKS.find(chain => NETWORKS_INFO[chain].poolFarmRoute === pool.chain) || ChainId.MAINNET
  return {
    id: pool.id,
    protocol: pool.protocol,
    amp: pool.amp,
    fee: Number(pool.fee),
    reserve0: pool.reserve0,
    reserve1: pool.reserve1,
    vReserve0: pool.vReserve0,
    vReserve1: pool.vReserve1,

    totalSupply: pool.totalSupply,
    reserveUSD: pool.reserveUSD,
    volumeUSD: pool.volumeUsd,
    feeUSD: pool.feeUSD,
    oneDayVolumeUSD,
    oneDayVolumeUntracked: '0',
    oneDayFeeUSD,
    oneDayFeeUntracked: '0',

    token0:
      pool.token0.id === ZERO_ADDRESS
        ? WETH[chainId]
        : new TokenSDK(chainId, pool.token0.id, Number(pool.token0.decimals), pool.token0.symbol, pool.token0.name),
    token1:
      pool.token1.id === ZERO_ADDRESS
        ? WETH[chainId]
        : new TokenSDK(chainId, pool.token1.id, Number(pool.token1.decimals), pool.token1.symbol, pool.token1.name),
  }
}

export function transformResponseAllChainAllPool(
  response: KNResponseType<{ pools: (AllChainClassicPool | AllChainElasticPool)[] }>,
  _meta: FetchBaseQueryMeta | undefined,
  arg: {
    timeframe?: '24h' | '7d' | '30d'
  },
): {
  [address: string]: ClassicPoolData | ElasticPoolDetail
} {
  const timeframe = arg.timeframe || '24h'
  try {
    return response.data.pools.reduce((acc, pool) => {
      if (pool.protocol === 'elastic') acc[pool.id] = transformElasticPool(pool, timeframe)
      if (pool.protocol === 'classic') acc[pool.id] = transformClassicPool(pool, timeframe)
      return acc
    }, {} as { [address: string]: ElasticPoolDetail | ClassicPoolData })
  } catch (error) {
    const e = new Error('API error', { cause: error })
    e.name = '[API error] KN all pool all chain'
    e.stack = ''
    console.error('API error', { e })
    captureException(e, {
      level: 'warning',
      extra: { error },
    })
    throw e
  }
}

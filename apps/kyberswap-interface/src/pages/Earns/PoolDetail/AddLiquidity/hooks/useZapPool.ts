import {
  NATIVE_TOKEN_ADDRESS,
  POOL_CATEGORY,
  PoolType,
  Pool as ZapPool,
  univ2PoolNormalize,
  univ3PoolNormalize,
  univ4Types,
} from '@kyber/schema'
import { MAX_TICK, MIN_TICK, nearestUsableTick } from '@kyber/utils/uniswapv3'
import { skipToken } from '@reduxjs/toolkit/query'
import { useMemo } from 'react'
import { useCheckPairQuery } from 'services/marketOverview'
import { PoolDetail } from 'services/zapEarn'

import { isUniV3PoolType } from 'pages/Earns/PoolDetail/AddLiquidity/utils'

type UseZapPoolProps = {
  chainId: number
  pool: PoolDetail
  poolType: PoolType
}

const mapPoolCategory = (category?: string): POOL_CATEGORY => {
  switch (category) {
    case POOL_CATEGORY.STABLE_PAIR:
      return POOL_CATEGORY.STABLE_PAIR
    case POOL_CATEGORY.CORRELATED_PAIR:
      return POOL_CATEGORY.CORRELATED_PAIR
    case POOL_CATEGORY.COMMON_PAIR:
      return POOL_CATEGORY.COMMON_PAIR
    case POOL_CATEGORY.HIGH_VOLATILITY_PAIR:
      return POOL_CATEGORY.HIGH_VOLATILITY_PAIR
    case POOL_CATEGORY.EXOTIC_PAIR:
    default:
      return POOL_CATEGORY.EXOTIC_PAIR
  }
}

const buildPoolStats = (stats?: PoolDetail['poolStats']) => ({
  tvl: Number(stats?.tvl || 0),
  volume24h: Number(stats?.volume24h || 0),
  fees24h: Number(stats?.fees24h || 0),
  apr: Number(stats?.apr || 0),
  apr24h: Number(stats?.apr24h || 0),
  apr30d: Number(stats?.apr30d || 0),
  bonusApr: stats?.bonusApr,
  kemLMApr24h: Number(stats?.kemLMApr24h || 0),
  kemLMApr30d: Number(stats?.kemLMApr30d || 0),
  kemEGApr24h: Number(stats?.kemEGApr24h || 0),
  kemEGApr30d: Number(stats?.kemEGApr30d || 0),
})

export const useZapPool = ({ chainId, pool: rawPool, poolType }: UseZapPoolProps) => {
  const pairTokenAddresses = useMemo(() => {
    if (rawPool.tokens.length < 2) return null

    const isUniV4 = univ4Types.includes(poolType)
    const staticExtra = rawPool.staticExtra ? JSON.parse(rawPool.staticExtra) : null
    const isToken0Native = isUniV4 && staticExtra?.['0x0']?.[0]
    const isToken1Native = isUniV4 && staticExtra?.['0x0']?.[1]

    return {
      token0Address: (isToken0Native ? NATIVE_TOKEN_ADDRESS : rawPool.tokens[0].address).toLowerCase(),
      token1Address: (isToken1Native ? NATIVE_TOKEN_ADDRESS : rawPool.tokens[1].address).toLowerCase(),
    }
  }, [poolType, rawPool.staticExtra, rawPool.tokens])

  const { data: pairCategoryData, isLoading: pairCategoryLoading } = useCheckPairQuery(
    chainId && pairTokenAddresses
      ? {
          chainId,
          tokenIn: pairTokenAddresses.token0Address,
          tokenOut: pairTokenAddresses.token1Address,
        }
      : skipToken,
  )

  const normalizedPool = useMemo<ZapPool | null>(() => {
    if (rawPool.tokens.length < 2) return null
    const [token0, token1] = rawPool.tokens

    const category = pairCategoryLoading ? undefined : mapPoolCategory(pairCategoryData?.data?.category)
    const stats = buildPoolStats(rawPool.poolStats)
    const isFarming = Boolean(rawPool.programs?.includes('eg') || rawPool.programs?.includes('lm'))
    const isFarmingLm = Boolean(rawPool.programs?.includes('lm'))
    const fee = Number(rawPool.swapFee || 0)

    if (isUniV3PoolType(poolType)) {
      if (!rawPool.positionInfo) return null

      const parsedPool = univ3PoolNormalize.safeParse({
        address: rawPool.address,
        poolType,
        token0,
        token1,
        fee,
        tick: rawPool.positionInfo.tick,
        liquidity: rawPool.positionInfo.liquidity,
        sqrtPriceX96: rawPool.positionInfo.sqrtPriceX96,
        tickSpacing: rawPool.positionInfo.tickSpacing,
        ticks: rawPool.positionInfo.ticks || [],
        minTick: nearestUsableTick(MIN_TICK, rawPool.positionInfo.tickSpacing),
        maxTick: nearestUsableTick(MAX_TICK, rawPool.positionInfo.tickSpacing),
        category,
        stats,
        isFarming,
        isFarmingLm,
      })

      return parsedPool.success ? parsedPool.data : null
    }

    const parsedPool = univ2PoolNormalize.safeParse({
      address: rawPool.address,
      poolType,
      token0,
      token1,
      fee,
      reserves:
        rawPool.reserves && rawPool.reserves.length >= 2 ? [rawPool.reserves[0], rawPool.reserves[1]] : ['0', '0'],
      category,
      stats,
      isFarming,
      isFarmingLm,
    })

    return parsedPool.success ? parsedPool.data : null
  }, [pairCategoryData?.data?.category, pairCategoryLoading, poolType, rawPool])

  const loading = pairCategoryLoading
  const error = !loading && !normalizedPool ? 'Failed to prepare pool data' : ''

  return {
    data: normalizedPool,
    loading,
    error,
  }
}

export type ZapPoolState = ReturnType<typeof useZapPool>

import { POOL_CATEGORY, PoolType, Token, Pool as ZapPool, univ2PoolNormalize, univ3PoolNormalize } from '@kyber/schema'
import { MAX_TICK, MIN_TICK, nearestUsableTick } from '@kyber/utils/uniswapv3'
import { skipToken } from '@reduxjs/toolkit/query'
import { useMemo } from 'react'
import { PoolDetailToken } from 'services/zapEarn'
import { useAddLiquidityTokensQuery } from 'services/zapInService'

import { isUniV3PoolType } from 'pages/Earns/PoolDetail/AddLiquidity/utils'
import { Pool as PoolDetailPagePool } from 'pages/Earns/PoolDetail/types'

type UseZapPoolProps = {
  chainId: number
  pool: PoolDetailPagePool
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

const buildPoolStats = (stats?: PoolDetailPagePool['poolStats']) => ({
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

const getTokenLogo = (token?: (Token & { logoURI?: string }) | null, fallbackLogo?: string) =>
  token?.logo || token?.logoURI || fallbackLogo

const buildPoolToken = (poolToken: PoolDetailToken, tokenMap: Map<string, Token & { logoURI?: string }>): Token => {
  const metadata = tokenMap.get(poolToken.address.toLowerCase())

  return {
    address: poolToken.address,
    symbol: metadata?.symbol || poolToken.symbol,
    name: metadata?.name || poolToken.name || poolToken.symbol,
    decimals: metadata?.decimals ?? poolToken.decimals,
    logo: getTokenLogo(metadata, poolToken.logoURI),
    price: metadata?.price,
    isStable: metadata?.isStable,
  }
}

export const useZapPool = ({ chainId, pool: rawPool, poolType }: UseZapPoolProps) => {
  const tokenAddresses = useMemo(
    () => Array.from(new Set(rawPool.tokens.map(token => token.address.toLowerCase()).filter(Boolean))),
    [rawPool.tokens],
  )

  const { data: tokenMetadata = [], isLoading: tokenMetadataLoading } = useAddLiquidityTokensQuery(
    chainId && tokenAddresses.length
      ? {
          chainId,
          addresses: tokenAddresses,
        }
      : skipToken,
  )

  const tokenMetadataMap = useMemo(
    () =>
      new Map(
        tokenMetadata.map(token => [
          token.address.toLowerCase(),
          token as Token & {
            logoURI?: string
          },
        ]),
      ),
    [tokenMetadata],
  )

  const normalizedPool = useMemo<ZapPool | null>(() => {
    if (rawPool.tokens.length < 2) return null

    const token0 = buildPoolToken(rawPool.tokens[0], tokenMetadataMap)
    const token1 = buildPoolToken(rawPool.tokens[1], tokenMetadataMap)
    const category = mapPoolCategory(rawPool.category)
    const stats = buildPoolStats(rawPool.poolStats)
    const isFarming = Boolean(rawPool.programs?.includes('eg') || rawPool.programs?.includes('lm'))
    const isFarmingLm = Boolean(rawPool.programs?.includes('lm'))
    const fee = typeof rawPool.swapFee === 'number' ? rawPool.swapFee : Number(rawPool.feeTier || 0)

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
  }, [poolType, rawPool, tokenMetadataMap])

  const loading = Boolean(tokenAddresses.length) && tokenMetadataLoading
  const error = !loading && !normalizedPool ? 'Failed to prepare pool data' : ''

  return {
    data: normalizedPool,
    loading,
    error,
  }
}

export type ZapPoolState = ReturnType<typeof useZapPool>

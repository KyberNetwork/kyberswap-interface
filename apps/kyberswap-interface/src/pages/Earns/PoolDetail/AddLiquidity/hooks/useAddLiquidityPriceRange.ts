import { NETWORKS_INFO, Pool, PoolType, univ3PoolNormalize, univ3Types } from '@kyber/schema'
import { getPoolPrice } from '@kyber/utils'
import { formatNumber } from '@kyber/utils/dist/number'
import { tickToPrice } from '@kyber/utils/dist/uniswapv3'
import { useEffect, useMemo, useState } from 'react'

interface UseAddLiquidityPriceRangeProps {
  chainId: number
  pool: Pool | null
  poolType: PoolType
  initialTick?: { tickLower: number; tickUpper: number }
}

export default function useAddLiquidityPriceRange({
  chainId,
  pool,
  poolType,
  initialTick,
}: UseAddLiquidityPriceRangeProps) {
  const [revertPrice, setRevertPrice] = useState(false)
  const [tickLower, setTickLower] = useState<number | null>(null)
  const [tickUpper, setTickUpper] = useState<number | null>(null)

  const isUniV3 = useMemo(() => univ3Types.includes(poolType as any), [poolType])
  const normalizedPool = useMemo(() => {
    if (!pool || !isUniV3) return null

    const { success, data } = univ3PoolNormalize.safeParse(pool)
    return success ? data : null
  }, [isUniV3, pool])

  const wrappedNativeTokenAddress = (NETWORKS_INFO as any)[chainId]?.wrappedToken?.address?.toLowerCase()
  const defaultRevertPrice = useMemo(() => {
    if (!pool) return false

    const isToken0Native = pool.token0.address.toLowerCase() === wrappedNativeTokenAddress
    const isToken0Stable = pool.token0.isStable
    const isToken1Stable = pool.token1.isStable

    return Boolean(isToken0Stable || (isToken0Native && !isToken1Stable))
  }, [pool, wrappedNativeTokenAddress])

  // Reset the displayed quote direction and seeded ticks whenever the active pool changes.
  useEffect(() => {
    setRevertPrice(defaultRevertPrice)
    setTickLower(initialTick?.tickLower ?? null)
    setTickUpper(initialTick?.tickUpper ?? null)
  }, [defaultRevertPrice, initialTick?.tickLower, initialTick?.tickUpper, pool?.address])

  const poolPrice = useMemo(() => {
    if (!pool) return null
    return getPoolPrice({ pool, revertPrice })
  }, [pool, revertPrice])

  const minPrice = useMemo(() => {
    if (!normalizedPool || tickLower === null || tickUpper === null) return null

    return formatNumber(
      +tickToPrice(
        !revertPrice ? tickLower : tickUpper,
        normalizedPool.token0.decimals,
        normalizedPool.token1.decimals,
        revertPrice,
      ),
      8,
    )
  }, [normalizedPool, revertPrice, tickLower, tickUpper])

  const maxPrice = useMemo(() => {
    if (!normalizedPool || tickLower === null || tickUpper === null) return null

    return formatNumber(
      +tickToPrice(
        !revertPrice ? tickUpper : tickLower,
        normalizedPool.token0.decimals,
        normalizedPool.token1.decimals,
        revertPrice,
      ),
      8,
    )
  }, [normalizedPool, revertPrice, tickLower, tickUpper])

  return {
    isUniV3,
    normalizedPool,
    poolPrice,
    revertPrice,
    tickLower,
    tickUpper,
    minPrice,
    maxPrice,
    toggleRevertPrice: () => setRevertPrice(prev => !prev),
    setTickLower,
    setTickUpper,
  }
}

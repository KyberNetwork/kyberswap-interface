import { POOL_CATEGORY, Pool, univ3PoolNormalize } from '@kyber/schema'
import { MAX_TICK, MIN_TICK, nearestUsableTick, priceToClosestTick, tickToPrice } from '@kyber/utils/uniswapv3'

export const FULL_PRICE_RANGE = 'Full Range'

export const DEFAULT_PRICE_RANGE = {
  [POOL_CATEGORY.STABLE_PAIR]: 0.0005,
  [POOL_CATEGORY.CORRELATED_PAIR]: 0.001,
  [POOL_CATEGORY.COMMON_PAIR]: 0.1,
  [POOL_CATEGORY.EXOTIC_PAIR]: 0.3,
}

const PRICE_RANGE = {
  [POOL_CATEGORY.STABLE_PAIR]: [FULL_PRICE_RANGE, 0.01, 0.001, 0.0005],
  [POOL_CATEGORY.CORRELATED_PAIR]: [FULL_PRICE_RANGE, 0.05, 0.01, 0.001],
  [POOL_CATEGORY.COMMON_PAIR]: [FULL_PRICE_RANGE, 0.2, 0.1, 0.05],
  [POOL_CATEGORY.EXOTIC_PAIR]: [FULL_PRICE_RANGE, 0.5, 0.3, 0.2],
}

export interface RangeOption {
  range: number | string
  tickLower: number
  tickUpper: number
}

export const getRangePresetOptions = ({
  pool,
  poolPrice,
  revertPrice,
}: {
  pool: Pool
  poolPrice: number | null
  revertPrice: boolean
}): RangeOption[] => {
  if (!poolPrice || !pool.category) return []

  const priceOptions = PRICE_RANGE[pool.category as keyof typeof PRICE_RANGE] || PRICE_RANGE[POOL_CATEGORY.EXOTIC_PAIR]
  const { success, data } = univ3PoolNormalize.safeParse(pool)

  if (!success || !priceOptions.length) return []

  return priceOptions
    .map(item => {
      if (item === FULL_PRICE_RANGE) {
        return {
          range: item,
          tickLower: data.minTick,
          tickUpper: data.maxTick,
        }
      }

      const left = poolPrice * (1 - Number(item))
      const right = poolPrice * (1 + Number(item))
      const lower = priceToClosestTick(
        !revertPrice ? `${left}` : `${right}`,
        pool.token0.decimals,
        pool.token1.decimals,
        revertPrice,
      )
      const upper = priceToClosestTick(
        !revertPrice ? `${right}` : `${left}`,
        pool.token0.decimals,
        pool.token1.decimals,
        revertPrice,
      )

      if (lower === undefined || upper === undefined) return null

      const nearestLowerTick = nearestUsableTick(lower, data.tickSpacing)
      const nearestUpperTick = nearestUsableTick(upper, data.tickSpacing)

      let validLowerTick = nearestLowerTick
      let validUpperTick = nearestUpperTick

      if (nearestLowerTick === nearestUpperTick) {
        const lowerPriceFromTick = tickToPrice(
          nearestLowerTick,
          pool.token0.decimals,
          pool.token1.decimals,
          revertPrice,
        )

        if (Number(lowerPriceFromTick) > poolPrice) {
          validLowerTick -= data.tickSpacing
        } else {
          validUpperTick += data.tickSpacing
        }
      }

      return {
        range: item,
        tickLower: validLowerTick < MIN_TICK ? MIN_TICK : validLowerTick,
        tickUpper: validUpperTick > MAX_TICK ? MAX_TICK : validUpperTick,
      }
    })
    .filter(Boolean) as RangeOption[]
}

export const getDefaultRangePreset = (category?: Pool['category']) =>
  category
    ? DEFAULT_PRICE_RANGE[category as keyof typeof DEFAULT_PRICE_RANGE] || DEFAULT_PRICE_RANGE[POOL_CATEGORY.EXOTIC_PAIR]
    : undefined

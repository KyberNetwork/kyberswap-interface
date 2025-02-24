import { Bound, LiquidityChartRangeInput } from 'kane4-liquidity-chart'
import 'kane4-liquidity-chart/style.css'
import { useMemo } from 'react'
import { MinusCircle, PlusCircle } from 'react-feather'
import { useMedia } from 'react-use'
import { usePoolDetailQuery } from 'services/poolService'

import { MEDIA_WIDTHS } from 'theme'
import { toString } from 'utils/numbers'

import { MAX_TICK, MIN_TICK, nearestUsableTick, priceToClosestTick } from './uniswapv3'

export default function LiquidityChart({
  chainId,
  poolAddress,
  price,
  minPrice,
  maxPrice,
  revertPrice,
}: {
  chainId: number
  poolAddress: string
  price: number
  minPrice: number
  maxPrice: number
  revertPrice: boolean
}) {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { data: pool } = usePoolDetailQuery({ chainId, ids: poolAddress })
  const isUninitialized = !pool || Object.keys(pool).length === 0

  const fee = isUninitialized ? undefined : pool.swapFee * 10_000
  const tickCurrent = isUninitialized ? undefined : pool.positionInfo.tick
  const tickSpacing = isUninitialized ? undefined : pool.positionInfo.tickSpacing
  const ticks = isUninitialized ? [] : pool.positionInfo.ticks
  const liquidity = isUninitialized ? '0' : pool.positionInfo.liquidity
  const token0 = isUninitialized ? undefined : pool.tokens[0]
  const token1 = isUninitialized ? undefined : pool.tokens[1]

  const priceLower = !revertPrice ? minPrice : 1 / minPrice
  const priceUpper = !revertPrice ? maxPrice : 1 / maxPrice

  const ticksAtLimit: { [bound in Bound]?: boolean } | undefined = useMemo(() => {
    if (!tickSpacing || !token0 || !token1) return
    const minTick = nearestUsableTick(MIN_TICK, tickSpacing)
    const maxTick = nearestUsableTick(MAX_TICK, tickSpacing)
    const parsedMinPrice = toString(Number(minPrice.toFixed(18)))
    const parsedMaxPrice = toString(Number(maxPrice.toFixed(18)))

    const tickLower =
      parsedMinPrice === '0'
        ? minTick
        : priceToClosestTick(parsedMinPrice, token0.decimals, token1.decimals, revertPrice)
    const tickUpper =
      Number(parsedMaxPrice) === Infinity
        ? maxTick
        : priceToClosestTick(parsedMaxPrice, token0.decimals, token1.decimals, revertPrice)

    if (tickLower === undefined || tickUpper === undefined) return

    const usableTickLower = nearestUsableTick(Number(tickLower), tickSpacing)
    const usableTickUpper = nearestUsableTick(Number(tickUpper), tickSpacing)

    return {
      [Bound.LOWER]: usableTickLower === minTick,
      [Bound.UPPER]: usableTickUpper === maxTick,
    }
  }, [maxPrice, minPrice, revertPrice, tickSpacing, token0, token1])

  if (!ticksAtLimit) return null

  return (
    <LiquidityChartRangeInput
      id="earn-position-detail-liquidity-chart"
      pool={{
        fee,
        tickCurrent,
        tickSpacing,
        ticks,
        liquidity,
        token0,
        token1,
      }}
      price={{ current: price, lower: priceLower.toString(), upper: priceUpper.toString() }}
      ticksAtLimit={ticksAtLimit}
      revertPrice={revertPrice}
      zoomInIcon={<PlusCircle size={20} />}
      zoomOutIcon={<MinusCircle size={20} />}
      zoomPosition={{ top: undefined, left: undefined, right: '18px', bottom: upToSmall ? '35px' : '60px', gap: '8px' }}
      dimensions={upToSmall ? { width: 400, height: 200 } : { width: 800, height: 400 }}
      margins={upToSmall ? { top: 0, right: 10, bottom: 20, left: 10 } : { top: 20, right: 20, bottom: 40, left: 20 }}
    />
  )
}

import { MAX_TICK, MIN_TICK, nearestUsableTick, priceToClosestTick } from '@kyber/utils/dist/uniswapv3'
import { Bound, LiquidityChartRangeInput } from '@kyberswap/liquidity-chart'
import '@kyberswap/liquidity-chart/style.css'
import { useEffect, useMemo } from 'react'
import { useMedia } from 'react-use'
import { usePoolDetailQuery } from 'services/zapEarn'

import { ChartWrapper } from 'pages/Earns/PositionDetail/styles'
import { MEDIA_WIDTHS } from 'theme'
import { toString } from 'utils/numbers'

export default function LiquidityChart({
  chainId,
  poolAddress,
  price,
  minPrice,
  maxPrice,
  revertPrice,
  onReady,
}: {
  chainId: number
  poolAddress: string
  price: number
  minPrice: number
  maxPrice: number
  revertPrice: boolean
  onReady?: () => void
}) {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { data: pool } = usePoolDetailQuery({ chainId, address: poolAddress })
  const isUninitialized = !pool || Object.keys(pool).length === 0

  const fee = isUninitialized ? undefined : pool.swapFee * 10_000
  const tickCurrent = isUninitialized ? undefined : pool.positionInfo.tick
  const tickSpacing = isUninitialized ? undefined : pool.positionInfo.tickSpacing
  const ticks = isUninitialized ? [] : pool.positionInfo.ticks
  const liquidity = isUninitialized ? '0' : pool.positionInfo.liquidity
  const token0 = isUninitialized ? undefined : pool.tokens?.[0]
  const token1 = isUninitialized ? undefined : pool.tokens?.[1]

  const priceLower = !revertPrice ? minPrice : maxPrice === 0 ? 0 : 1 / maxPrice
  const priceUpper = !revertPrice
    ? maxPrice === 0
      ? Number.MAX_SAFE_INTEGER
      : maxPrice
    : minPrice === 0
    ? Number.MAX_SAFE_INTEGER
    : 1 / minPrice

  const ticksAtLimit: { [bound in Bound]?: boolean } | undefined = useMemo(() => {
    if (!tickSpacing || !token0 || !token1) return

    const minTick = nearestUsableTick(MIN_TICK, tickSpacing)
    const maxTick = nearestUsableTick(MAX_TICK, tickSpacing)

    if (minTick === undefined || maxTick === undefined) return

    const parsedMinPrice = toString(Number(minPrice.toFixed(18)))
    const parsedMaxPrice = toString(Number(maxPrice.toFixed(18)))
    const tickLower =
      parsedMinPrice === '0'
        ? minTick
        : priceToClosestTick(parsedMinPrice, token0.decimals, token1.decimals, revertPrice)
    const tickUpper =
      Number(parsedMaxPrice) === Infinity || Number(parsedMaxPrice) === 0
        ? maxTick
        : priceToClosestTick(parsedMaxPrice, token0.decimals, token1.decimals, revertPrice)

    if (tickLower === undefined || tickUpper === undefined) return

    const usableTickLower = nearestUsableTick(Number(tickLower), tickSpacing)
    const usableTickUpper = nearestUsableTick(Number(tickUpper), tickSpacing)

    if (usableTickLower === undefined || usableTickUpper === undefined) return

    return {
      [Bound.LOWER]: !revertPrice ? usableTickLower === minTick : usableTickUpper === maxTick,
      [Bound.UPPER]: !revertPrice ? usableTickUpper === maxTick : usableTickLower === minTick,
    }
  }, [maxPrice, minPrice, revertPrice, tickSpacing, token0, token1])

  const isReady = !!ticksAtLimit

  useEffect(() => {
    if (isReady) {
      onReady?.()
    }
  }, [isReady, onReady])

  if (!ticksAtLimit) return null

  return (
    <ChartWrapper>
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
          category: undefined,
        }}
        price={{ current: price, lower: priceLower.toString(), upper: priceUpper.toString() }}
        ticksAtLimit={ticksAtLimit}
        revertPrice={revertPrice}
        zoomPosition={{
          top: !upToSmall ? '0px' : '-16px',
          left: undefined,
          right: !upToSmall ? '-32px' : '0px',
          bottom: undefined,
          gap: '8px',
        }}
        dimensions={upToSmall ? { width: 400, height: 200 } : { width: 800, height: 400 }}
        margins={upToSmall ? { top: 0, right: 10, bottom: 20, left: 10 } : { top: 20, right: 20, bottom: 40, left: 20 }}
        alwaysShowLabel
        showLabelAsAmount
      />
    </ChartWrapper>
  )
}

export const LiquidityChartSkeleton = () => {
  const BAR_COUNT = 22
  const barHeights = [5, 10, 15, 30, 45, 55, 60, 70, 85, 90, 100, 100, 80, 75, 55, 60, 30, 30, 25, 15, 10, 5]

  return (
    <div className="relative mt-4 flex h-[300px] w-full flex-col justify-end overflow-hidden rounded-lg pt-2 max-sm:h-[210px]">
      <div className="z-[2] flex size-full items-end justify-center gap-0.5 px-2 pb-1">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <div
            key={i}
            className="relative flex min-w-[2px] max-w-[8px] flex-1 items-end overflow-hidden rounded-t bg-background"
            style={{ height: `${barHeights[i]}%` }}
          >
            <div
              className="absolute inset-0 z-[2] opacity-60 [animation:ks-shimmer-x_1.8s_linear_infinite]"
              style={{ background: 'linear-gradient(90deg, transparent 0%, #292929 50%, transparent 100%)' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

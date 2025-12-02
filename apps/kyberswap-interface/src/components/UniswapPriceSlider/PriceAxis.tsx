import { tickToPrice } from '@kyber/utils/dist/uniswapv3'
import React, { useMemo } from 'react'

import { PriceAxisContainer, PriceAxisLabel, PriceAxisLine, PriceAxisTick } from 'components/UniswapPriceSlider/styles'
import type { PriceAxisProps } from 'components/UniswapPriceSlider/types'
import { formatAxisPrice } from 'components/UniswapPriceSlider/utils'

const MAX_TICK_COUNT = 11 // More ticks for small ranges
const MIN_TICK_COUNT = 2 // Just first and last for extreme ranges

/**
 * Calculate the optimal number of ticks and minimum gap based on price range
 * More ticks for small ranges, fewer for large ranges
 */
const getOptimalTickConfig = (minPrice: number, maxPrice: number): { tickCount: number; minGapPercent: number } => {
  if (minPrice <= 0 || maxPrice <= 0) {
    return { tickCount: 7, minGapPercent: 15 }
  }

  // Calculate how many orders of magnitude the prices span
  const priceRatio = maxPrice / minPrice
  const ordersOfMagnitude = Math.log10(priceRatio)

  // Very small range (< 0.5 orders): many ticks, small gap
  if (ordersOfMagnitude <= 0.5) {
    return { tickCount: MAX_TICK_COUNT, minGapPercent: 12 }
  }
  // Small range (0.5 - 1 order): good amount of ticks
  if (ordersOfMagnitude <= 1) {
    return { tickCount: 9, minGapPercent: 14 }
  }
  // Medium range (1 - 2 orders)
  if (ordersOfMagnitude <= 2) {
    return { tickCount: 7, minGapPercent: 16 }
  }
  // Large range (2 - 4 orders)
  if (ordersOfMagnitude <= 4) {
    return { tickCount: 5, minGapPercent: 20 }
  }
  // Very large range (4 - 8 orders)
  if (ordersOfMagnitude <= 8) {
    return { tickCount: 3, minGapPercent: 30 }
  }
  // Extreme range (> 8 orders): just first and last
  return { tickCount: MIN_TICK_COUNT, minGapPercent: 40 }
}

/**
 * Calculate tick positions for the axis
 * Uses tick-space for even distribution (matching the slider)
 * When invertPrice, positions are flipped so lower inverted price is on left
 */
const calculateAxisTicks = (
  viewRange: { min: number; max: number },
  token0Decimals: number,
  token1Decimals: number,
  count: number,
  invertPrice?: boolean,
): Array<{ tick: number; price: number; position: number }> => {
  const tickRange = viewRange.max - viewRange.min
  if (tickRange <= 0) return []

  const step = tickRange / (count - 1)
  const ticks: Array<{ tick: number; price: number; position: number }> = []

  for (let i = 0; i < count; i++) {
    const tick = Math.round(viewRange.min + step * i)
    const price = +tickToPrice(tick, token0Decimals, token1Decimals, invertPrice)
    const normalPosition = ((tick - viewRange.min) / tickRange) * 100
    // When invertPrice, flip position so lower inverted price (from higher tick) is on left
    const position = invertPrice ? 100 - normalPosition : normalPosition

    ticks.push({ tick, price, position })
  }

  return ticks
}

/**
 * Filter ticks to ensure minimum spacing between labels
 * Only shows labels that have sufficient gap from previous label
 */
const filterOverlappingTicks = (
  ticks: Array<{ tick: number; price: number; position: number }>,
  minGapPercent: number,
): Array<{ tick: number; price: number; position: number; showLabel: boolean }> => {
  if (ticks.length === 0) return []

  const result: Array<{ tick: number; price: number; position: number; showLabel: boolean }> = []
  let lastLabelPosition = -Infinity

  for (let i = 0; i < ticks.length; i++) {
    const tick = ticks[i]
    const isFirst = i === 0
    const isLast = i === ticks.length - 1
    const gap = tick.position - lastLabelPosition

    // First tick always shows label
    if (isFirst) {
      lastLabelPosition = tick.position
      result.push({ ...tick, showLabel: true })
      continue
    }

    // Last tick: only show if enough gap, otherwise hide
    if (isLast) {
      const showLabel = gap >= minGapPercent
      if (showLabel) lastLabelPosition = tick.position
      result.push({ ...tick, showLabel })
      continue
    }

    // Middle ticks: show if enough gap from previous label
    const showLabel = gap >= minGapPercent
    if (showLabel) lastLabelPosition = tick.position
    result.push({ ...tick, showLabel })
  }

  return result
}

/**
 * Price axis component that displays price scale below the slider
 * Uses tick-based positioning to match the slider exactly
 * Dynamically reduces tick count when price range is very large
 */
function PriceAxis({ viewRange, token0Decimals, token1Decimals, invertPrice }: PriceAxisProps) {
  const axisTicks = useMemo(() => {
    // Get min and max prices to determine optimal tick config
    const minPrice = +tickToPrice(Math.round(viewRange.min), token0Decimals, token1Decimals, invertPrice)
    const maxPrice = +tickToPrice(Math.round(viewRange.max), token0Decimals, token1Decimals, invertPrice)
    const { tickCount, minGapPercent } = getOptimalTickConfig(
      Math.min(minPrice, maxPrice),
      Math.max(minPrice, maxPrice),
    )

    const ticks = calculateAxisTicks(viewRange, token0Decimals, token1Decimals, tickCount, invertPrice)
    // Sort by position ascending for proper overlap filtering
    const sortedTicks = [...ticks].sort((a, b) => a.position - b.position)
    return filterOverlappingTicks(sortedTicks, minGapPercent)
  }, [viewRange, token0Decimals, token1Decimals, invertPrice])

  return (
    <PriceAxisContainer>
      <PriceAxisLine />
      {axisTicks.map(({ price, position, showLabel }, index) => {
        // Only render if within visible range
        if (position < -2 || position > 102) return null
        return (
          <React.Fragment key={index}>
            <PriceAxisTick $position={position} />
            {showLabel && <PriceAxisLabel $position={position}>{formatAxisPrice(price)}</PriceAxisLabel>}
          </React.Fragment>
        )
      })}
    </PriceAxisContainer>
  )
}

export default React.memo(PriceAxis)

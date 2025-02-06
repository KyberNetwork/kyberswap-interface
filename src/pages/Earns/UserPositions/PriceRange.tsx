import { useMemo } from 'react'

import { formatDisplayNumber, toString } from 'utils/numbers'

import { MAX_TICK, MIN_TICK, nearestUsableTick, priceToClosestTick } from '../PositionDetail/LiquidityChart/uniswapv3'
import {
  CustomIconCurrentPrice as IconCurrentPrice,
  PriceRangeEl,
  PriceRangeWrapper,
  RangeFirstThumb,
  RangeSecondThumb,
  ThumbLabel,
} from './styles'

export default function PriceRange({
  minPrice,
  maxPrice,
  currentPrice,
  tickSpacing,
  token0Decimals,
  token1Decimals,
}: {
  minPrice: number
  maxPrice: number
  currentPrice: number
  tickSpacing: number
  token0Decimals: number
  token1Decimals: number
}) {
  const outOfRange = currentPrice < minPrice || currentPrice > maxPrice

  const ticksAtLimit = useMemo(() => {
    const minTick = nearestUsableTick(MIN_TICK, tickSpacing)
    const maxTick = nearestUsableTick(MAX_TICK, tickSpacing)
    const parsedMinPrice = toString(Number(minPrice.toFixed(18)))
    const parsedMaxPrice = toString(Number(maxPrice.toFixed(18)))

    const tickLower =
      parsedMinPrice === '0' ? minTick : priceToClosestTick(parsedMinPrice, token0Decimals, token1Decimals, false)
    const tickUpper =
      Number(parsedMaxPrice) === Infinity
        ? maxTick
        : priceToClosestTick(parsedMaxPrice, token0Decimals, token1Decimals, false)

    const usableTickLower = nearestUsableTick(Number(tickLower), tickSpacing)
    const usableTickUpper = nearestUsableTick(Number(tickUpper), tickSpacing)

    return {
      lower: usableTickLower === minTick,
      upper: usableTickUpper === maxTick,
    }
  }, [maxPrice, minPrice, tickSpacing, token0Decimals, token1Decimals])

  return (
    <PriceRangeWrapper outOfRange={outOfRange}>
      {outOfRange && <IconCurrentPrice lower={currentPrice < minPrice} color="#fbb324" />}
      <PriceRangeEl isLowestPrice={ticksAtLimit.lower} isHighestPrice={ticksAtLimit.upper}>
        {!outOfRange && (
          <IconCurrentPrice
            color={maxPrice - currentPrice > (maxPrice - minPrice) / 2 ? '#09ae7d' : '#6368f1'}
            style={{ left: `${((currentPrice - minPrice) / (maxPrice - minPrice)) * 100}%` }}
          />
        )}
        <RangeFirstThumb>
          <ThumbLabel>{ticksAtLimit.lower ? '0' : formatDisplayNumber(minPrice, { significantDigits: 6 })}</ThumbLabel>
        </RangeFirstThumb>
        <RangeSecondThumb>
          <ThumbLabel>{ticksAtLimit.upper ? '∞' : formatDisplayNumber(maxPrice, { significantDigits: 6 })}</ThumbLabel>
        </RangeSecondThumb>
      </PriceRangeEl>
    </PriceRangeWrapper>
  )
}

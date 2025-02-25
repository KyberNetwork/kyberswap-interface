import { t } from '@lingui/macro'
import { useMemo, useRef, useState } from 'react'

import { formatDisplayNumber, toString } from 'utils/numbers'

import { MAX_TICK, MIN_TICK, nearestUsableTick, priceToClosestTick } from '../PositionDetail/LiquidityChart/uniswapv3'
import {
  CurrentPriceTooltip,
  CurrentPriceWrapper,
  CustomIconCurrentPrice as IconCurrentPrice,
  IndicatorLabel,
  LowerPriceIndicator,
  PriceRangeEl,
  PriceRangeWrapper,
  UpperPriceIndicator,
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

  const ticksAtLimit: { lower: boolean; upper: boolean } | undefined = useMemo(() => {
    const minTick = nearestUsableTick(MIN_TICK, tickSpacing)
    const maxTick = nearestUsableTick(MAX_TICK, tickSpacing)

    if (minTick === undefined || maxTick === undefined) return

    const parsedMinPrice = toString(Number(minPrice.toFixed(18)))
    const parsedMaxPrice = toString(Number(maxPrice.toFixed(18)))

    const tickLower =
      parsedMinPrice === '0' ? minTick : priceToClosestTick(parsedMinPrice, token0Decimals, token1Decimals, false)
    const tickUpper =
      Number(parsedMaxPrice) === Infinity
        ? maxTick
        : priceToClosestTick(parsedMaxPrice, token0Decimals, token1Decimals, false)

    if (tickLower === undefined || tickUpper === undefined) return

    const usableTickLower = nearestUsableTick(Number(tickLower), tickSpacing)
    const usableTickUpper = nearestUsableTick(Number(tickUpper), tickSpacing)

    if (usableTickLower === undefined || usableTickUpper === undefined) return

    return {
      lower: usableTickLower === minTick,
      upper: usableTickUpper === maxTick,
    }
  }, [maxPrice, minPrice, tickSpacing, token0Decimals, token1Decimals])

  if (!ticksAtLimit) return null

  return (
    <PriceRangeWrapper outOfRange={outOfRange}>
      {outOfRange && (
        <CurrentPriceIndicator lower={currentPrice < minPrice} currentPrice={currentPrice} color="#fbb324" />
      )}
      <PriceRangeEl isLowestPrice={ticksAtLimit.lower} isHighestPrice={ticksAtLimit.upper}>
        {!outOfRange && (
          <CurrentPriceIndicator
            currentPrice={currentPrice}
            color={maxPrice - currentPrice > (maxPrice - minPrice) / 2 ? '#09ae7d' : '#6368f1'}
            left={(currentPrice - minPrice) / (maxPrice - minPrice)}
          />
        )}
        <LowerPriceIndicator>
          <IndicatorLabel>
            {ticksAtLimit.lower ? '0' : formatDisplayNumber(minPrice, { significantDigits: 6 })}
          </IndicatorLabel>
        </LowerPriceIndicator>
        <UpperPriceIndicator>
          <IndicatorLabel>
            {ticksAtLimit.upper ? '∞' : formatDisplayNumber(maxPrice, { significantDigits: 6 })}
          </IndicatorLabel>
        </UpperPriceIndicator>
      </PriceRangeEl>
    </PriceRangeWrapper>
  )
}

const CurrentPriceIndicator = ({
  currentPrice,
  lower,
  color,
  left,
}: {
  currentPrice: number
  lower?: boolean
  color: string
  left?: number
}) => {
  const [currentPriceHover, setCurrentPriceHover] = useState(false)
  const indicatorRef = useRef<HTMLDivElement>(null)

  const fullRangeElement = indicatorRef.current?.parentElement
  const maxWidth = fullRangeElement ? fullRangeElement.offsetWidth - 4 * 2 : 0 // 4 is width of lower & upper price indicator
  const indicatorWidth = 7.53

  return (
    <CurrentPriceWrapper
      ref={indicatorRef}
      lower={lower}
      style={{ left: left || left === 0 ? `${left * maxWidth - indicatorWidth / 2}px` : undefined }}
    >
      <IconCurrentPrice
        color={color}
        onMouseEnter={() => setCurrentPriceHover(true)}
        onMouseLeave={() => setCurrentPriceHover(false)}
      />
      <CurrentPriceTooltip show={currentPriceHover}>
        {t`Current Price`}: {formatDisplayNumber(currentPrice, { significantDigits: 6 })}
      </CurrentPriceTooltip>
    </CurrentPriceWrapper>
  )
}

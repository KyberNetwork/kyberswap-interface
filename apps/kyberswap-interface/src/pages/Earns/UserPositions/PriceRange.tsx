import { MAX_TICK, MIN_TICK, nearestUsableTick, priceToClosestTick } from '@kyber/utils/dist/uniswapv3'
import { t } from '@lingui/macro'
import { useMemo, useRef, useState } from 'react'

import {
  CurrentPriceTooltip,
  CurrentPriceWrapper,
  CustomIconCurrentPrice as IconCurrentPrice,
  IndicatorLabel,
  LowerPriceIndicator,
  PriceRangeEl,
  PriceRangeWrapper,
  UpperPriceIndicator,
} from 'pages/Earns/UserPositions/styles'
import { CoreProtocol, EarnDex } from 'pages/Earns/constants'
import { isForkFrom } from 'pages/Earns/utils'
import { formatDisplayNumber, toString } from 'utils/numbers'

export default function PriceRange({
  minPrice,
  maxPrice,
  currentPrice,
  tickSpacing,
  token0Decimals,
  token1Decimals,
  dex,
}: {
  minPrice: number
  maxPrice: number
  currentPrice: number
  tickSpacing: number
  token0Decimals: number
  token1Decimals: number
  dex: EarnDex
}) {
  const isUniv2 = isForkFrom(dex, CoreProtocol.UniswapV2)
  const outOfRange = isUniv2 ? false : currentPrice < minPrice || (currentPrice > maxPrice && maxPrice !== 0)

  const ticksAtLimit: { lower: boolean; upper: boolean } | undefined = useMemo(() => {
    if (isUniv2) return { lower: true, upper: true }
    if (!tickSpacing) return

    const minTick = nearestUsableTick(MIN_TICK, tickSpacing)
    const maxTick = nearestUsableTick(MAX_TICK, tickSpacing)

    if (minTick === undefined || maxTick === undefined) return

    const parsedMinPrice = toString(Number(minPrice.toFixed(18)))
    const parsedMaxPrice = toString(Number(maxPrice.toFixed(18)))

    const tickLower =
      parsedMinPrice === '0' ? minTick : priceToClosestTick(parsedMinPrice, token0Decimals, token1Decimals, false)
    const tickUpper =
      Number(parsedMaxPrice) === Infinity || Number(parsedMaxPrice) === 0
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
  }, [isUniv2, maxPrice, minPrice, tickSpacing, token0Decimals, token1Decimals])

  if (!ticksAtLimit) return null

  return (
    <PriceRangeWrapper outOfRange={outOfRange}>
      {outOfRange && (
        <CurrentPriceIndicator lower={currentPrice < minPrice} currentPrice={currentPrice} color="#fbb324" />
      )}
      <PriceRangeEl isLowestPrice={ticksAtLimit.lower} isHighestPrice={ticksAtLimit.upper} outOfRange={outOfRange}>
        {!outOfRange && (
          <CurrentPriceIndicator
            currentPrice={currentPrice}
            color={isUniv2 || maxPrice - currentPrice > (maxPrice - minPrice) / 2 ? '#09ae7d' : '#6368f1'}
            left={isUniv2 ? 0.2 : (currentPrice - minPrice) / (maxPrice - minPrice)}
          />
        )}
        <LowerPriceIndicator outOfRange={outOfRange}>
          <IndicatorLabel>
            {ticksAtLimit.lower ? '0' : formatDisplayNumber(minPrice, { significantDigits: 6 })}
          </IndicatorLabel>
        </LowerPriceIndicator>
        <UpperPriceIndicator outOfRange={outOfRange}>
          <IndicatorLabel>
            {ticksAtLimit.upper ? '∞' : formatDisplayNumber(maxPrice, { significantDigits: 6 })}
          </IndicatorLabel>
        </UpperPriceIndicator>
      </PriceRangeEl>
    </PriceRangeWrapper>
  )
}

const priceIndicatorWidth = 4
const currentPriceIndicatorWidth = 7.53

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
  const maxWidth = fullRangeElement ? fullRangeElement.offsetWidth - priceIndicatorWidth * 2 : 0 // 4 is width of lower & upper price indicator

  return (
    <CurrentPriceWrapper
      ref={indicatorRef}
      lower={lower}
      style={{
        left:
          left || left === 0
            ? `${left * maxWidth + priceIndicatorWidth - currentPriceIndicatorWidth / 2}px`
            : undefined,
      }}
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

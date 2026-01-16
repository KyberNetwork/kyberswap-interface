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
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import { formatDisplayNumber, toString } from 'utils/numbers'

export default function PriceRange({
  minPrice,
  maxPrice,
  currentPrice,
  tickSpacing,
  token0Decimals,
  token1Decimals,
  dex,
  invertPrice,
}: {
  minPrice: number
  maxPrice: number
  currentPrice: number
  tickSpacing: number
  token0Decimals: number
  token1Decimals: number
  dex: Exchange
  invertPrice?: boolean
}) {
  const isInvertPrice = !!invertPrice

  const priceLower = isInvertPrice ? (maxPrice === 0 ? 0 : 1 / maxPrice) : minPrice
  const priceUpper = isInvertPrice ? (minPrice === 0 ? Number.MAX_SAFE_INTEGER : 1 / minPrice) : maxPrice
  const displayedCurrentPrice =
    isInvertPrice && currentPrice !== 0 ? 1 / currentPrice : isInvertPrice ? Number.MAX_SAFE_INTEGER : currentPrice

  const isUniv2 = EARN_DEXES[dex as Exchange]?.isForkFrom === CoreProtocol.UniswapV2
  const outOfRange = isUniv2
    ? false
    : displayedCurrentPrice < priceLower ||
      (displayedCurrentPrice > priceUpper && priceUpper !== 0 && priceUpper !== Number.MAX_SAFE_INTEGER)

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

    const lowerAtMin = usableTickLower === minTick
    const upperAtMax = usableTickUpper === maxTick

    if (lowerAtMin && upperAtMax) {
      return { lower: true, upper: true }
    }

    return {
      lower: isInvertPrice ? upperAtMax : lowerAtMin,
      upper: isInvertPrice ? lowerAtMin : upperAtMax,
    }
  }, [isInvertPrice, isUniv2, maxPrice, minPrice, tickSpacing, token0Decimals, token1Decimals])

  if (!ticksAtLimit) return null

  const priceRange = priceUpper - priceLower
  const priceLeftPosition =
    priceRange === 0 || Number.isNaN(priceRange) ? undefined : (displayedCurrentPrice - priceLower) / priceRange

  return (
    <PriceRangeWrapper outOfRange={outOfRange}>
      {outOfRange && (
        <CurrentPriceIndicator
          lower={displayedCurrentPrice < priceLower}
          currentPrice={displayedCurrentPrice}
          color="#fbb324"
        />
      )}
      <PriceRangeEl isLowestPrice={ticksAtLimit.lower} isHighestPrice={ticksAtLimit.upper} outOfRange={outOfRange}>
        {!outOfRange && (
          <CurrentPriceIndicator
            currentPrice={displayedCurrentPrice}
            color={
              isUniv2 || priceUpper - displayedCurrentPrice > (priceUpper - priceLower) / 2 ? '#09ae7d' : '#6368f1'
            }
            left={isUniv2 ? 0.2 : priceLeftPosition}
          />
        )}
        <LowerPriceIndicator outOfRange={outOfRange}>
          <IndicatorLabel>
            {ticksAtLimit.lower ? '0' : formatDisplayNumber(priceLower, { significantDigits: 8 })}
          </IndicatorLabel>
        </LowerPriceIndicator>
        <UpperPriceIndicator outOfRange={outOfRange}>
          <IndicatorLabel>
            {ticksAtLimit.upper ? '∞' : formatDisplayNumber(priceUpper, { significantDigits: 8 })}
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
        {t`Current Price`}: {formatDisplayNumber(currentPrice, { significantDigits: 8 })}
      </CurrentPriceTooltip>
    </CurrentPriceWrapper>
  )
}

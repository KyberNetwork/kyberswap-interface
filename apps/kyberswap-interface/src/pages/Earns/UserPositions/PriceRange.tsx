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

/**
 * Smart price formatter for range labels.
 * Uses significantDigits to preserve meaningful trailing digits (e.g. 1.0007002).
 *
 * The key idea: compute how many significant digits are needed so that
 * the two prices in a range are clearly distinguishable.
 */
function formatPriceRangeLabel(price: number, otherPrice: number): string {
  if (price === 0 || !Number.isFinite(price)) return '0'

  const diff = Math.abs(price - otherPrice)
  if (diff === 0) return formatDisplayNumber(price, { significantDigits: 6 })

  // How many significant digits do we need?
  // = digits to represent the price magnitude + digits to capture the difference + buffer
  // e.g. price=1.0007, diff=0.0004 → magnitude digits=1, diff digits=ceil(-log10(0.0004))=4, +2 buffer → 7
  // e.g. price=595.49, diff=120.93 → magnitude digits=3, diff digits=ceil(-log10(120.93))=-2 → clamped to 0, +2 → 5
  const magnitudeDigits = price >= 1 ? Math.floor(Math.log10(price)) + 1 : 0
  const diffPrecision = diff >= 1 ? 0 : Math.ceil(-Math.log10(diff))
  const sigDigits = Math.min(Math.max(magnitudeDigits + diffPrecision + 2, 4), 10)

  return formatDisplayNumber(price, { significantDigits: sigDigits })
}

function computeTicks(
  minPrice: number,
  maxPrice: number,
  currentPrice: number,
  tickSpacing: number,
  token0Decimals: number,
  token1Decimals: number,
): { tickLower: number; tickUpper: number; tickCurrent: number; minTick: number; maxTick: number } | undefined {
  if (!tickSpacing) return

  const minTick = nearestUsableTick(MIN_TICK, tickSpacing)
  const maxTick = nearestUsableTick(MAX_TICK, tickSpacing)
  if (minTick === undefined || maxTick === undefined) return

  const parsedMinPrice = toString(Number(minPrice.toFixed(18)))
  const parsedMaxPrice = toString(Number(maxPrice.toFixed(18)))
  const parsedCurrentPrice = toString(Number(currentPrice.toFixed(18)))

  const rawTickLower =
    parsedMinPrice === '0' ? minTick : priceToClosestTick(parsedMinPrice, token0Decimals, token1Decimals, false)
  const rawTickUpper =
    Number(parsedMaxPrice) === Infinity || Number(parsedMaxPrice) === 0
      ? maxTick
      : priceToClosestTick(parsedMaxPrice, token0Decimals, token1Decimals, false)
  const rawTickCurrent =
    parsedCurrentPrice === '0' ? minTick : priceToClosestTick(parsedCurrentPrice, token0Decimals, token1Decimals, false)

  if (rawTickLower === undefined || rawTickUpper === undefined || rawTickCurrent === undefined) return

  const tickLower = nearestUsableTick(Number(rawTickLower), tickSpacing)
  const tickUpper = nearestUsableTick(Number(rawTickUpper), tickSpacing)

  if (tickLower === undefined || tickUpper === undefined) return

  return { tickLower, tickUpper, tickCurrent: Number(rawTickCurrent), minTick, maxTick }
}

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

  const tickData = useMemo(() => {
    if (isUniv2) return undefined
    return computeTicks(minPrice, maxPrice, currentPrice, tickSpacing, token0Decimals, token1Decimals)
  }, [isUniv2, minPrice, maxPrice, currentPrice, tickSpacing, token0Decimals, token1Decimals])

  const ticksAtLimit = useMemo(() => {
    if (isUniv2) return { lower: true, upper: true }
    if (!tickData) return undefined

    const { tickLower, tickUpper, minTick, maxTick } = tickData
    const lowerAtMin = tickLower === minTick
    const upperAtMax = tickUpper === maxTick

    if (lowerAtMin && upperAtMax) return { lower: true, upper: true }

    return {
      lower: isInvertPrice ? upperAtMax : lowerAtMin,
      upper: isInvertPrice ? lowerAtMin : upperAtMax,
    }
  }, [isInvertPrice, isUniv2, tickData])

  const outOfRange = useMemo(() => {
    if (isUniv2) return false
    return (
      displayedCurrentPrice < priceLower ||
      (displayedCurrentPrice > priceUpper && priceUpper !== 0 && priceUpper !== Number.MAX_SAFE_INTEGER)
    )
  }, [isUniv2, displayedCurrentPrice, priceLower, priceUpper])

  // Tick-based positioning: use log-scale (ticks) for accurate proportional display
  const { currentPricePosition, rangeWidthPct, rangeLeftPct } = useMemo(() => {
    if (isUniv2 || !tickData || !ticksAtLimit) {
      return { currentPricePosition: 0.2, rangeWidthPct: 100, rangeLeftPct: 0 }
    }

    const { tickLower, tickUpper, tickCurrent } = tickData
    const tickRange = tickUpper - tickLower

    // Current price position within the range bar (0 to 1)
    let cpPos: number | undefined
    if (tickRange > 0 && !outOfRange) {
      cpPos = (tickCurrent - tickLower) / tickRange
      cpPos = Math.max(0, Math.min(1, cpPos))
    }

    // Determine bar width based on tick range relative to a reference.
    // Wider ranges (more ticks) get wider bars, narrower ranges get narrower bars.
    // We use a logarithmic scale: width = clamp(log2(tickRange) / log2(MAX_TICK_RANGE) * 100, 20, 100)
    const isFullRange = ticksAtLimit.lower && ticksAtLimit.upper
    let widthPct = 100
    let leftPct = 0

    if (!isFullRange && tickRange > 0) {
      // Use sqrt of log ratio to compress the range upward:
      // most positions cluster around 60-90% width while still differentiating narrow vs wide
      const maxTickRange = MAX_TICK - MIN_TICK // ~1,774,544
      const logRatio = Math.log(tickRange) / Math.log(maxTickRange)
      widthPct = Math.max(30, Math.min(95, Math.sqrt(logRatio) * 100))
      leftPct = (100 - widthPct) / 2
    }

    return {
      currentPricePosition: cpPos,
      rangeWidthPct: widthPct,
      rangeLeftPct: leftPct,
    }
  }, [isUniv2, tickData, ticksAtLimit, outOfRange])

  if (!ticksAtLimit) return null

  return (
    <PriceRangeWrapper outOfRange={outOfRange}>
      {outOfRange && (
        <CurrentPriceIndicator
          lower={displayedCurrentPrice < priceLower}
          currentPrice={displayedCurrentPrice}
          color="#fbb324"
        />
      )}
      <PriceRangeEl
        outOfRange={outOfRange}
        style={{
          width: `${rangeWidthPct}%`,
          left: `${rangeLeftPct}%`,
        }}
      >
        {!outOfRange && (
          <CurrentPriceIndicator
            currentPrice={displayedCurrentPrice}
            color={
              isUniv2 || priceUpper - displayedCurrentPrice > (priceUpper - priceLower) / 2 ? '#09ae7d' : '#6368f1'
            }
            left={currentPricePosition}
          />
        )}
        <LowerPriceIndicator outOfRange={outOfRange}>
          <IndicatorLabel align="right">
            {ticksAtLimit.lower ? '0' : formatPriceRangeLabel(priceLower, priceUpper)}
          </IndicatorLabel>
        </LowerPriceIndicator>
        <UpperPriceIndicator outOfRange={outOfRange}>
          <IndicatorLabel align="left">
            {ticksAtLimit.upper ? '∞' : formatPriceRangeLabel(priceUpper, priceLower)}
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
  const maxWidth = fullRangeElement ? fullRangeElement.offsetWidth - priceIndicatorWidth * 2 : 0

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

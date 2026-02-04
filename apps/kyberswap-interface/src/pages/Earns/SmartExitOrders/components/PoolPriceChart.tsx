import { useMemo } from 'react'
import { Box, Text } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import { formatDisplayNumber } from 'utils/numbers'

const PoolPriceChartWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin-bottom: 6px;
  `}
`

const PoolPriceChartContainer = styled.div`
  position: relative;
  height: 30px;
  width: 100%;
`

const PoolPriceBar = styled.div`
  height: 4px;
  width: 100%;
  background: ${({ theme }) => theme.border};
  border-radius: 4px;
  position: absolute;
  bottom: 0;
  overflow: hidden;
`

const PoolPriceRangeHighlight = styled.div<{ $left: number; $width: number; $color: string }>`
  position: absolute;
  top: 0;
  height: 100%;
  left: ${({ $left }) => $left}%;
  width: ${({ $width }) => $width}%;
  background: ${({ $color }) => $color};
  opacity: 0.5;
`

const CurrentPriceLabel = styled.div<{ $left: number }>`
  position: absolute;
  bottom: 18px;
  left: ${({ $left }) => $left}%;
  transform: translateX(-50%);
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  white-space: nowrap;
`

const TargetPriceLabel = styled.div<{ $left: number; $alignLeft: boolean }>`
  position: absolute;
  bottom: 11px;
  left: ${({ $left }) => $left}%;
  transform: ${({ $alignLeft }) => ($alignLeft ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)')};
  font-size: 12px;
  color: ${({ theme }) => theme.text};
  white-space: nowrap;
`

/**
 * Generates an SVG path for a brush-style handle with an oval top and straight stem.
 * Used for the target price indicator on the chart.
 */
const brushHandlePath = (height: number): string => {
  return [
    `M 0.5 0`,
    `Q 0 0 0 1.5`,
    `v 3.5`,
    `C -5 5 -5 17 0 17`,
    `v ${height - 19}`,
    `Q 0 ${height} 0.5 ${height}`,
    `Q 1 ${height} 1 ${height - 1.5}`,
    `V 17`,
    `C 6 17 6 5 1 5`,
    `V 1.5`,
    `Q 1 0 0.5 0`,
  ].join(' ')
}

type PoolPriceChartProps = {
  targetPrice: number
  currentPrice: number | undefined
  isLte: boolean
}

const PoolPriceChart = ({ targetPrice, currentPrice, isLte }: PoolPriceChartProps) => {
  const theme = useTheme()

  const { currentPricePosition, targetPricePosition, highlightLeft, highlightWidth } = useMemo(() => {
    if (currentPrice === undefined) {
      // When no current price, show target in middle with highlight from edge
      return {
        currentPricePosition: undefined,
        targetPricePosition: 50,
        highlightLeft: isLte ? 0 : 50,
        highlightWidth: 50,
      }
    }

    // Calculate range: use current price and target price to define the visible range
    const priceDiff = Math.abs(targetPrice - currentPrice)
    // Use minimum padding to avoid overlapping indicators when prices are very close
    const padding = Math.max(priceDiff * 0.5, targetPrice * 0.01)
    const minP = Math.min(currentPrice, targetPrice) - padding
    const maxP = Math.max(currentPrice, targetPrice) + padding
    const range = maxP - minP

    const currentPos = range > 0 ? ((currentPrice - minP) / range) * 100 : 50
    const targetPos = range > 0 ? ((targetPrice - minP) / range) * 100 : 50

    const clampedCurrentPos = Math.max(5, Math.min(95, currentPos))
    const clampedTargetPos = Math.max(5, Math.min(95, targetPos))

    // Calculate highlight: from left edge to target (lte) or from target to right edge (gte)
    const hlLeft = isLte ? 0 : clampedTargetPos
    const hlWidth = isLte ? clampedTargetPos : 100 - clampedTargetPos

    return {
      currentPricePosition: clampedCurrentPos,
      targetPricePosition: clampedTargetPos,
      highlightLeft: hlLeft,
      highlightWidth: hlWidth,
    }
  }, [currentPrice, targetPrice, isLte])

  // Color logic: primary/green for lte (≤), blue for gte (≥)
  const handleColor = isLte ? theme.primary : theme.blue

  return (
    <PoolPriceChartWrapper>
      <Text color={theme.subText} fontSize="12px" textAlign="left">
        Pool Price is {isLte ? '≤' : '≥'}{' '}
        <Text as="span" color={theme.text}>
          {formatDisplayNumber(targetPrice, { significantDigits: 6 })}
        </Text>
      </Text>
      <PoolPriceChartContainer>
        {/* Current price label - positioned above current price indicator */}
        {currentPricePosition !== undefined && currentPrice !== undefined && (
          <CurrentPriceLabel $left={currentPricePosition}>
            {formatDisplayNumber(currentPrice, { significantDigits: 4 })}
          </CurrentPriceLabel>
        )}

        {/* Target price label - positioned beside handle (left if target < current, right otherwise) */}
        <TargetPriceLabel
          $left={targetPricePosition}
          $alignLeft={currentPricePosition !== undefined ? targetPricePosition < currentPricePosition : isLte}
        >
          {formatDisplayNumber(targetPrice, { significantDigits: 4 })}
        </TargetPriceLabel>

        {/* Track bar */}
        <PoolPriceBar>
          {/* Highlight range */}
          <PoolPriceRangeHighlight $left={highlightLeft} $width={highlightWidth} $color={handleColor} />
        </PoolPriceBar>

        {/* Target price handle (oval at top, straight stem - matches price-slider) */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '-6px',
            left: `${targetPricePosition}%`,
            transform: 'translateX(-50%) scale(0.95)',
            zIndex: 2,
          }}
        >
          <svg width="22" height="35" viewBox="-11 0 22 35" style={{ overflow: 'visible', display: 'block' }}>
            <path d={brushHandlePath(35)} fill="transparent" stroke={handleColor} strokeWidth={1.5} />
          </svg>
        </Box>

        {/* Current price indicator (arrow style - centered on track, extends upward) */}
        {currentPricePosition !== undefined && (
          <Box
            sx={{
              position: 'absolute',
              bottom: '-6px',
              left: `${currentPricePosition}%`,
              transform: 'translateX(-50%)',
              zIndex: 3,
            }}
          >
            {/* Vertical line with arrow head pointing down */}
            <Box
              sx={{
                width: '2px',
                height: '18px',
                background: theme.subText,
                borderRadius: '1px',
                position: 'relative',
              }}
            >
              {/* Arrow head */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '-5px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: `5px solid ${theme.subText}`,
                }}
              />
            </Box>
          </Box>
        )}
      </PoolPriceChartContainer>
    </PoolPriceChartWrapper>
  )
}

export default PoolPriceChart

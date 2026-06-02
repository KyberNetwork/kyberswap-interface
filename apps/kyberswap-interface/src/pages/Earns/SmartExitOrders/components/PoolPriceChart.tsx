import { useMemo } from 'react'

import useTheme from 'hooks/useTheme'
import { formatDisplayNumber } from 'utils/numbers'

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

  const { currentPricePosition, targetPricePosition, highlightLeft, highlightWidth, positionsTooClose } =
    useMemo(() => {
      if (currentPrice === undefined) {
        return {
          currentPricePosition: undefined,
          targetPricePosition: 50,
          highlightLeft: isLte ? 0 : 50,
          highlightWidth: 50,
          positionsTooClose: false,
        }
      }

      const priceDiff = Math.abs(targetPrice - currentPrice)
      const padding = Math.max(priceDiff * 0.5, targetPrice * 0.01)
      const minP = Math.min(currentPrice, targetPrice) - padding
      const maxP = Math.max(currentPrice, targetPrice) + padding
      const range = maxP - minP

      const currentPos = range > 0 ? ((currentPrice - minP) / range) * 100 : 50
      const targetPos = range > 0 ? ((targetPrice - minP) / range) * 100 : 50

      const clampedCurrentPos = Math.max(5, Math.min(95, currentPos))
      const clampedTargetPos = Math.max(5, Math.min(95, targetPos))

      const hlLeft = isLte ? 0 : clampedTargetPos
      const hlWidth = isLte ? clampedTargetPos : 100 - clampedTargetPos

      const positionsTooClose = Math.abs(clampedCurrentPos - clampedTargetPos) < 15

      return {
        currentPricePosition: clampedCurrentPos,
        targetPricePosition: clampedTargetPos,
        highlightLeft: hlLeft,
        highlightWidth: hlWidth,
        positionsTooClose,
      }
    }, [currentPrice, targetPrice, isLte])

  const handleColor = isLte ? '#31CB9E' : '#7289DA'

  let currentLabelTransform = 'translateX(-50%)'
  if (currentPricePosition !== undefined && positionsTooClose) {
    currentLabelTransform = currentPricePosition < targetPricePosition ? 'translateX(-100%)' : 'translateX(0)'
  }

  const targetAlignLeft = currentPricePosition !== undefined ? targetPricePosition < currentPricePosition : isLte
  const targetLabelTransform = targetAlignLeft ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)'

  return (
    <div className="flex w-full flex-col gap-1 max-md:mb-1.5">
      <span className="text-left text-xs text-subText">
        Pool Price is {isLte ? '≤' : '≥'}{' '}
        <span className="text-text">{formatDisplayNumber(targetPrice, { significantDigits: 6 })}</span>
      </span>
      <div className="relative h-[30px] w-full">
        {currentPricePosition !== undefined && currentPrice !== undefined && (
          <div
            className="absolute bottom-[18px] whitespace-nowrap text-xs text-subText"
            style={{ left: `${currentPricePosition}%`, transform: currentLabelTransform }}
          >
            {formatDisplayNumber(currentPrice, { significantDigits: 4 })}
          </div>
        )}

        <div
          className="absolute bottom-[11px] whitespace-nowrap text-xs text-text"
          style={{ left: `${targetPricePosition}%`, transform: targetLabelTransform }}
        >
          {formatDisplayNumber(targetPrice, { significantDigits: 4 })}
        </div>

        <div className="absolute bottom-0 h-1 w-full overflow-hidden rounded bg-border">
          <div
            className="absolute top-0 h-full opacity-50"
            style={{ left: `${highlightLeft}%`, width: `${highlightWidth}%`, background: handleColor }}
          />
        </div>

        <div
          className="absolute -bottom-1.5 z-[2]"
          style={{ left: `${targetPricePosition}%`, transform: 'translateX(-50%) scale(0.95)' }}
        >
          <svg width="22" height="35" viewBox="-11 0 22 35" className="block overflow-visible">
            <path d={brushHandlePath(35)} fill="transparent" stroke={handleColor} strokeWidth={1.5} />
          </svg>
        </div>

        {currentPricePosition !== undefined && (
          <div
            className="absolute -bottom-1.5 z-[3]"
            style={{ left: `${currentPricePosition}%`, transform: 'translateX(-50%)' }}
          >
            <div className="relative h-[18px] w-0.5 rounded-[1px] bg-subText">
              <div
                className="absolute left-1/2 size-0 -translate-x-1/2"
                style={{
                  top: '-5px',
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: `5px solid ${theme.subText}`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PoolPriceChart

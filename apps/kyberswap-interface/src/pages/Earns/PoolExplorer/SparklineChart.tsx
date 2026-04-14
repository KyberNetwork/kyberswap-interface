import Portal from '@reach/portal'
import dayjs from 'dayjs'
import { useId, useMemo, useRef } from 'react'
import { Box, Text } from 'rebass'
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import { formatDisplayNumber } from 'utils/numbers'

type SparklinePoint = {
  dateLabel: string
  value: number
}

const TooltipPill = styled.div<{ $left: number; $top: number }>`
  position: fixed;
  top: ${({ $top }) => `${$top}px`};
  left: ${({ $left }) => `${$left}px`};
  transform: translateX(-50%);
  z-index: 999;
  pointer-events: none;
  background-color: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.disableText};
  border-radius: 20px;
  padding: 4px 8px;
`

const SparklineTooltip = ({
  active,
  coordinate,
  container,
  payload,
}: {
  active?: boolean
  coordinate?: { x?: number; y?: number }
  container?: HTMLDivElement | null
  payload?: Array<{ payload?: SparklinePoint }>
}) => {
  const theme = useTheme()
  const point = payload?.[0]?.payload

  if (!active || !point || !coordinate || coordinate.x === undefined || coordinate.y === undefined || !container)
    return null

  const rect = container.getBoundingClientRect()
  const tooltipHalfWidth = 80
  const tooltipHeight = 28
  const left = Math.min(
    Math.max(rect.left + coordinate.x, 8 + tooltipHalfWidth),
    window.innerWidth - 8 - tooltipHalfWidth,
  )
  const top = Math.min(Math.max(rect.top + coordinate.y - tooltipHeight - 8, 8), window.innerHeight - tooltipHeight - 8)

  return (
    <Portal>
      <TooltipPill $left={left} $top={top}>
        <Text color={theme.subText} fontSize={11} sx={{ whiteSpace: 'nowrap' }}>
          {point.dateLabel} • {formatDisplayNumber(point.value, { significantDigits: 6 })}
        </Text>
      </TooltipPill>
    </Portal>
  )
}

const SparklineChart = ({
  sparkline,
  shouldInvert,
  height = 36,
}: {
  sparkline?: number[]
  shouldInvert?: boolean
  height?: number
}) => {
  const theme = useTheme()
  const gradientId = useId().replace(/:/g, '')
  const containerRef = useRef<HTMLDivElement>(null)

  const normalizedSparkline = useMemo(() => {
    const points = [...(sparkline || [])]

    for (let index = points.length - 1; index > 0; index--) {
      const currentValue = points[index]
      const previousValue = points[index - 1]
      const hasValidCurrentValue = Number.isFinite(currentValue) && currentValue !== 0
      const shouldBackfillPrevious = !Number.isFinite(previousValue) || previousValue === 0

      if (hasValidCurrentValue && shouldBackfillPrevious) {
        points[index - 1] = currentValue
      }
    }

    return points
  }, [sparkline])

  const data: SparklinePoint[] = useMemo(() => {
    const today = dayjs()
    const totalPoints = normalizedSparkline.length

    return normalizedSparkline.map((value, index) => ({
      index,
      dateLabel: today.subtract(totalPoints - 1 - index, 'day').format('MMM D'),
      value: shouldInvert && value > 0 ? 1 / value : value,
    }))
  }, [normalizedSparkline, shouldInvert])

  const { domainMin, domainMax } = useMemo(() => {
    const values = data.map(item => item.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const actualRange = maxValue - minValue
    const fallbackRange = Math.max(Math.max(Math.abs(maxValue), Math.abs(minValue), 1) * 0.002, 1e-8)
    const range = actualRange > 0 ? actualRange : fallbackRange
    const [paddingTop, paddingBottom] = [8, 12]
    const span = range / (1 - (paddingTop + paddingBottom) / height)
    const topPadding = (span * paddingTop) / height
    const bottomPadding = (span * paddingBottom) / height

    return {
      domainMin: minValue - bottomPadding,
      domainMax: maxValue + topPadding,
    }
  }, [data, height])

  if (data.length === 0 || data.every(item => item.value === 0)) {
    return null
  }

  const firstValue = data[0]?.value
  const lastValue = data[data.length - 1]?.value
  const chartColor = lastValue < firstValue ? theme.red : theme.primary

  return (
    <Box height={`${height}px`} width="100%" ref={containerRef}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 4, bottom: 0, left: 4 }}>
          <YAxis hide domain={[domainMin, domainMax]} />
          <Tooltip
            content={({ active, coordinate, payload }) => (
              <SparklineTooltip
                active={active}
                coordinate={coordinate}
                container={containerRef.current}
                payload={payload?.map(item => ({ payload: item.payload as SparklinePoint | undefined }))}
              />
            )}
            cursor={false}
            isAnimationActive={false}
            wrapperStyle={{ visibility: 'hidden' }}
          />
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity={0.4} />
              <stop offset="100%" stopColor={chartColor} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <Area
            type="linear"
            dataKey="value"
            stroke={chartColor}
            fill={`url(#${gradientId})`}
            strokeWidth={1.5}
            baseValue={domainMin}
            connectNulls
            isAnimationActive={false}
            dot={{ r: 1.5, fill: chartColor, stroke: chartColor }}
            activeDot={{ r: 2, fill: chartColor, stroke: chartColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default SparklineChart

import { useId, useMemo } from 'react'
import { Box } from 'rebass'
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'

import useTheme from 'hooks/useTheme'

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

  const data = useMemo(
    () =>
      (sparkline || []).map((value, index) => ({
        index,
        value: shouldInvert && value > 0 ? 1 / value : value,
      })),
    [sparkline, shouldInvert],
  )

  const { domainMin, domainMax } = useMemo(() => {
    const values = data.map(item => item.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = Math.max(maxValue - minValue, Math.max(maxValue * 0.08, 1))
    const [paddingTop, paddingBottom] = [8, 12]
    const span = range / (1 - (paddingTop + paddingBottom) / height)
    const topPadding = (span * paddingTop) / height
    const bottomPadding = (span * paddingBottom) / height

    return {
      domainMin: minValue - bottomPadding,
      domainMax: maxValue + topPadding,
    }
  }, [data, height])

  const firstValue = data[0]?.value
  const lastValue = data[data.length - 1]?.value
  const chartColor = lastValue < firstValue ? theme.red : theme.primary

  return (
    <Box height={`${height}px`} width="100%">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 4, bottom: 0, left: 4 }}>
          <YAxis hide domain={[domainMin, domainMax]} />
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
            dot={{ r: 2, fill: chartColor, stroke: chartColor }}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default SparklineChart

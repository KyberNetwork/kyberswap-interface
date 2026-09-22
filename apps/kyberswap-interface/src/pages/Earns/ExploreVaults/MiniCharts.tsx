import dayjs from 'dayjs'
import { memo, useId } from 'react'
import { Area, AreaChart, Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, YAxis } from 'recharts'

import useTheme from 'hooks/useTheme'
import { ChartDataPoint } from 'pages/Earns/ExploreVaults/types'
import { formatDisplayNumber } from 'utils/numbers'

const TooltipWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="whitespace-nowrap rounded-lg border border-solid border-border bg-buttonGray px-2.5 py-1.5 text-xs">
    {children}
  </div>
)

const TooltipValue = ({ $color, children }: { $color: string; children: React.ReactNode }) => (
  <span className="font-medium" style={{ color: $color }}>
    {children}
  </span>
)

const ApyTooltipContent = ({ active, payload }: { active?: boolean; payload?: { value: number }[] }) => {
  const theme = useTheme()
  if (!active || !payload?.length) return null
  return (
    <TooltipWrapper>
      <TooltipValue $color={theme.blue3}>
        {formatDisplayNumber(payload[0].value, { style: 'decimal', fractionDigits: 2 })}%
      </TooltipValue>
    </TooltipWrapper>
  )
}

const TvlTooltipContent = ({ active, payload }: { active?: boolean; payload?: { value: number }[] }) => {
  const theme = useTheme()
  if (!active || !payload?.length) return null
  return (
    <TooltipWrapper>
      <TooltipValue $color={theme.primary}>
        {formatDisplayNumber(payload[0].value, { style: 'currency', significantDigits: 4 })}
      </TooltipValue>
    </TooltipWrapper>
  )
}

/** Earnings are marked to NAV, so the sign is real and the tooltip names the bucket it belongs to. */
const EarningTooltipContent = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: { value: number; payload: ChartDataPoint }[]
}) => {
  const theme = useTheme()
  if (!active || !payload?.length) return null
  const { timestamp } = payload[0].payload
  return (
    <TooltipWrapper>
      {timestamp ? <div className="mb-0.5 text-subText">{dayjs(timestamp).format('MMM D, YYYY HH:mm')}</div> : null}
      <TooltipValue $color={theme.blue3}>
        {formatDisplayNumber(payload[0].value, {
          style: 'currency',
          significantDigits: 4,
          allowDisplayNegative: true,
        })}
      </TooltipValue>
    </TooltipWrapper>
  )
}

interface MiniChartProps {
  data: ChartDataPoint[]
  height?: number
}

export const ApyBarChart = memo(({ data, height = 28 }: MiniChartProps) => {
  const theme = useTheme()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barCategoryGap="8%">
        <Tooltip content={<ApyTooltipContent />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
        <Bar dataKey="value" fill={theme.blue3} radius={[1, 1, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
})
ApyBarChart.displayName = 'ApyBarChart'

export const TvlLineChart = memo(({ data, height = 49 }: MiniChartProps) => {
  const theme = useTheme()
  const gradientId = useId().replace(/:/g, '')
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.primary} stopOpacity={0.3} />
            <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip content={<TvlTooltipContent />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={theme.primary}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 3, fill: theme.primary, stroke: 'none' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
})
TvlLineChart.displayName = 'TvlLineChart'

/**
 * A position's earnings over time. The figure can sit either side of zero, so the baseline is drawn
 * in; buckets from before the position existed carry no value and the line breaks over them.
 */
export const EarningLineChart = memo(({ data, height = 49 }: MiniChartProps) => {
  const theme = useTheme()
  const gradientId = useId().replace(/:/g, '')
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.blue3} stopOpacity={0.3} />
            <stop offset="100%" stopColor={theme.blue3} stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* Zero is pinned into the domain: left to scale itself, a run of losses fills the height
            as a rising line that reads as a profit. */}
        <YAxis hide domain={[(min: number) => Math.min(0, min), (max: number) => Math.max(0, max)]} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        <Tooltip content={<EarningTooltipContent />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={theme.blue3}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 3, fill: theme.blue3, stroke: 'none' }}
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
})
EarningLineChart.displayName = 'EarningLineChart'

import { type PropsWithChildren } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PerformancePoint, PerformanceWindow } from 'services/copyTrading/types'

import Dots from 'components/Dots'
import Loader from 'components/Loader'
import SegmentedControl, { type SegmentedControlOption } from 'components/SegmentedControl'
import { HStack, Stack } from 'components/Stack'
import { compactUsd, formatUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

const chartWindowOptions: readonly SegmentedControlOption<PerformanceWindow>[] = [
  { label: '7D', value: '7d' },
  { label: '1M', value: '30d' },
  { label: '3M', value: '90d' },
  { label: 'All', value: 'all' },
]

type PerformanceChartPoint = {
  timestamp: number
  portfolioValueUsd: number
  realizedPnlUsd: number
}

export const toPerformanceChartPoint = (point: PerformancePoint): PerformanceChartPoint => ({
  timestamp: new Date(point.timestamp).getTime(),
  portfolioValueUsd: Number(point.portfolioValueUsd || 0),
  realizedPnlUsd: Number(point.realizedPnlUsd || 0),
})

const formatTickDate = (value: number | string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value))

const getPnlGradientOffset = (data: PerformanceChartPoint[]) => {
  const values = data.map(point => point.realizedPnlUsd)
  const maximum = Math.max(...values)
  const minimum = Math.min(...values)

  if (maximum <= 0) return 0
  if (minimum >= 0) return 1
  return maximum / (maximum - minimum)
}

type ChartTitleProps = {
  loading?: boolean
  title: string
}

const ChartTitle = ({ loading, title }: ChartTitleProps) => (
  <HStack className="items-center gap-2">
    <h2 className="text-lg font-medium text-text">{title}</h2>
    {loading && <Loader className="text-primary" size="14px" />}
  </HStack>
)

type ChartTooltipProps = {
  active?: boolean
  payload?: Array<{
    color?: string
    dataKey?: string
    name?: string
    payload?: PerformanceChartPoint
    value?: number
  }>
}

const ChartTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null

  const point = payload[0].payload
  if (!point) return null

  return (
    <Stack className="gap-2 rounded-lg bg-background px-4 py-3 text-xs shadow-lg">
      <span className="text-subText">{formatTickDate(point.timestamp)}</span>
      {payload.map(item => (
        <span key={item.dataKey} className="font-medium" style={{ color: item.color }}>
          {item.name}: {formatUsd(String(item.value || 0))}
        </span>
      ))}
    </Stack>
  )
}

type ChartStateProps = PropsWithChildren<{
  className?: string
  isError?: boolean
  isEmpty?: boolean
  isLoading?: boolean
}>

const ChartState = ({ children, className, isError, isEmpty, isLoading }: ChartStateProps) => {
  const state = isError ? (
    <span className="text-sm font-medium text-red">Unable to load chart data.</span>
  ) : isLoading ? (
    <div className="text-sm font-medium text-subText">
      <Dots>Loading</Dots>
    </div>
  ) : isEmpty ? (
    <span className="text-sm font-medium text-subText">No chart data available.</span>
  ) : null

  return (
    <div className={cn('relative h-64 overflow-hidden', className)}>
      {children}
      {state && (
        <Stack className="absolute inset-0 items-center justify-center rounded-lg bg-buttonBlack/70 text-center">
          {state}
        </Stack>
      )}
    </div>
  )
}

type CumulativeRealisedPnlChartProps = {
  data: PerformanceChartPoint[]
  isError?: boolean
  isFetching?: boolean
  onWindowChange?: (window: PerformanceWindow) => void
  window?: PerformanceWindow
}

export const CumulativeRealisedPnlChart = ({
  data,
  isError,
  isFetching,
  onWindowChange,
  window,
}: CumulativeRealisedPnlChartProps) => {
  const gradientOffset = getPnlGradientOffset(data)

  return (
    <Stack className="gap-4">
      <HStack className="items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
        <ChartTitle loading={isFetching} title="Cumulative Realised P&L" />
        {window && onWindowChange && (
          <SegmentedControl onChange={onWindowChange} options={chartWindowOptions} size="sm" value={window} />
        )}
      </HStack>
      <ChartState isEmpty={!isFetching && !data.length} isError={isError} isLoading={isFetching && !data.length}>
        {!!data.length && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 16, right: 0, bottom: 8, left: 0 }}>
              <defs>
                <linearGradient id="realisedPnlStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={gradientOffset} stopColor="var(--ks-primary)" />
                  <stop offset={gradientOffset} stopColor="var(--ks-red)" />
                </linearGradient>
                <linearGradient id="realisedPnlFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={gradientOffset} stopColor="var(--ks-primary)" stopOpacity={0.16} />
                  <stop offset={gradientOffset} stopColor="var(--ks-red)" stopOpacity={0.16} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--ks-border)" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="timestamp"
                minTickGap={24}
                tick={{ fill: 'var(--ks-subText)', fontSize: 12 }}
                tickFormatter={formatTickDate}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={{ fill: 'var(--ks-subText)', fontSize: 12 }}
                tickFormatter={value => compactUsd(String(value))}
                tickLine={false}
                width={72}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--ks-subText)', strokeDasharray: '4 4' }} />
              <Area
                activeDot={{ fill: 'var(--ks-primary)', r: 4, stroke: 'var(--ks-buttonBlack)', strokeWidth: 2 }}
                dataKey="realizedPnlUsd"
                dot={false}
                fill="url(#realisedPnlFill)"
                name="Realised P&L"
                stroke="url(#realisedPnlStroke)"
                strokeWidth={3}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartState>
    </Stack>
  )
}

type CapitalValueChartProps = {
  data: PerformanceChartPoint[]
  isError?: boolean
  isFetching?: boolean
  title?: string
}

export const CapitalValueChart = ({ data, isError, isFetching, title = 'Capital Value' }: CapitalValueChartProps) => {
  return (
    <Stack className="gap-4">
      <ChartTitle loading={isFetching} title={title} />

      <ChartState isEmpty={!isFetching && !data.length} isError={isError} isLoading={isFetching && !data.length}>
        {!!data.length && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 16, right: 0, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="var(--ks-border)" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="timestamp"
                minTickGap={24}
                tick={{ fill: 'var(--ks-subText)', fontSize: 12 }}
                tickFormatter={formatTickDate}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                orientation="right"
                tick={{ fill: 'var(--ks-subText)', fontSize: 12 }}
                tickFormatter={value => compactUsd(String(value))}
                tickLine={false}
                width={72}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--ks-primary-12)' }} />
              <Bar dataKey="portfolioValueUsd" fill="var(--ks-blue)" name="Capital Value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartState>
    </Stack>
  )
}

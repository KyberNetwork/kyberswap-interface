import { type PropsWithChildren, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import copyTradingApi from 'services/copyTrading'
import type { AgentStats as AgentStatsData, PerformancePoint, PerformanceWindow } from 'services/copyTrading/types'

import Dots from 'components/Dots'
import Loader from 'components/Loader'
import SegmentedControl, { type SegmentedControlOption } from 'components/SegmentedControl'
import { HStack, Stack } from 'components/Stack'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { compactUsd, formatUsd, percent, signedUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

const chartWindowOptions: readonly SegmentedControlOption<PerformanceWindow>[] = [
  { label: '7D', value: '7d' },
  { label: '1M', value: '30d' },
  { label: '3M', value: '90d' },
  { label: 'All', value: 'all' },
]

type ChartPoint = {
  timestamp: number
  portfolioValueUsd: number
  realizedPnlUsd: number
}

const getProfileStats = (stats?: AgentStatsData): LeaderboardStat[] => [
  {
    label: 'Total Realised P&L',
    value: signedUsd(stats?.totalRealizedPnlUsd),
    icon: copyTradingStatIconMap.money,
  },
  {
    label: 'Copiers',
    value: String(stats?.copiers || 0),
    icon: copyTradingStatIconMap.users,
  },
  {
    label: 'Win Rate',
    value: percent(stats?.winRatePct),
    icon: copyTradingStatIconMap.positionOpen,
  },
  {
    label: 'AUM',
    value: compactUsd(stats?.aumUsd),
    icon: copyTradingStatIconMap.volume,
  },
]

const toChartPoint = (point: PerformancePoint): ChartPoint => ({
  timestamp: new Date(point.timestamp).getTime(),
  portfolioValueUsd: Number(point.portfolioValueUsd || 0),
  realizedPnlUsd: Number(point.realizedPnlUsd || 0),
})

const formatTickDate = (value: number) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value))

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
    payload?: ChartPoint
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
  data: ChartPoint[]
  isError?: boolean
  isFetching?: boolean
}

const CumulativeRealisedPnlChart = ({ data, isError, isFetching }: CumulativeRealisedPnlChartProps) => {
  return (
    <ChartState isEmpty={!isFetching && !data.length} isError={isError} isLoading={isFetching && !data.length}>
      {!!data.length && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 0, bottom: 8, left: 0 }}>
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
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--ks-subText)', strokeDasharray: '4 4' }} />
            <Line
              activeDot={{ fill: 'var(--ks-primary)', r: 4, stroke: 'var(--ks-buttonBlack)', strokeWidth: 2 }}
              dataKey="realizedPnlUsd"
              dot={false}
              name="Realised P&L"
              stroke="var(--ks-primary)"
              strokeWidth={3}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartState>
  )
}

type CapitalValueChartProps = {
  data: ChartPoint[]
  isError?: boolean
  isFetching?: boolean
}

const CapitalValueChart = ({ data, isError, isFetching }: CapitalValueChartProps) => {
  return (
    <Stack className="gap-4">
      <ChartTitle loading={isFetching} title="Capital Value" />

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

type AgentStatsProps = {
  agentId: string
}

const AgentStats = ({ agentId }: AgentStatsProps) => {
  const [window, setWindow] = useState<PerformanceWindow>('30d')

  const { data: agentStats } = copyTradingApi.useGetAgentStatsQuery({ agentId })
  const {
    data: performance,
    isError,
    isFetching,
  } = copyTradingApi.useGetAgentPerformanceQuery({
    agentId,
    interval: 'day',
    limit: 60,
    series: 'portfolio_value',
    window,
  })
  const stats = agentStats?.data
  const chartData = useMemo(() => (performance?.data || []).map(toChartPoint), [performance?.data])

  return (
    <Stack className="min-w-0 gap-5">
      <Leaderboard items={getProfileStats(stats)} size="sm" />
      <Stack className="gap-6 rounded-xl bg-buttonBlack p-6">
        <Stack className="gap-4">
          <HStack className="items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
            <ChartTitle loading={isFetching} title="Cumulative Realised P&L" />
            <SegmentedControl onChange={setWindow} options={chartWindowOptions} size="sm" value={window} />
          </HStack>
          <CumulativeRealisedPnlChart data={chartData} isError={isError} isFetching={isFetching} />
        </Stack>
        <CapitalValueChart data={chartData} isError={isError} isFetching={isFetching} />
      </Stack>
    </Stack>
  )
}

export default AgentStats

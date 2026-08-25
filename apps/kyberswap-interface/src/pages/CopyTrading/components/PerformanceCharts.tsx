import { AnimatePresence, motion } from 'framer-motion'
import { type PropsWithChildren, type ReactNode, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { useMedia } from 'react-use'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PerformancePoint } from 'services/copyTrading/types/agents'
import type { PerformanceWindow } from 'services/copyTrading/types/primitives'

import IconButton from 'components/Button/IconButton'
import Dots from 'components/Dots'
import Loader from 'components/Loader'
import SegmentedControl, { type SegmentedControlOption } from 'components/SegmentedControl'
import { HStack, Stack } from 'components/Stack'
import { compactUsd, formatUsd, getSignedMetricClassName } from 'pages/CopyTrading/helpers'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { formatDateTime, formatShortDate } from 'utils/time'

const chartWindowOptions: readonly SegmentedControlOption<PerformanceWindow>[] = [
  { label: '7D', value: '7d' },
  { label: '1M', value: '30d' },
  { label: '3M', value: '90d' },
  { label: 'All', value: 'all' },
]

type PerformanceChartPoint = {
  timestamp: number
  portfolioValueUsd?: number
  realizedPnlUsd?: number
}

const toChartNumber = (value?: string) => {
  if (value === undefined) return undefined

  const amount = Number(value)
  return Number.isFinite(amount) ? amount : undefined
}

export const toPerformanceChartPoint = (point: PerformancePoint): PerformanceChartPoint => ({
  timestamp: new Date(point.timestamp).getTime(),
  portfolioValueUsd: toChartNumber(point.portfolioValueUsd),
  realizedPnlUsd: toChartNumber(point.realizedPnlUsd),
})

const getPnlGradientOffset = (data: PerformanceChartPoint[]) => {
  const values = data.map(point => point.realizedPnlUsd).filter(value => value !== undefined)
  if (!values.length) return 1
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
    <h2 className="text-base font-medium text-text sm:text-lg">{title}</h2>
    {loading && <Loader className="text-primary" size="14px" />}
  </HStack>
)

type ChartSectionProps = PropsWithChildren<{
  collapsible?: boolean
  headerAside?: ReactNode
  loading?: boolean
  title: string
}>

const ChartSection = ({ children, collapsible, headerAside, loading, title }: ChartSectionProps) => {
  const [expanded, setExpanded] = useState(true)
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const mobileCollapsible = !!collapsible && isMobile
  const showContent = !mobileCollapsible || expanded

  return (
    <Stack>
      <HStack className="items-center justify-between gap-3">
        <HStack className="min-w-0 flex-1 items-center justify-between gap-2">
          <ChartTitle loading={loading} title={title} />
          {mobileCollapsible && (
            <IconButton
              aria-expanded={expanded}
              aria-label={`${expanded ? 'Collapse' : 'Expand'} ${title}`}
              className="rounded-lg text-subText hover:bg-white-04 hover:text-text"
              onClick={() => setExpanded(value => !value)}
              size={24}
              variant="compact"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </IconButton>
          )}
        </HStack>
        {!mobileCollapsible && headerAside}
      </HStack>
      <AnimatePresence initial={false}>
        {showContent && (
          <motion.div
            key="chart-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              {mobileCollapsible && headerAside && <div className="mb-4 w-fit">{headerAside}</div>}
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Stack>
  )
}

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
      <span className="text-subText">{formatDateTime(point.timestamp)}</span>
      {payload.map(item => {
        const isPnl = item.dataKey === 'realizedPnlUsd'

        return (
          <span
            key={item.dataKey}
            className={cn('font-medium', isPnl && getSignedMetricClassName(item.value))}
            style={isPnl ? undefined : { color: item.color }}
          >
            {item.name}: {formatUsd(item.value === undefined ? undefined : String(item.value))}
          </span>
        )
      })}
    </Stack>
  )
}

type PnlActiveDotProps = {
  cx?: number
  cy?: number
  payload?: PerformanceChartPoint
}

const PnlActiveDot = ({ cx, cy, payload }: PnlActiveDotProps) => {
  const value = payload?.realizedPnlUsd
  const fill = value === undefined || value === 0 ? 'var(--ks-text)' : value > 0 ? 'var(--ks-primary)' : 'var(--ks-red)'

  return <circle cx={cx} cy={cy} fill={fill} r={4} stroke="var(--ks-buttonBlack)" strokeWidth={2} />
}

type ChartStateProps = PropsWithChildren<{
  className?: string
  isError?: boolean
  isEmpty?: boolean
  isLoading?: boolean
}>

const ChartState = ({ children, className, isError, isEmpty, isLoading }: ChartStateProps) => {
  const state = isError ? (
    <p className="text-sm font-medium text-red">Unable to load chart data.</p>
  ) : isLoading ? (
    <p className="text-sm font-medium text-subText">
      <Dots>Loading</Dots>
    </p>
  ) : isEmpty ? (
    <p className="text-sm font-medium text-subText">No chart data available.</p>
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
  collapsible?: boolean
  data: PerformanceChartPoint[]
  isError?: boolean
  isFetching?: boolean
  onWindowChange?: (window: PerformanceWindow) => void
  window?: PerformanceWindow
}

export const CumulativeRealisedPnlChart = ({
  collapsible,
  data,
  isError,
  isFetching,
  onWindowChange,
  window,
}: CumulativeRealisedPnlChartProps) => {
  const gradientOffset = getPnlGradientOffset(data)
  const windowControl =
    window && onWindowChange ? (
      <SegmentedControl onChange={onWindowChange} options={chartWindowOptions} size="sm" value={window} />
    ) : undefined

  return (
    <ChartSection
      collapsible={collapsible}
      headerAside={windowControl}
      loading={isFetching}
      title="Cumulative Realised P&L"
    >
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
                tickFormatter={formatShortDate}
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
                activeDot={<PnlActiveDot />}
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
    </ChartSection>
  )
}

type CapitalValueChartProps = {
  collapsible?: boolean
  data: PerformanceChartPoint[]
  isError?: boolean
  isFetching?: boolean
  onWindowChange?: (window: PerformanceWindow) => void
  title?: string
  window?: PerformanceWindow
}

export const CapitalValueChart = ({
  collapsible,
  data,
  isError,
  isFetching,
  onWindowChange,
  title = 'Capital Value',
  window,
}: CapitalValueChartProps) => {
  const windowControl =
    window && onWindowChange ? (
      <SegmentedControl onChange={onWindowChange} options={chartWindowOptions} size="sm" value={window} />
    ) : undefined

  return (
    <ChartSection collapsible={collapsible} headerAside={windowControl} loading={isFetching} title={title}>
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
                tickFormatter={formatShortDate}
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
    </ChartSection>
  )
}

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
import { formatUsd, getSignedMetricClassName, percent } from 'pages/CopyTrading/helpers'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { formatDateTime, formatShortDate } from 'utils/time'

const chartWindowOptions: readonly SegmentedControlOption<PerformanceWindow>[] = [
  { label: '7D', value: '7d' },
  { label: '1M', value: '30d' },
  { label: '3M', value: '90d' },
  { label: 'All', value: 'all' },
]

const Y_AXIS_WIDTH = 48

const compactAxisUsd = (value: number) =>
  formatDisplayNumber(value, { allowDisplayNegative: true, significantDigits: 2, style: 'currency' })

const compactAxisPercent = (value: number) =>
  `${formatDisplayNumber(value, { allowDisplayNegative: true, significantDigits: 2 })}%`

const formatPnlAxisTick = (value: number, metric: 'usd' | 'return') =>
  metric === 'return' ? compactAxisPercent(value) : compactAxisUsd(value)

type PerformanceChartPoint = {
  timestamp: number
  portfolioValueUsd?: number
  realizedPnlUsd?: number
  totalPnlUsd?: number
  valuePct?: number
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
  totalPnlUsd: toChartNumber(point.totalPnlUsd),
  valuePct: toChartNumber(point.valuePct),
})

type PnlDataKey = 'totalPnlUsd' | 'valuePct'

const getPnlGradientOffset = (data: PerformanceChartPoint[], dataKey: PnlDataKey) => {
  const values = data.map(point => point[dataKey]).filter(value => value !== undefined)
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
    <Stack className="min-w-[220px] gap-3 rounded-xl border border-border bg-tableHeader/80 px-4 py-3 text-xs shadow-[0_12px_32px_var(--ks-shadow)]">
      <span className="text-subText">{formatDateTime(point.timestamp)}</span>
      <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-2">
        {payload.map(item => {
          const isPnl = item.dataKey === 'totalPnlUsd' || item.dataKey === 'valuePct'
          const formattedValue =
            item.dataKey === 'valuePct'
              ? percent(item.value === undefined ? undefined : String(item.value))
              : formatUsd(item.value === undefined ? undefined : String(item.value))

          return (
            <div key={item.dataKey} className="contents">
              <span className="text-subText">{item.name}</span>
              <span className={cn('text-right font-medium text-text', isPnl && getSignedMetricClassName(item.value))}>
                {formattedValue}
              </span>
            </div>
          )
        })}
      </div>
    </Stack>
  )
}

type PnlActiveDotProps = {
  cx?: number
  cy?: number
  payload?: PerformanceChartPoint
  dataKey: PnlDataKey
}

const getPnlActiveDotFill = (value?: number) => {
  if (value === undefined || value === 0) return 'var(--ks-text)'
  return value > 0 ? 'var(--ks-primary)' : 'var(--ks-red)'
}

const PnlActiveDot = ({ cx, cy, dataKey, payload }: PnlActiveDotProps) => {
  return (
    <circle
      cx={cx}
      cy={cy}
      fill={getPnlActiveDotFill(payload?.[dataKey])}
      r={4}
      stroke="var(--ks-buttonBlack)"
      strokeWidth={2}
    />
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

type CumulativeTotalPnlChartProps = {
  collapsible?: boolean
  data: PerformanceChartPoint[]
  isError?: boolean
  isFetching?: boolean
  onWindowChange?: (window: PerformanceWindow) => void
  window?: PerformanceWindow
}

export const CumulativeTotalPnlChart = ({
  collapsible,
  data,
  isError,
  isFetching,
  onWindowChange,
  window,
}: CumulativeTotalPnlChartProps) => {
  const [metric, setMetric] = useState<'usd' | 'return'>('usd')
  const dataKey: PnlDataKey = metric === 'usd' ? 'totalPnlUsd' : 'valuePct'
  const gradientOffset = getPnlGradientOffset(data, dataKey)
  const hasSelectedMetric = data.some(point => point[dataKey] !== undefined)
  const chartControls = (
    <HStack className="items-center gap-2">
      <SegmentedControl
        onChange={setMetric}
        options={[
          { label: '$', value: 'usd' },
          { label: '%', value: 'return' },
        ]}
        size="sm"
        value={metric}
      />
      {window && onWindowChange && (
        <SegmentedControl onChange={onWindowChange} options={chartWindowOptions} size="sm" value={window} />
      )}
    </HStack>
  )

  return (
    <ChartSection
      collapsible={collapsible}
      headerAside={chartControls}
      loading={isFetching}
      title="Cumulative Total P&L"
    >
      <ChartState isEmpty={!isFetching && !hasSelectedMetric} isError={isError} isLoading={isFetching && !data.length}>
        {hasSelectedMetric && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 16, right: 0, bottom: 8, left: 0 }}>
              <defs>
                <linearGradient id="totalPnlStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={gradientOffset} stopColor="var(--ks-primary)" />
                  <stop offset={gradientOffset} stopColor="var(--ks-red)" />
                </linearGradient>
                <linearGradient id="totalPnlFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={gradientOffset} stopColor="var(--ks-primary)" stopOpacity={0.16} />
                  <stop offset={gradientOffset} stopColor="var(--ks-red)" stopOpacity={0.16} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--ks-text-06)" vertical={false} />
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
                tickFormatter={value => formatPnlAxisTick(value, metric)}
                tickLine={false}
                width={Y_AXIS_WIDTH}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--ks-text-12)', strokeDasharray: '4 4' }} />
              <Area
                activeDot={<PnlActiveDot dataKey={dataKey} />}
                dataKey={dataKey}
                dot={false}
                fill="url(#totalPnlFill)"
                name={metric === 'return' ? 'Holding-period return' : 'Total P&L'}
                stroke="url(#totalPnlStroke)"
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
              <CartesianGrid stroke="var(--ks-text-06)" vertical={false} />
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
                tickFormatter={compactAxisUsd}
                tickLine={false}
                width={Y_AXIS_WIDTH}
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

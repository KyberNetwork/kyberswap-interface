import { t } from '@lingui/macro'
import dayjs from 'dayjs'
import { memo, useId } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

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

/** Names the bucket a tooltip is describing; omitted by a series that carries no timestamps. */
const TooltipTimestamp = ({ timestamp }: { timestamp?: string }) =>
  timestamp ? <div className="mb-1 text-subText">{dayjs(timestamp).format('MMM D, YYYY HH:mm')}</div> : null

const TooltipRow = ({ label, $color, children }: { label: string; $color: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-subText">{label}</span>
    <TooltipValue $color={$color}>{children}</TooltipValue>
  </div>
)

const ApyTooltipContent = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: { value: number; payload: ChartDataPoint }[]
}) => {
  const theme = useTheme()
  if (!active || !payload?.length) return null
  return (
    <TooltipWrapper>
      <TooltipTimestamp timestamp={payload[0].payload.timestamp} />
      <TooltipRow label={t`APY`} $color={theme.blue3}>
        {formatDisplayNumber(payload[0].value, { style: 'decimal', fractionDigits: 2 })}%
      </TooltipRow>
    </TooltipWrapper>
  )
}

const TvlTooltipContent = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: { value: number; payload: ChartDataPoint }[]
}) => {
  const theme = useTheme()
  if (!active || !payload?.length) return null
  return (
    <TooltipWrapper>
      <TooltipTimestamp timestamp={payload[0].payload.timestamp} />
      <TooltipRow label={t`TVL`} $color={theme.primary}>
        {formatDisplayNumber(payload[0].value, { style: 'currency', significantDigits: 4 })}
      </TooltipRow>
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
      <TooltipTimestamp timestamp={timestamp} />
      <TooltipRow label={t`Earning`} $color={theme.blue3}>
        {formatDisplayNumber(payload[0].value, {
          style: 'currency',
          significantDigits: 4,
          allowDisplayNegative: true,
        })}
      </TooltipRow>
    </TooltipWrapper>
  )
}

const BalanceTooltipContent = ({
  active,
  payload,
  symbol,
}: {
  active?: boolean
  payload?: { value: number; payload: ChartDataPoint }[]
  symbol?: string
}) => {
  const theme = useTheme()
  if (!active || !payload?.length) return null
  return (
    <TooltipWrapper>
      <TooltipTimestamp timestamp={payload[0].payload.timestamp} />
      <TooltipRow label={t`Balance`} $color={theme.primary}>
        {formatDisplayNumber(payload[0].value, { significantDigits: 6 })} {symbol}
      </TooltipRow>
    </TooltipWrapper>
  )
}

interface MiniChartProps {
  data: ChartDataPoint[]
  height?: number
  /**
   * Draw dated and scaled axes around the plot. Off by default: the same charts run as sparklines a
   * couple of dozen pixels tall on the vault cards, where axes would leave no room for the line.
   */
  showAxes?: boolean
}

const AXIS_TICK = { fontSize: 11 }
const GRID_STROKE = 'rgba(255,255,255,0.06)'
/** Enough room for a tick to breathe, so recharts thins the dates out rather than stacking them. */
const DATE_TICK_GAP = 48

/**
 * Axis props shared by the three charts, so their plots line up at the same insets. Recharts reads
 * its own element types off the direct children of the chart, so the axes themselves cannot be
 * wrapped in a component — only their props travel.
 */
const gridProps = { vertical: false, stroke: GRID_STROKE }

const dateAxisProps = (colour: string) => ({
  dataKey: 'timestamp',
  tickFormatter: (value: string) => (value ? dayjs(value).format('MMM D') : ''),
  tick: { ...AXIS_TICK, fill: colour },
  tickLine: false,
  axisLine: false,
  minTickGap: DATE_TICK_GAP,
  dy: 8,
})

const valueAxisProps = (colour: string, tickFormatter: (value: number) => string) =>
  ({
    orientation: 'right',
    tickFormatter,
    tick: { ...AXIS_TICK, fill: colour },
    tickLine: false,
    axisLine: false,
    // Room for a signed figure carrying a few decimals, which is what a small position earns.
    width: 62,
  } as const)

export const ApyBarChart = memo(({ data, height = 28, showAxes }: MiniChartProps) => {
  const theme = useTheme()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barCategoryGap="8%">
        {showAxes ? <CartesianGrid {...gridProps} /> : null}
        {showAxes ? <XAxis {...dateAxisProps(theme.subText)} /> : null}
        {showAxes ? (
          <YAxis
            {...valueAxisProps(
              theme.subText,
              value => `${formatDisplayNumber(value, { style: 'decimal', fractionDigits: 0 })}%`,
            )}
          />
        ) : null}
        <Tooltip content={<ApyTooltipContent />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
        <Bar dataKey="value" fill={theme.blue3} radius={[1, 1, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
})
ApyBarChart.displayName = 'ApyBarChart'

export const TvlLineChart = memo(({ data, height = 49, showAxes }: MiniChartProps) => {
  const theme = useTheme()
  const gradientId = useId().replace(/:/g, '')
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        {showAxes ? <CartesianGrid {...gridProps} /> : null}
        {showAxes ? <XAxis {...dateAxisProps(theme.subText)} /> : null}
        {showAxes ? (
          <YAxis
            {...valueAxisProps(theme.subText, value =>
              formatDisplayNumber(value, { style: 'decimal', significantDigits: 3 }),
            )}
          />
        ) : null}
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
/** A position's own holding, in the vault's own unit rather than in dollars. */
export const BalanceLineChart = memo(
  ({ data, height = 49, showAxes, symbol }: MiniChartProps & { symbol?: string }) => {
    const theme = useTheme()
    const gradientId = useId().replace(/:/g, '')
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          {showAxes ? <CartesianGrid {...gridProps} /> : null}
          {showAxes ? <XAxis {...dateAxisProps(theme.subText)} /> : null}
          {showAxes ? (
            <YAxis {...valueAxisProps(theme.subText, value => formatDisplayNumber(value, { significantDigits: 4 }))} />
          ) : null}
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.primary} stopOpacity={0.3} />
              <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            content={<BalanceTooltipContent symbol={symbol} />}
            cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={theme.primary}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 3, fill: theme.primary, stroke: 'none' }}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  },
)
BalanceLineChart.displayName = 'BalanceLineChart'

export const EarningLineChart = memo(({ data, height = 49, showAxes }: MiniChartProps) => {
  const theme = useTheme()
  const gradientId = useId().replace(/:/g, '')
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        {showAxes ? <CartesianGrid {...gridProps} /> : null}
        {showAxes ? <XAxis {...dateAxisProps(theme.subText)} /> : null}
        {showAxes ? (
          <YAxis
            {...valueAxisProps(theme.subText, value =>
              // Earnings sit either side of zero, and the formatter blanks a negative by default.
              formatDisplayNumber(value, { style: 'currency', significantDigits: 3, allowDisplayNegative: true }),
            )}
          />
        ) : null}
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

import { Fragment, useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  type PoolAnalyticsWindow,
  type PoolEarningsBucket,
  usePoolEarningsQuery,
  usePositionEarningsQuery,
} from 'services/earn'

import SegmentedControl from 'components/SegmentedControl'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import {
  CHART_WINDOW_OPTIONS,
  formatAxisTimeLabel,
  formatCompactUsd,
  formatTooltipTimeLabel,
  formatUsd,
} from 'pages/Earns/PoolDetail/Information/utils'
import PoolChartState, { PoolChartWrapper } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { MEDIA_WIDTHS } from 'theme'

type EarningsSegmentKey = 'lpFeeUsd' | 'lmUsd' | 'egUsd' | 'bonusUsd'

type EarningsBreakdownConfigItem = {
  color: string
  key: EarningsSegmentKey
  label: string
}

type EarningsBreakdownItem = {
  color: string
  key: EarningsSegmentKey
  label: string
  value: number
}

type EarningsChartPoint = PoolEarningsBucket & { showTotalLabel: boolean; topSegmentKey: EarningsSegmentKey | null }

type PoolEarningChartProps = {
  chainId: number
  poolAddress?: string
  positionId?: string
}

const TooltipCard = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-w-[220px] flex-col gap-3 rounded-xl border border-border bg-tableHeader/80 px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.2)]">
    {children}
  </div>
)

const TooltipGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-2">{children}</div>
)

const LegendDot = ({ $color }: { $color: string }) => (
  <span className="size-3 flex-shrink-0 rounded-full" style={{ background: $color }} />
)

const getVisibleLabelStep = (dataLength: number, upToSmall: boolean, window: PoolAnalyticsWindow) => {
  if (window === '7d') return 1
  if (window === '24h') return upToSmall ? 4 : 3
  if (dataLength <= 10) return 1
  if (dataLength <= 24) return upToSmall ? 4 : 3
  return upToSmall ? 6 : 4
}

const getTopSegmentKey = (bucket: PoolEarningsBucket, breakdownConfig: EarningsBreakdownConfigItem[]) => {
  for (let i = breakdownConfig.length - 1; i >= 0; i--) {
    const item = breakdownConfig[i]

    if (item && (bucket[item.key] ?? 0) > 0) {
      return item.key
    }
  }

  return bucket.totalUsd > 0 ? breakdownConfig[0]?.key || null : null
}

const TotalBarLabel = ({
  fill,
  payload,
  value,
  width,
  x,
  y,
}: {
  fill?: string
  payload?: EarningsChartPoint
  value?: number
  width?: number
  x?: number
  y?: number
}) => {
  if (!payload?.showTotalLabel || !value || x === undefined || y === undefined || width === undefined) {
    return null
  }

  return (
    <text fill={fill} fontSize={12} fontWeight={500} textAnchor="middle" x={x + width / 2} y={y - 8}>
      {formatUsd(value)}
    </text>
  )
}

type TotalBarLabelContentProps = {
  payload?: EarningsChartPoint
  value?: number
  width?: number
  x?: number
  y?: number
}

const EarningsTooltip = ({
  active,
  breakdownItems,
  point,
  window,
}: {
  active?: boolean
  breakdownItems: EarningsBreakdownItem[]
  point?: EarningsChartPoint
  window: PoolAnalyticsWindow
}) => {
  if (!active || !point) return null

  return (
    <TooltipCard>
      <span className="text-xs text-subText">{formatTooltipTimeLabel(point.ts, window)}</span>
      <TooltipGrid>
        <span className="text-xs text-subText">Total Earn</span>
        <span className="text-right text-xs font-medium text-text">{formatUsd(point.totalUsd)}</span>
        {breakdownItems.map(item => (
          <Fragment key={item.key}>
            <span className="text-xs text-subText">{item.label}</span>
            <span className="text-right text-xs font-medium text-text">{formatUsd(point[item.key] ?? 0)}</span>
          </Fragment>
        ))}
      </TooltipGrid>
    </TooltipCard>
  )
}

const PoolEarningChart = ({ chainId, poolAddress, positionId }: PoolEarningChartProps) => {
  const theme = useTheme()
  const [window, setWindow] = useState<PoolAnalyticsWindow>('7d')

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 240 : 320
  const breakdownChartSize = upToSmall ? 160 : 180
  const cursorColor = 'var(--ks-text-12)'
  const gridColor = 'rgba(255,255,255,0.06)'

  const poolEarningsQuery = usePoolEarningsQuery(
    { chainId, address: poolAddress || '', window },
    { skip: !poolAddress },
  )
  const positionEarningsQuery = usePositionEarningsQuery(
    { chainId, positionId: positionId || '', window },
    { skip: !positionId },
  )

  const isPositionChart = !!positionId
  const earningsData = isPositionChart ? positionEarningsQuery.data : poolEarningsQuery.data
  const isError = isPositionChart ? positionEarningsQuery.isError : poolEarningsQuery.isError
  const isLoading = isPositionChart ? positionEarningsQuery.isLoading : poolEarningsQuery.isLoading
  const buckets = useMemo(() => earningsData?.buckets ?? [], [earningsData?.buckets])
  const hasBonusUsd = buckets.some(bucket => bucket.bonusUsd !== undefined)

  const breakdownConfig = useMemo<EarningsBreakdownConfigItem[]>(() => {
    const items: EarningsBreakdownConfigItem[] = [
      { key: 'lpFeeUsd', label: 'LP Fee', color: theme.blue },
      { key: 'lmUsd', label: 'LM Rewards', color: '#42B8AE' },
      { key: 'egUsd', label: 'EG Sharing', color: '#DFD56A' },
      { key: 'bonusUsd', label: 'Bonus', color: '#FF9B5C' },
    ]

    return hasBonusUsd ? items : items.filter(item => item.key !== 'bonusUsd')
  }, [hasBonusUsd, theme.blue])

  const chartData = useMemo<EarningsChartPoint[]>(() => {
    const visibleLabelStep = getVisibleLabelStep(buckets.length, upToSmall, window)

    return buckets.map((bucket, index) => ({
      ...bucket,
      showTotalLabel: index % visibleLabelStep === 0 || index === buckets.length - 1,
      topSegmentKey: getTopSegmentKey(bucket, breakdownConfig),
    }))
  }, [breakdownConfig, buckets, upToSmall, window])

  const breakdownItems = useMemo<EarningsBreakdownItem[]>(() => {
    return breakdownConfig.map(item => ({
      ...item,
      value: chartData.reduce((sum, point) => sum + (point[item.key] ?? 0), 0),
    }))
  }, [breakdownConfig, chartData])

  const pieData = useMemo(() => breakdownItems.filter(item => item.value > 0), [breakdownItems])

  const totalEarned = chartData.reduce((sum, point) => sum + point.totalUsd, 0)
  const hasChartData = chartData.length > 0

  return (
    <Stack className="gap-4">
      <HStack className="flex-wrap items-start justify-between gap-4">
        <span className="text-lg font-medium text-text">Earning History</span>

        <SegmentedControl onChange={setWindow} options={CHART_WINDOW_OPTIONS} value={window} />
      </HStack>

      <PoolChartState
        emptyMessage="No earnings data available."
        errorMessage="Unable to load earnings data."
        exclusiveType="earning-chart"
        height={chartHeight}
        isEmpty={!hasChartData}
        isError={isError}
        isLoading={isLoading}
      >
        <Stack className="gap-4">
          <PoolChartWrapper $height={chartHeight}>
            <ResponsiveContainer height="100%" width="100%">
              <ComposedChart
                barCategoryGap={upToSmall ? '24%' : '18%'}
                data={chartData}
                margin={{ top: 16, right: 0, bottom: 8, left: 0 }}
              >
                <CartesianGrid stroke={gridColor} vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="ts"
                  minTickGap={24}
                  stroke={theme.subText}
                  tick={{ fill: theme.subText, fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(value: number) => formatAxisTimeLabel(value, window)}
                />
                <YAxis
                  axisLine={false}
                  orientation="right"
                  stroke={theme.subText}
                  tick={{ fill: theme.subText, fontSize: 12 }}
                  tickFormatter={(value: number) => formatCompactUsd(value)}
                  tickLine={false}
                  width={72}
                />
                <Tooltip
                  content={({ active, payload }) => (
                    <EarningsTooltip
                      active={active}
                      breakdownItems={breakdownItems}
                      point={payload?.[0]?.payload as EarningsChartPoint | undefined}
                      window={window}
                    />
                  )}
                  cursor={{ stroke: cursorColor, strokeDasharray: '4 4' }}
                />
                {breakdownConfig.map(item => (
                  <Bar
                    animationBegin={0}
                    dataKey={item.key}
                    fill={item.color}
                    isAnimationActive={true}
                    key={item.key}
                    radius={0}
                    stackId="earnings"
                  >
                    <LabelList
                      content={props => {
                        const labelProps = props as TotalBarLabelContentProps

                        return labelProps.payload?.topSegmentKey === item.key ? (
                          <TotalBarLabel {...labelProps} fill={theme.subText} />
                        ) : null
                      }}
                      dataKey="totalUsd"
                    />
                  </Bar>
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </PoolChartWrapper>

          <Stack className="mx-auto flex-row items-center justify-center gap-5 max-sm:w-full max-sm:flex-col max-sm:gap-3 sm:w-fit">
            <Stack className="relative shrink-0" style={{ height: breakdownChartSize, width: breakdownChartSize }}>
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    cx="50%"
                    cy="50%"
                    data={[{ value: 1 }]}
                    dataKey="value"
                    innerRadius="60%"
                    isAnimationActive={false}
                    outerRadius="100%"
                    stroke="transparent"
                  >
                    <Cell fill={theme.darkText} />
                  </Pie>
                  <Pie
                    animationBegin={0}
                    animationDuration={800}
                    cornerRadius={4}
                    cx="50%"
                    cy="50%"
                    data={pieData}
                    dataKey="value"
                    innerRadius="60%"
                    isAnimationActive={true}
                    outerRadius="100%"
                    paddingAngle={3}
                    stroke="transparent"
                  >
                    {pieData.map(item => (
                      <Cell fill={item.color} key={item.key} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <Stack className="pointer-events-none absolute inset-0 items-center justify-center text-center">
                <span className="text-sm text-subText">Total Earn</span>
                <span className="text-lg font-medium text-text">{formatCompactUsd(totalEarned)}</span>
              </Stack>
            </Stack>

            <Stack className="w-fit min-w-[180px] items-start gap-3 max-sm:items-center">
              {breakdownItems.map(item => (
                <HStack key={item.key} className="w-fit items-center justify-start gap-3">
                  <LegendDot $color={item.color} />
                  <HStack className="flex-wrap items-center justify-start gap-2">
                    <span className="text-sm text-subText">{item.label}</span>
                    <span className="text-sm font-medium text-text">{formatUsd(item.value)}</span>
                  </HStack>
                </HStack>
              ))}
            </Stack>
          </Stack>
        </Stack>
      </PoolChartState>
    </Stack>
  )
}

export default PoolEarningChart

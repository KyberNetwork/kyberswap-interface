import { rgba } from 'polished'
import { Fragment, useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
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
} from 'services/zapEarn'
import styled from 'styled-components'

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

const TooltipCard = styled(Stack)`
  gap: 12px;
  min-width: 220px;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.tableHeader};
  border-radius: 12px;
  box-shadow: 0 12px 32px ${({ theme }) => theme.shadow};
`

const TooltipGrid = styled.div`
  display: grid;
  gap: 8px 16px;
  grid-template-columns: auto auto;
`

const LegendDot = styled.span<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`

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

    if (item && bucket[item.key] > 0) {
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
  const theme = useTheme()

  if (!active || !point) return null

  return (
    <TooltipCard>
      <Text color={theme.subText} fontSize={12}>
        {formatTooltipTimeLabel(point.ts, window)}
      </Text>
      <TooltipGrid>
        <Text color={theme.subText} fontSize={12}>
          Total Earn
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatUsd(point.totalUsd)}
        </Text>
        {breakdownItems.map(item => (
          <Fragment key={item.key}>
            <Text color={theme.subText} fontSize={12}>
              {item.label}
            </Text>
            <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
              {formatUsd(point[item.key])}
            </Text>
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
  const cursorColor = rgba(theme.text, 0.12)
  const gridColor = rgba(theme.text, 0.06)

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

  const breakdownConfig = useMemo<EarningsBreakdownConfigItem[]>(
    () => [
      { key: 'lpFeeUsd', label: 'LP Fee', color: theme.blue },
      { key: 'lmUsd', label: 'LM Rewards', color: '#42B8AE' },
      { key: 'egUsd', label: 'EG Sharing', color: '#DFD56A' },
      { key: 'bonusUsd', label: 'Bonus', color: '#9B7AE4' },
    ],
    [theme.blue],
  )

  const chartData = useMemo<EarningsChartPoint[]>(() => {
    const buckets = earningsData?.buckets ?? []
    const visibleLabelStep = getVisibleLabelStep(buckets.length, upToSmall, window)

    return buckets.map((bucket, index) => ({
      ...bucket,
      showTotalLabel: index % visibleLabelStep === 0 || index === buckets.length - 1,
      topSegmentKey: getTopSegmentKey(bucket, breakdownConfig),
    }))
  }, [breakdownConfig, earningsData?.buckets, upToSmall, window])

  const breakdownItems = useMemo<EarningsBreakdownItem[]>(() => {
    return breakdownConfig.map(item => ({
      ...item,
      value: chartData.reduce((sum, point) => sum + point[item.key], 0),
    }))
  }, [breakdownConfig, chartData])

  const pieData = useMemo(() => breakdownItems.filter(item => item.value > 0), [breakdownItems])

  const totalEarned = chartData.reduce((sum, point) => sum + point.totalUsd, 0)
  const hasChartData = chartData.length > 0

  return (
    <Stack gap={16}>
      <HStack align="flex-start" gap={16} justify="space-between" wrap="wrap">
        <Text color={theme.text} fontSize={18} fontWeight={500}>
          Earning
        </Text>

        <SegmentedControl onChange={setWindow} options={CHART_WINDOW_OPTIONS} value={window} />
      </HStack>

      <PoolChartState
        emptyMessage="No earnings data available for this pool."
        errorMessage="Unable to load pool earnings."
        exclusiveType="earning-chart"
        height={chartHeight}
        isEmpty={!hasChartData}
        isError={isError}
        isLoading={isLoading}
      >
        <Stack gap={16}>
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

          <Stack
            align="center"
            direction={upToSmall ? 'column' : 'row'}
            gap={upToSmall ? 12 : 20}
            justify="center"
            sx={{ margin: '0 auto' }}
            width={upToSmall ? '100%' : 'fit-content'}
          >
            <Stack height={breakdownChartSize} position="relative" sx={{ flexShrink: 0 }} width={breakdownChartSize}>
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
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

              <Stack
                align="center"
                justify="center"
                position="absolute"
                sx={{ inset: 0, pointerEvents: 'none' }}
                textAlign="center"
              >
                <Text color={theme.subText} fontSize={14}>
                  Total Earn
                </Text>
                <Text color={theme.text} fontSize={18} fontWeight={500}>
                  {formatCompactUsd(totalEarned)}
                </Text>
              </Stack>
            </Stack>

            <Stack align={upToSmall ? 'center' : 'flex-start'} gap={12} width="fit-content" minWidth={180}>
              {breakdownItems.map(item => (
                <HStack align="center" gap={12} justify="flex-start" key={item.key} width="fit-content">
                  <LegendDot $color={item.color} />
                  <HStack align="center" gap={8} justify="flex-start" wrap="wrap">
                    <Text color={theme.subText} fontSize={14}>
                      {item.label}
                    </Text>
                    <Text color={theme.text} fontSize={14} fontWeight={500}>
                      {formatUsd(item.value)}
                    </Text>
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

import { rgba } from 'polished'
import { useEffect, useMemo } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { type PoolAnalyticsWindow, usePoolLiquidityFlowsQuery } from 'services/zapEarn'
import styled from 'styled-components'

import SegmentedControl from 'components/SegmentedControl'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import {
  ANALYTICS_WINDOW_OPTIONS,
  formatAnalyticsAxisTimeLabel,
  formatAnalyticsCompactCurrency,
  formatAnalyticsTooltipTimeLabel,
  formatAnalyticsUsd,
} from 'pages/Earns/PoolDetail/Information/utils'
import PoolChartState, { PoolChartWrapper } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { MEDIA_WIDTHS } from 'theme'

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

const LegendBar = styled.span<{ $color: string }>`
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: ${({ $color }) => $color};
`

const LegendLine = styled.span<{ $color: string }>`
  width: 16px;
  height: 4px;
  border-radius: 999px;
  background: ${({ $color }) => $color};
`

type LiquidityFlowPoint = {
  addUsd: number
  lpVolumeUsd: number
  removeUsd: number
  ts: number
  tvlUsd: number
}

type LiquidityFlowsChartProps = {
  onCurrentTvlChange?: (value?: number) => void
  onSelectWindow: (value: PoolAnalyticsWindow) => void
  window: PoolAnalyticsWindow
}

const LiquidityFlowsTooltip = ({
  active,
  point,
  window,
}: {
  active?: boolean
  point?: LiquidityFlowPoint
  window: PoolAnalyticsWindow
}) => {
  const theme = useTheme()

  if (!active || !point) return null

  return (
    <TooltipCard>
      <Text color={theme.subText} fontSize={12}>
        {formatAnalyticsTooltipTimeLabel(point.ts, window)}
      </Text>
      <TooltipGrid>
        <Text color={theme.subText} fontSize={12}>
          Add Liquidity
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatAnalyticsUsd(Math.abs(point.addUsd))}
        </Text>
        <Text color={theme.subText} fontSize={12}>
          Remove Liquidity
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatAnalyticsUsd(Math.abs(point.removeUsd))}
        </Text>
        <Text color={theme.subText} fontSize={12}>
          LP Volume
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatAnalyticsUsd(Math.abs(point.lpVolumeUsd))}
        </Text>
        <Text color={theme.subText} fontSize={12}>
          TVL
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatAnalyticsUsd(point.tvlUsd)}
        </Text>
      </TooltipGrid>
    </TooltipCard>
  )
}

const LiquidityFlowsChart = ({ onCurrentTvlChange, onSelectWindow, window }: LiquidityFlowsChartProps) => {
  const theme = useTheme()
  const { chainId, poolAddress } = usePoolDetailContext()

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 280 : 360

  const {
    currentData: analytics,
    isError,
    isFetching,
  } = usePoolLiquidityFlowsQuery({
    chainId,
    address: poolAddress,
    window,
  })

  const chartData = useMemo<LiquidityFlowPoint[]>(
    () =>
      (analytics?.buckets ?? []).map(bucket => ({
        ...bucket,
        lpVolumeUsd: bucket.addUsd - bucket.removeUsd,
        removeUsd: -bucket.removeUsd,
      })),
    [analytics?.buckets],
  )

  const latestBucket = analytics?.buckets.at(-1)

  useEffect(() => {
    onCurrentTvlChange?.(latestBucket?.tvlUsd)
  }, [latestBucket?.tvlUsd, onCurrentTvlChange])

  const addBarColor = rgba(theme.darkGreen, 0.8)
  const lpVolumeLineColor = theme.primary
  const removeBarColor = rgba(theme.red1, 0.6)

  return (
    <Stack gap={16}>
      <HStack align="flex-start" gap={16} justify="space-between" wrap="wrap">
        <Text color={theme.text} fontSize={18} fontWeight={500}>
          Liquidity Flows
        </Text>

        <SegmentedControl onChange={onSelectWindow} options={ANALYTICS_WINDOW_OPTIONS} value={window} />
      </HStack>

      <PoolChartState
        emptyMessage="No liquidity flow data available for this pool."
        errorMessage="Unable to load liquidity flows."
        height={chartHeight}
        isEmpty={!chartData.length}
        isError={isError}
        isLoading={isFetching && !analytics}
      >
        <Stack gap={12}>
          <PoolChartWrapper $height={chartHeight}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                barCategoryGap={upToSmall ? '20%' : '16%'}
                data={chartData}
                margin={{ top: 8, right: 0, bottom: 8, left: 0 }}
                stackOffset="sign"
              >
                <CartesianGrid stroke={rgba(theme.subText, 0.12)} vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="ts"
                  minTickGap={24}
                  stroke={theme.subText}
                  tick={{ fill: theme.subText, fontSize: 12 }}
                  tickFormatter={(value: number) => formatAnalyticsAxisTimeLabel(value, window)}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  orientation="left"
                  stroke={theme.subText}
                  tick={{ fill: theme.subText, fontSize: 12 }}
                  tickFormatter={(value: number) => formatAnalyticsCompactCurrency(value)}
                  tickLine={false}
                  width={72}
                  yAxisId="flow"
                />
                <YAxis
                  axisLine={false}
                  orientation="right"
                  stroke={theme.subText}
                  tick={{ fill: theme.subText, fontSize: 12 }}
                  tickFormatter={(value: number) => formatAnalyticsCompactCurrency(value)}
                  tickLine={false}
                  width={72}
                  yAxisId="tvl"
                />
                <Tooltip
                  content={(props: any) => (
                    <LiquidityFlowsTooltip
                      active={props.active}
                      point={props.payload?.[0]?.payload as LiquidityFlowPoint | undefined}
                      window={window}
                    />
                  )}
                  cursor={{ fill: rgba(theme.white, 0.03) }}
                />
                <ReferenceLine stroke={rgba(theme.subText, 0.24)} y={0} yAxisId="flow" />
                <Bar
                  dataKey="addUsd"
                  fill={addBarColor}
                  radius={[4, 4, 0, 0]}
                  stackId="liquidity-flow"
                  yAxisId="flow"
                />
                <Bar
                  dataKey="removeUsd"
                  fill={removeBarColor}
                  radius={[4, 4, 0, 0]}
                  stackId="liquidity-flow"
                  yAxisId="flow"
                />
                <Line
                  dataKey="lpVolumeUsd"
                  dot={false}
                  stroke={lpVolumeLineColor}
                  strokeWidth={2}
                  type="monotone"
                  yAxisId="flow"
                />
                <Line dataKey="tvlUsd" dot={false} stroke={theme.text} strokeWidth={2} type="monotone" yAxisId="tvl" />
              </ComposedChart>
            </ResponsiveContainer>
          </PoolChartWrapper>

          <HStack gap={16} justify="center" wrap="wrap">
            <HStack align="center" gap={8}>
              <LegendBar $color={theme.darkGreen} />
              <Text color={theme.subText} fontSize={12}>
                Add Liquidity
              </Text>
            </HStack>
            <HStack align="center" gap={8}>
              <LegendBar $color={theme.red1} />
              <Text color={theme.subText} fontSize={12}>
                Remove Liquidity
              </Text>
            </HStack>
            <HStack align="center" gap={8}>
              <LegendLine $color={theme.primary} />
              <Text color={theme.subText} fontSize={12}>
                LP Volume
              </Text>
            </HStack>
            <HStack align="center" gap={8}>
              <LegendLine $color={theme.text} />
              <Text color={theme.subText} fontSize={12}>
                TVL
              </Text>
            </HStack>
          </HStack>
        </Stack>
      </PoolChartState>
    </Stack>
  )
}

export default LiquidityFlowsChart

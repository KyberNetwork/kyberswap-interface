import { rgba } from 'polished'
import { useMemo, useState } from 'react'
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
  CHART_WINDOW_OPTIONS,
  formatAxisTimeLabel,
  formatCompactUsd,
  formatTooltipTimeLabel,
  formatUsd,
} from 'pages/Earns/PoolDetail/Information/utils'
import PoolChartState, { PoolChartWrapper } from 'pages/Earns/PoolDetail/components/PoolChartState'
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

type TooltipContentProps = {
  active?: boolean
  payload?: Array<{ payload?: LiquidityFlowPoint }>
}

type LiquidityFlowsChartProps = {
  chainId: number
  poolAddress: string
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
        {formatTooltipTimeLabel(point.ts, window)}
      </Text>
      <TooltipGrid>
        <Text color={theme.subText} fontSize={12}>
          Add Liquidity
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatUsd(Math.abs(point.addUsd))}
        </Text>
        <Text color={theme.subText} fontSize={12}>
          Remove Liquidity
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatUsd(Math.abs(point.removeUsd))}
        </Text>
        <Text color={theme.subText} fontSize={12}>
          Net Flow
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatUsd(Math.abs(point.lpVolumeUsd))}
        </Text>
        <Text color={theme.subText} fontSize={12}>
          TVL
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatUsd(point.tvlUsd)}
        </Text>
      </TooltipGrid>
    </TooltipCard>
  )
}

const LiquidityFlowsChart = ({ chainId, poolAddress }: LiquidityFlowsChartProps) => {
  const theme = useTheme()

  const [window, setWindow] = useState<PoolAnalyticsWindow>('7d')

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 280 : 360

  const activeDotStroke = theme.buttonBlack
  const addLiquidityColor = rgba(theme.darkGreen, 0.8)
  const cursorColor = rgba(theme.text, 0.12)
  const gridColor = rgba(theme.text, 0.06)
  const lpVolumeLineColor = theme.primary
  const referenceLineColor = rgba(theme.text, 0.12)
  const removeLiquidityColor = rgba(theme.red, 0.5)

  const {
    data: liquidityFlowData,
    isError,
    isLoading,
  } = usePoolLiquidityFlowsQuery({
    chainId,
    address: poolAddress,
    window,
  })

  const chartData = useMemo<LiquidityFlowPoint[]>(
    () =>
      (liquidityFlowData?.buckets ?? []).map(bucket => ({
        ...bucket,
        lpVolumeUsd: bucket.addUsd - bucket.removeUsd,
        removeUsd: -bucket.removeUsd,
      })),
    [liquidityFlowData?.buckets],
  )

  const handleSelectWindow = (value: PoolAnalyticsWindow) => {
    setWindow(value)
  }

  return (
    <Stack gap={16}>
      <HStack align="flex-start" gap={16} justify="space-between" wrap="wrap">
        <Text color={theme.text} fontSize={18} fontWeight={500}>
          Liquidity Flows
        </Text>

        <SegmentedControl onChange={handleSelectWindow} options={CHART_WINDOW_OPTIONS} value={window} />
      </HStack>

      <PoolChartState
        emptyMessage="No liquidity flow data available for this pool."
        errorMessage="Unable to load liquidity flows."
        exclusiveType="liquidity-flow"
        height={chartHeight}
        isEmpty={!chartData.length}
        isError={isError}
        isLoading={isLoading}
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
                <CartesianGrid stroke={gridColor} vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="ts"
                  minTickGap={24}
                  stroke={theme.subText}
                  tick={{ fill: theme.subText, fontSize: 12 }}
                  tickFormatter={(value: number) => formatAxisTimeLabel(value, window)}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  orientation="left"
                  stroke={theme.subText}
                  tick={{ fill: theme.subText, fontSize: 12 }}
                  tickFormatter={(value: number) => formatCompactUsd(value)}
                  tickLine={false}
                  width={72}
                  yAxisId="flow"
                />
                <YAxis
                  axisLine={false}
                  orientation="right"
                  stroke={theme.subText}
                  tick={{ fill: theme.subText, fontSize: 12 }}
                  tickFormatter={(value: number) => formatCompactUsd(value)}
                  tickLine={false}
                  width={72}
                  yAxisId="tvl"
                />
                <Tooltip
                  content={(props: TooltipContentProps) => (
                    <LiquidityFlowsTooltip
                      active={props.active}
                      point={props.payload?.[0]?.payload as LiquidityFlowPoint | undefined}
                      window={window}
                    />
                  )}
                  cursor={{ stroke: cursorColor, strokeDasharray: '4 4' }}
                />
                <ReferenceLine stroke={referenceLineColor} y={0} yAxisId="flow" />
                <Bar
                  dataKey="addUsd"
                  fill={addLiquidityColor}
                  radius={[4, 4, 0, 0]}
                  stackId="liquidity-flow"
                  yAxisId="flow"
                />
                <Bar
                  dataKey="removeUsd"
                  fill={removeLiquidityColor}
                  radius={[4, 4, 0, 0]}
                  stackId="liquidity-flow"
                  yAxisId="flow"
                />
                <Line
                  activeDot={{ fill: lpVolumeLineColor, r: 4, stroke: activeDotStroke, strokeWidth: 2 }}
                  dataKey="lpVolumeUsd"
                  dot={false}
                  stroke={lpVolumeLineColor}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  type="monotone"
                  yAxisId="flow"
                />
                <Line
                  activeDot={{ fill: theme.text, r: 4, stroke: activeDotStroke, strokeWidth: 2 }}
                  dataKey="tvlUsd"
                  dot={false}
                  stroke={theme.text}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  type="monotone"
                  yAxisId="tvl"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </PoolChartWrapper>

          <HStack gap={16} justify="center" wrap="wrap">
            <HStack align="center" gap={8}>
              <LegendBar $color={addLiquidityColor} />
              <Text color={theme.subText} fontSize={12}>
                Add Liquidity
              </Text>
            </HStack>
            <HStack align="center" gap={8}>
              <LegendBar $color={removeLiquidityColor} />
              <Text color={theme.subText} fontSize={12}>
                Remove Liquidity
              </Text>
            </HStack>
            <HStack align="center" gap={8}>
              <LegendLine $color={theme.primary} />
              <Text color={theme.subText} fontSize={12}>
                Net Flow
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

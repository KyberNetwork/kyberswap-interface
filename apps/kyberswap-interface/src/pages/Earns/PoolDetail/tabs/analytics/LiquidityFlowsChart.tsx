import { rgba } from 'polished'
import { useMemo } from 'react'
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
import { type PoolAnalyticsWindow, type PoolLiquidityFlowsAnalytics } from 'services/zapEarn'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import {
  ChartLoadingState,
  ChartState,
  ChartWrapper,
  SectionCard,
  SectionHeader,
  WindowSelector,
  formatAxisTimeLabel,
  formatCompactCurrency,
  formatSignedUsd,
  formatTooltipTimeLabel,
  formatUsd,
} from 'pages/Earns/PoolDetail/tabs/analytics/shared'
import { MEDIA_WIDTHS } from 'theme'

const SummaryRow = styled(HStack)`
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`

const TooltipCard = styled.div`
  min-width: 220px;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.tableHeader};
  box-shadow: 0 12px 32px ${({ theme }) => theme.shadow};
`

const TooltipGrid = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  gap: 8px 16px;
  margin-top: 12px;
`

const LegendRow = styled(HStack)`
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
`

const LegendItem = styled(HStack)`
  align-items: center;
  gap: 8px;
`

const LegendBar = styled.span<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: ${({ $color }) => $color};
`

const LegendLine = styled.span<{ $color: string }>`
  width: 18px;
  height: 0;
  border-top: 3px solid ${({ $color }) => $color};
  border-radius: 999px;
`

type LiquidityFlowPoint = {
  addUsd: number
  netFlow: number
  removeUsd: number
  removeUsdNegative: number
  totalVolumeUsd: number
  ts: number
  tvlUsd: number
}

type LiquidityFlowsChartProps = {
  analytics?: PoolLiquidityFlowsAnalytics
  isError: boolean
  isLoading: boolean
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
        {formatTooltipTimeLabel(point.ts, window)}
      </Text>
      <TooltipGrid>
        <Text color={theme.subText} fontSize={12}>
          Add Liquidity
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatUsd(point.addUsd)}
        </Text>
        <Text color={theme.subText} fontSize={12}>
          Remove Liquidity
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatUsd(point.removeUsd)}
        </Text>
        <Text color={theme.subText} fontSize={12}>
          Total Volume
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatUsd(point.totalVolumeUsd)}
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

const LiquidityFlowsChart = ({ analytics, isError, isLoading, onSelectWindow, window }: LiquidityFlowsChartProps) => {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 300 : 360

  const chartData = useMemo<LiquidityFlowPoint[]>(
    () =>
      analytics?.buckets.map(bucket => ({
        ts: bucket.ts,
        addUsd: bucket.addUsd,
        removeUsd: bucket.removeUsd,
        removeUsdNegative: -bucket.removeUsd,
        tvlUsd: bucket.tvlUsd,
        totalVolumeUsd: bucket.addUsd + bucket.removeUsd,
        netFlow: bucket.addUsd - bucket.removeUsd,
      })) || [],
    [analytics?.buckets],
  )

  const totals = useMemo(
    () =>
      chartData.reduce(
        (acc, point) => ({
          addUsd: acc.addUsd + point.addUsd,
          removeUsd: acc.removeUsd + point.removeUsd,
          totalVolumeUsd: acc.totalVolumeUsd + point.totalVolumeUsd,
          netFlow: acc.netFlow + point.netFlow,
        }),
        { addUsd: 0, removeUsd: 0, totalVolumeUsd: 0, netFlow: 0 },
      ),
    [chartData],
  )

  const maxFlowMagnitude = useMemo(
    () => Math.max(...chartData.map(point => Math.max(point.addUsd, point.removeUsd, point.totalVolumeUsd)), 1),
    [chartData],
  )

  const flowDomain = useMemo<[number, number]>(
    () => [-maxFlowMagnitude * 1.15, maxFlowMagnitude * 1.15],
    [maxFlowMagnitude],
  )

  const tvlDomain = useMemo<[number, number]>(() => {
    if (!chartData.length) return [0, 1]

    const minTvl = Math.min(...chartData.map(point => point.tvlUsd))
    const maxTvl = Math.max(...chartData.map(point => point.tvlUsd))
    const padding = Math.max((maxTvl - minTvl) * 0.15, maxTvl * 0.01, 1)

    return [Math.max(minTvl - padding, 0), maxTvl + padding]
  }, [chartData])

  const totalVolumeLineColor = rgba(theme.primary, 0.9)
  const addBarColor = rgba(theme.primary, 0.42)
  const removeBarColor = rgba(theme.red, 0.42)

  return (
    <SectionCard gap={20}>
      <SectionHeader>
        <Stack gap={6}>
          <Text color={theme.text} fontSize={18} fontWeight={500}>
            Liquidity Flows
          </Text>
          {chartData.length ? (
            <SummaryRow>
              <HStack align="baseline" gap={6}>
                <Text color={theme.subText} fontSize={14}>
                  Window Volume
                </Text>
                <Text color={theme.text} fontSize={14} fontWeight={500}>
                  {formatUsd(totals.totalVolumeUsd)}
                </Text>
              </HStack>
              <HStack align="baseline" gap={6}>
                <Text color={theme.subText} fontSize={14}>
                  Net Flow
                </Text>
                <Text color={totals.netFlow >= 0 ? theme.primary : theme.red} fontSize={14} fontWeight={500}>
                  {formatSignedUsd(totals.netFlow)}
                </Text>
              </HStack>
            </SummaryRow>
          ) : null}
        </Stack>

        <WindowSelector onSelect={onSelectWindow} window={window} />
      </SectionHeader>

      {isLoading && !chartData.length ? (
        <ChartLoadingState height={chartHeight} />
      ) : isError ? (
        <ChartState height={chartHeight} message="Unable to load liquidity flows." />
      ) : !chartData.length ? (
        <ChartState height={chartHeight} message="No liquidity flow data available for this pool." />
      ) : (
        <>
          <ChartWrapper $height={chartHeight}>
            <ResponsiveContainer height="100%" width="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 0, bottom: 8, left: 0 }}>
                <CartesianGrid stroke={rgba(theme.subText, 0.12)} vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="ts"
                  minTickGap={24}
                  stroke={theme.subText}
                  tickFormatter={(value: number) => formatAxisTimeLabel(value, window)}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  domain={flowDomain}
                  orientation="left"
                  stroke={theme.subText}
                  tickFormatter={(value: number) => formatCompactCurrency(value)}
                  tickLine={false}
                  width={72}
                  yAxisId="flow"
                />
                <YAxis
                  axisLine={false}
                  domain={tvlDomain}
                  orientation="right"
                  stroke={theme.subText}
                  tickFormatter={(value: number) => formatCompactCurrency(value)}
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
                  isAnimationActive={false}
                  radius={[6, 6, 0, 0]}
                  yAxisId="flow"
                />
                <Bar
                  dataKey="removeUsdNegative"
                  fill={removeBarColor}
                  isAnimationActive={false}
                  radius={[6, 6, 0, 0]}
                  yAxisId="flow"
                />
                <Line
                  dataKey="totalVolumeUsd"
                  dot={false}
                  isAnimationActive={false}
                  stroke={totalVolumeLineColor}
                  strokeWidth={2.5}
                  type="monotone"
                  yAxisId="flow"
                />
                <Line
                  dataKey="tvlUsd"
                  dot={false}
                  isAnimationActive={false}
                  stroke={theme.text}
                  strokeWidth={2.5}
                  type="monotone"
                  yAxisId="tvl"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartWrapper>

          <LegendRow>
            <LegendItem>
              <LegendBar $color={addBarColor} />
              <Text color={theme.subText} fontSize={13}>
                Add Liquidity
              </Text>
            </LegendItem>
            <LegendItem>
              <LegendBar $color={removeBarColor} />
              <Text color={theme.subText} fontSize={13}>
                Remove Liquidity
              </Text>
            </LegendItem>
            <LegendItem>
              <LegendLine $color={theme.text} />
              <Text color={theme.subText} fontSize={13}>
                TVL
              </Text>
            </LegendItem>
            <LegendItem>
              <LegendLine $color={totalVolumeLineColor} />
              <Text color={theme.subText} fontSize={13}>
                Total Volume
              </Text>
            </LegendItem>
          </LegendRow>
        </>
      )}
    </SectionCard>
  )
}

export default LiquidityFlowsChart

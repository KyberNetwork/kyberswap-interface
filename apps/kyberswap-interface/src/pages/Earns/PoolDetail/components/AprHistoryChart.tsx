import { formatAprNumber } from '@kyber/utils'
import { rgba } from 'polished'
import { useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { Bar, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  type PoolAnalyticsWindow,
  type PoolAprHistoryPoint,
  usePoolAprHistoryQuery,
  usePositionAprHistoryQuery,
} from 'services/zapEarn'
import styled from 'styled-components'

import SegmentedControl from 'components/SegmentedControl'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import {
  CHART_WINDOW_OPTIONS,
  formatAxisTimeLabel,
  formatTooltipTimeLabel,
} from 'pages/Earns/PoolDetail/Information/utils'
import PoolChartState, { PoolChartWrapper } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

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

const BaselineRow = styled(HStack)`
  align-items: baseline;
`

export const formatAprValue = (value?: number) => (value || value === 0 ? `${formatAprNumber(value)}%` : '--')

export const getLatestAprValues = (points?: PoolAprHistoryPoint[]) => {
  const latestTotalApr = [...(points ?? [])].reverse().find(point => point.totalApr !== undefined)?.totalApr
  const latestActiveApr = [...(points ?? [])].reverse().find(point => point.activeApr !== undefined)?.activeApr

  return {
    hasActiveApr: latestActiveApr !== undefined,
    latestActiveApr,
    latestTotalApr,
  }
}

const AprHistoryTooltip = ({
  active,
  point,
  window,
}: {
  active?: boolean
  point?: PoolAprHistoryPoint
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
        {point.activeApr ? (
          <>
            <Text color={theme.subText} fontSize={12}>
              Active APR
            </Text>
            <Text color={theme.blue} fontSize={12} fontWeight={500} textAlign="right">
              {formatAprNumber(point.activeApr)}%
            </Text>
          </>
        ) : null}
        <Text color={theme.subText} fontSize={12}>
          APR
        </Text>
        <Text color={theme.primary} fontSize={12} fontWeight={500} textAlign="right">
          {formatAprNumber(point.totalApr)}%
        </Text>
        {point.volumeUsd || point.volumeUsd === 0 ? (
          <>
            <Text color={theme.subText} fontSize={12}>
              Vol
            </Text>
            <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
              {formatDisplayNumber(point.volumeUsd, { style: 'currency', significantDigits: 6 })}
            </Text>
          </>
        ) : null}
      </TooltipGrid>
    </TooltipCard>
  )
}

type AprHistoryChartProps = {
  chainId: number
  poolAddress?: string
  positionId?: string
}

const AprHistoryChart = ({ chainId, poolAddress, positionId }: AprHistoryChartProps) => {
  const theme = useTheme()

  const [window, setWindow] = useState<PoolAnalyticsWindow>('7d')

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 280 : 360

  const activeDotStroke = theme.buttonBlack
  const aprLineColor = theme.primary
  const activeAprLineColor = theme.blue
  const volumeUpColor = rgba(theme.darkGreen, 0.8)
  const volumeDownColor = rgba(theme.red, 0.5)
  const cursorColor = rgba(theme.text, 0.12)
  const gridColor = rgba(theme.text, 0.06)

  const poolAprHistoryQuery = usePoolAprHistoryQuery(
    { chainId, address: poolAddress || '', window },
    { skip: !poolAddress },
  )
  const positionAprHistoryQuery = usePositionAprHistoryQuery(
    { chainId, positionId: positionId || '', window },
    { skip: !positionId },
  )

  const isPositionChart = !!positionId
  const aprHistoryData = isPositionChart ? positionAprHistoryQuery.data : poolAprHistoryQuery.data
  const isError = isPositionChart ? positionAprHistoryQuery.isError : poolAprHistoryQuery.isError
  const isLoading = isPositionChart ? positionAprHistoryQuery.isLoading : poolAprHistoryQuery.isLoading

  const chartData = useMemo(
    () =>
      (aprHistoryData?.points ?? []).map((point, index, points) => {
        return {
          ...point,
          volumeBarColor:
            point.volumeUsd >= (points[index - 1]?.volumeUsd ?? point.volumeUsd) ? volumeUpColor : volumeDownColor,
        }
      }),
    [aprHistoryData?.points, volumeDownColor, volumeUpColor],
  )

  const intervalMaxApr = useMemo(() => {
    const values = chartData
      .map(point => point.totalApr)
      .filter((value): value is number => value !== undefined && !Number.isNaN(value))
    return values.length ? Math.max(...values) : undefined
  }, [chartData])

  const { hasActiveApr, latestActiveApr, latestTotalApr } = useMemo(() => getLatestAprValues(chartData), [chartData])

  return (
    <Stack gap={16}>
      <HStack align="flex-start" gap={16} justify="space-between" wrap="wrap">
        <Stack gap={12}>
          <HStack align="center" gap="12px 24px" wrap="wrap">
            {hasActiveApr && latestTotalApr !== undefined ? (
              <BaselineRow gap={4}>
                <Text color={theme.subText} fontSize={14}>
                  APR
                </Text>
                <Text color={theme.text} fontSize={14} fontWeight={500}>
                  {formatAprValue(latestTotalApr)}
                </Text>
              </BaselineRow>
            ) : null}
            <BaselineRow gap={4}>
              <Text color={theme.subText} fontSize={14}>
                Max APR
              </Text>
              <Text color={theme.text} fontSize={14} fontWeight={500}>
                {formatAprValue(intervalMaxApr)}
              </Text>
            </BaselineRow>
          </HStack>

          {hasActiveApr ? (
            <BaselineRow gap={8} wrap="wrap">
              <Text color={theme.text} fontSize={16} fontWeight={500}>
                {positionId ? 'Position Active APR' : 'Active APR'}
              </Text>
              <Text color={theme.blue} fontSize={20} fontWeight={500} lineHeight={1}>
                {formatAprValue(latestActiveApr)}
              </Text>
              <Text color={theme.subText} fontSize={14}>
                (Earning Per Active TVL)
              </Text>
            </BaselineRow>
          ) : (
            <BaselineRow gap={8} wrap="wrap">
              <Text color={theme.text} fontSize={16} fontWeight={500}>
                APR
              </Text>
              <Text color={theme.primary} fontSize={20} fontWeight={500} lineHeight={1}>
                {formatAprValue(latestTotalApr)}
              </Text>
              <Text color={theme.subText} fontSize={14}>
                (Earning Per Total TVL)
              </Text>
            </BaselineRow>
          )}
        </Stack>

        <SegmentedControl onChange={setWindow} options={CHART_WINDOW_OPTIONS} value={window} />
      </HStack>

      <PoolChartState
        emptyMessage="Historical APR data is not available yet."
        errorMessage="Unable to load APR history."
        height={chartHeight}
        isEmpty={!chartData.length}
        isError={isError}
        isLoading={isLoading}
        skeletonType="line"
      >
        <PoolChartWrapper $height={chartHeight}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 16, right: 0, bottom: 8, left: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
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
                orientation="right"
                stroke={theme.subText}
                tick={{ fill: theme.subText, fontSize: 12 }}
                tickFormatter={(value: number) => `${formatAprNumber(Number(value))}%`}
                tickLine={false}
                width={72}
              />
              <YAxis
                dataKey="volumeUsd"
                domain={[0, (dataMax: number) => (dataMax > 0 ? dataMax * 5 : 1)]}
                hide
                yAxisId="volumeUsd"
              />
              <Tooltip
                content={({ active, payload }) => (
                  <AprHistoryTooltip active={active} point={payload?.[0]?.payload} window={window} />
                )}
                cursor={{ stroke: cursorColor, strokeDasharray: '4 4' }}
              />
              <Bar barSize={8} dataKey="volumeUsd" radius={[2, 2, 0, 0]} yAxisId="volumeUsd">
                {chartData.map(point => (
                  <Cell key={`${point.ts}-volumeUsd`} fill={point.volumeBarColor} />
                ))}
              </Bar>
              {hasActiveApr && (
                <Line
                  activeDot={{ fill: activeAprLineColor, r: 4, stroke: activeDotStroke, strokeWidth: 2 }}
                  dataKey="activeApr"
                  dot={false}
                  stroke={activeAprLineColor}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  type="monotone"
                />
              )}
              <Line
                activeDot={{ fill: aprLineColor, r: 4, stroke: activeDotStroke, strokeWidth: 2 }}
                dataKey="totalApr"
                dot={false}
                stroke={aprLineColor}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                type="monotone"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </PoolChartWrapper>
      </PoolChartState>
    </Stack>
  )
}

export default AprHistoryChart

import { formatAprNumber } from '@kyber/utils'
import { rgba } from 'polished'
import { useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { type PoolAnalyticsWindow, type PoolAprHistoryPoint, usePoolAprHistoryQuery } from 'services/zapEarn'
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

const TooltipCard = styled(Stack)`
  gap: 8px;
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

const formatAprValue = (value?: number) => (value || value === 0 ? `${formatAprNumber(value)}%` : '--')

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
        <Text color={theme.subText} fontSize={12}>
          APR
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatAprNumber(point.totalApr)}%
        </Text>
        {point.activeApr ? (
          <>
            <Text color={theme.subText} fontSize={12}>
              Active APR
            </Text>
            <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
              {formatAprNumber(point.activeApr)}%
            </Text>
          </>
        ) : null}
        <Text color={theme.subText} fontSize={12}>
          LP Fees
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatAprNumber(point.feeApr)}%
        </Text>
        <Text color={theme.subText} fontSize={12}>
          EG Sharing Reward
        </Text>
        <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
          {formatAprNumber(point.egApr)}%
        </Text>
        {point.lmApr ? (
          <>
            <Text color={theme.subText} fontSize={12}>
              LM Reward
            </Text>
            <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
              {formatAprNumber(point.lmApr)}%
            </Text>
          </>
        ) : null}
        {point.bonusApr ? (
          <>
            <Text color={theme.subText} fontSize={12}>
              Bonus Reward
            </Text>
            <Text color={theme.text} fontSize={12} fontWeight={500} textAlign="right">
              {formatAprNumber(point.bonusApr)}%
            </Text>
          </>
        ) : null}
      </TooltipGrid>
    </TooltipCard>
  )
}

type AprHistoryChartProps = {
  chainId: number
  poolAddress: string
}

const AprHistoryChart = ({ chainId, poolAddress }: AprHistoryChartProps) => {
  const theme = useTheme()

  const [window, setWindow] = useState<PoolAnalyticsWindow>('7d')

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 280 : 360

  const {
    currentData: aprHistoryData,
    isError,
    isFetching,
  } = usePoolAprHistoryQuery({
    chainId,
    address: poolAddress,
    window,
  })

  const chartData = useMemo(() => aprHistoryData?.points ?? [], [aprHistoryData?.points])

  const intervalMaxApr = useMemo(() => {
    const values = chartData
      .map(point => point.totalApr)
      .filter((value): value is number => value !== undefined && !Number.isNaN(value))
    return values.length ? Math.max(...values) : undefined
  }, [chartData])

  const latestTotalApr = useMemo(
    () => [...chartData].reverse().find(point => point.totalApr !== undefined)?.totalApr,
    [chartData],
  )
  const latestActiveApr = useMemo(
    () => [...chartData].reverse().find(point => point.activeApr !== undefined)?.activeApr,
    [chartData],
  )
  const hasActiveApr = latestActiveApr !== undefined

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
                Active APR
              </Text>
              <Text color={theme.primary} fontSize={20} fontWeight={500} lineHeight={1}>
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
        isLoading={isFetching && !aprHistoryData}
      >
        <PoolChartWrapper $height={chartHeight}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 16, right: 0, bottom: 8, left: 0 }}>
              <CartesianGrid stroke={rgba(theme.subText, 0.12)} strokeDasharray="3 3" vertical={false} />
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
              <Tooltip
                content={({ active, payload }) => (
                  <AprHistoryTooltip active={active} point={payload?.[0]?.payload} window={window} />
                )}
                cursor={{ stroke: rgba(theme.primary, 0.28), strokeDasharray: '4 4' }}
              />
              <Line
                activeDot={{ fill: theme.primary, r: 4, stroke: theme.buttonBlack, strokeWidth: 2 }}
                dataKey="totalApr"
                dot={false}
                stroke={theme.primary}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </PoolChartWrapper>
      </PoolChartState>
    </Stack>
  )
}

export default AprHistoryChart

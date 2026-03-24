import { formatAprNumber } from '@kyber/utils'
import { rgba } from 'polished'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { type PoolActiveAprBucket, type PoolAnalyticsWindow, usePoolActiveAprQuery } from 'services/zapEarn'
import styled from 'styled-components'

import { Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { formatAxisTimeLabel, formatTooltipTimeLabel } from 'pages/Earns/PoolDetail/Information/utils'
import PoolChartState, { PoolChartWrapper } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { MEDIA_WIDTHS } from 'theme'

export type AprPeriod = '24H' | '7D' | '30D'

type ActiveAprChartProps = {
  aprInterval: AprPeriod
}

const APR_WINDOW_MAPPING: Record<AprPeriod, PoolAnalyticsWindow> = {
  ['24H']: '24h',
  ['7D']: '7d',
  ['30D']: '30d',
}

const TooltipCard = styled(Stack)`
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.tableHeader};
  border-radius: 12px;
  box-shadow: 0 12px 32px ${({ theme }) => theme.shadow};
`

const ActiveAprTooltip = ({
  active,
  point,
  window,
}: {
  active?: boolean
  point?: PoolActiveAprBucket
  window: PoolAnalyticsWindow
}) => {
  const theme = useTheme()

  if (!active || !point) return null

  return (
    <TooltipCard>
      <Text color={theme.subText} fontSize={12}>
        {formatTooltipTimeLabel(point.ts, window)}
      </Text>
      <Text color={theme.text} fontSize={14} fontWeight={500}>
        {formatAprNumber(point.activeApr)}%
      </Text>
    </TooltipCard>
  )
}

const ActiveAprChart = ({ aprInterval }: ActiveAprChartProps) => {
  const theme = useTheme()
  const { chainId, poolAddress } = usePoolDetailContext()

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 280 : 360
  const window = APR_WINDOW_MAPPING[aprInterval]

  const {
    currentData: analytics,
    isError,
    isFetching,
  } = usePoolActiveAprQuery({
    chainId,
    address: poolAddress,
    window,
  })

  const chartData = analytics?.buckets ?? []

  return (
    <PoolChartState
      emptyMessage="Historical APR data is not available yet."
      errorMessage="Unable to load active APR."
      height={chartHeight}
      isEmpty={!chartData.length}
      isError={isError}
      isLoading={isFetching && !analytics}
    >
      <PoolChartWrapper $height={chartHeight}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 16, right: 0, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={rgba(theme.border, 0.24)} strokeDasharray="3 3" vertical={false} />
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
                <ActiveAprTooltip
                  active={active}
                  point={payload?.[0]?.payload as PoolActiveAprBucket | undefined}
                  window={window}
                />
              )}
              cursor={{ stroke: rgba(theme.border, 0.24), strokeDasharray: '4 4' }}
            />
            <Line
              activeDot={{ r: 6, fill: theme.blue, stroke: theme.buttonBlack, strokeWidth: 3 }}
              dataKey="activeApr"
              dot={false}
              stroke={theme.blue}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </PoolChartWrapper>
    </PoolChartState>
  )
}

export default ActiveAprChart

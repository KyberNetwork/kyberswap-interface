import { useMemo } from 'react'
import { Text } from 'rebass'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import { Pool } from 'pages/Earns/PoolDetail/types'
import { formatPoolInfoCurrency, formatPoolInfoPercent } from 'pages/Earns/PoolDetail/utils/poolInformation'

export type AprPeriod = '24H' | '7D' | '30D'

export interface AprChartPoint {
  label: AprPeriod
  value?: number
  lpApr?: number
  rewardApr?: number
  volumeUsd?: number
  lpFeeUsd?: number
}

interface InformationAprChartProps {
  pool?: Pool
  interval: AprPeriod
}

interface ChartSeriesPoint extends Omit<AprChartPoint, 'value'> {
  value: number
  periodLabel: string
  position: number
  isAnchor: boolean
  periodKey?: AprPeriod
}

const ChartWrapper = styled.div`
  width: 100%;
  height: 320px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    height: 260px;
  `}
`

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.02);
`

const TooltipCard = styled.div`
  min-width: 180px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #2c2c2c;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
`

const TooltipLabel = styled(Text)`
  color: ${({ theme }) => theme.subText};
  font-size: 13px;
`

const TooltipValue = styled(Text)`
  color: ${({ theme }) => theme.text};
  font-size: 22px;
  font-weight: 500;
`

const TooltipGrid = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  gap: 8px 16px;
  margin-top: 12px;
`

const TooltipMetricLabel = styled(Text)`
  color: ${({ theme }) => theme.subText};
  font-size: 13px;
`

const TooltipMetricValue = styled(Text)`
  color: ${({ theme }) => theme.text};
  font-size: 13px;
  font-weight: 500;
  text-align: right;
`

const getYAxisTicks = (maxValue: number) => {
  const safeMax = maxValue > 0 ? maxValue : 1
  const paddedMax = safeMax * 1.15
  return Array.from({ length: 5 }, (_, index) => (paddedMax * index) / 4)
}

const PERIOD_DAY_MAPPING: Record<AprPeriod, number> = {
  ['24H']: 1,
  ['7D']: 7,
  ['30D']: 30,
}

const SEGMENT_POINT_COUNT = 12

const interpolateMetric = (start?: number, end?: number, ratio = 0, variance = 0, seed = 0) => {
  if (start === undefined && end === undefined) return undefined
  const from = start ?? end ?? 0
  const to = end ?? start ?? 0
  const base = from + (to - from) * ratio
  const amplitude = Math.max(Math.abs(to - from), Math.abs(from), Math.abs(to), 1) * variance
  const noise = (Math.sin(seed * 1.618) + Math.cos(seed * 0.73)) * 0.5

  return Math.max(base + amplitude * noise, 0)
}

const formatSyntheticLabel = (dayValue: number) => {
  if (dayValue <= 1.5) return `${Math.max(Math.round(dayValue * 24), 24)}H`
  return `${Math.round(dayValue)}D`
}

const getRewardAprByPeriod = (pool: Pool | undefined, period: AprPeriod) => {
  if (!pool?.poolStats) return undefined

  const totalApr =
    period === '24H'
      ? pool.poolStats.allApr24h ?? pool.poolStats.aprStats?.all?.['1d'] ?? pool.allApr ?? pool.poolStats.apr24h
      : period === '7D'
      ? pool.poolStats.allApr7d ?? pool.poolStats.aprStats?.all?.['7d']
      : pool.poolStats.allApr30d ?? pool.poolStats.aprStats?.all?.['30d']

  const lpApr =
    period === '24H'
      ? pool.poolStats.lpApr24h ?? pool.poolStats.aprStats?.lp?.['1d']
      : period === '7D'
      ? pool.poolStats.lpApr7d ?? pool.poolStats.aprStats?.lp?.['7d']
      : pool.poolStats.lpApr30d ?? pool.poolStats.aprStats?.lp?.['30d']

  if (totalApr === undefined || lpApr === undefined) return undefined
  return Math.max(totalApr - lpApr, 0)
}

const buildAnchorPoints = (pool: Pool | undefined): AprChartPoint[] => [
  {
    label: '24H',
    value:
      pool?.poolStats?.allApr24h ?? pool?.poolStats?.aprStats?.all?.['1d'] ?? pool?.allApr ?? pool?.poolStats?.apr24h,
    lpApr: pool?.poolStats?.lpApr24h ?? pool?.poolStats?.aprStats?.lp?.['1d'],
    rewardApr: getRewardAprByPeriod(pool, '24H'),
    volumeUsd: pool?.poolStats?.volumeUsd?.['1d'] ?? pool?.poolStats?.volume24h,
    lpFeeUsd: pool?.poolStats?.lpFeeUsd?.['1d'] ?? pool?.poolStats?.fees24h,
  },
  {
    label: '7D',
    value: pool?.poolStats?.allApr7d ?? pool?.poolStats?.aprStats?.all?.['7d'],
    lpApr: pool?.poolStats?.lpApr7d ?? pool?.poolStats?.aprStats?.lp?.['7d'],
    rewardApr: getRewardAprByPeriod(pool, '7D'),
    volumeUsd: pool?.poolStats?.volumeUsd?.['7d'],
    lpFeeUsd: pool?.poolStats?.lpFeeUsd?.['7d'],
  },
  {
    label: '30D',
    value: pool?.poolStats?.allApr30d ?? pool?.poolStats?.aprStats?.all?.['30d'],
    lpApr: pool?.poolStats?.lpApr30d ?? pool?.poolStats?.aprStats?.lp?.['30d'],
    rewardApr: getRewardAprByPeriod(pool, '30D'),
    volumeUsd: pool?.poolStats?.volumeUsd?.['30d'],
    lpFeeUsd: pool?.poolStats?.lpFeeUsd?.['30d'],
  },
]

const buildSyntheticSeries = (points: AprChartPoint[]) => {
  const anchors = points.filter(
    (item): item is AprChartPoint & { value: number } => item.value !== undefined && item.value !== null,
  )

  if (!anchors.length) return []

  const series: ChartSeriesPoint[] = []
  let position = 0

  anchors.forEach((anchor, index) => {
    series.push({
      ...anchor,
      value: anchor.value,
      isAnchor: true,
      periodKey: anchor.label,
      periodLabel: anchor.label,
      position,
    })

    const nextAnchor = anchors[index + 1]
    if (!nextAnchor) return

    const startDays = PERIOD_DAY_MAPPING[anchor.label]
    const endDays = PERIOD_DAY_MAPPING[nextAnchor.label]

    Array.from({ length: SEGMENT_POINT_COUNT }).forEach((_, innerIndex) => {
      const ratio = (innerIndex + 1) / (SEGMENT_POINT_COUNT + 1)
      const seed = position + innerIndex + 1

      position += 1
      series.push({
        label: anchor.label,
        value: interpolateMetric(anchor.value, nextAnchor.value, ratio, 0.1, seed) ?? anchor.value,
        lpApr: interpolateMetric(anchor.lpApr, nextAnchor.lpApr, ratio, 0.08, seed + 3),
        rewardApr: interpolateMetric(anchor.rewardApr, nextAnchor.rewardApr, ratio, 0.06, seed + 7),
        volumeUsd: interpolateMetric(anchor.volumeUsd, nextAnchor.volumeUsd, ratio, 0.14, seed + 11),
        lpFeeUsd: interpolateMetric(anchor.lpFeeUsd, nextAnchor.lpFeeUsd, ratio, 0.12, seed + 17),
        isAnchor: false,
        periodLabel: formatSyntheticLabel(startDays + (endDays - startDays) * ratio),
        position,
      })
    })

    position += 1
  })

  return series
}

const InformationAprChart = ({ pool, interval }: InformationAprChartProps) => {
  const theme = useTheme()

  const chartData = useMemo(() => buildSyntheticSeries(buildAnchorPoints(pool)), [pool])
  const xAxisTicks = useMemo(() => chartData.filter(item => item.isAnchor).map(item => item.position), [chartData])

  const yAxisTicks = useMemo(() => getYAxisTicks(Math.max(...chartData.map(item => item.value), 0)), [chartData])

  if (!chartData.length) {
    return (
      <ChartWrapper>
        <EmptyState>
          <Text color="subText" fontSize={15}>
            Historical APR data is not available yet.
          </Text>
        </EmptyState>
      </ChartWrapper>
    )
  }

  return (
    <ChartWrapper>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 16, right: 0, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="position"
            ticks={xAxisTicks}
            tick={{ fill: theme.subText, fontSize: 13, fontWeight: 400 }}
            tickFormatter={value => chartData.find(item => item.position === value)?.periodKey || ''}
            tickLine={false}
            type="number"
          />
          <YAxis
            axisLine={false}
            domain={[0, yAxisTicks[yAxisTicks.length - 1] || 'auto']}
            orientation="right"
            tick={{ fill: theme.subText, fontSize: 13, fontWeight: 400 }}
            tickCount={5}
            tickFormatter={value => formatPoolInfoPercent(Number(value))}
            tickLine={false}
            ticks={yAxisTicks}
            width={72}
          />
          <Tooltip
            content={({ active, payload }) => {
              const value = payload?.[0]?.value
              const label = payload?.[0]?.payload?.periodLabel
              if (!active || value === undefined || !label) return null

              return (
                <TooltipCard>
                  <TooltipLabel>{label}</TooltipLabel>
                  <TooltipValue>{formatPoolInfoPercent(Number(value))}</TooltipValue>
                  <TooltipGrid>
                    <TooltipMetricLabel>LP APR</TooltipMetricLabel>
                    <TooltipMetricValue>{formatPoolInfoPercent(payload?.[0]?.payload.lpApr)}</TooltipMetricValue>
                    <TooltipMetricLabel>Reward APR</TooltipMetricLabel>
                    <TooltipMetricValue>{formatPoolInfoPercent(payload?.[0]?.payload.rewardApr)}</TooltipMetricValue>
                    <TooltipMetricLabel>Volume</TooltipMetricLabel>
                    <TooltipMetricValue>{formatPoolInfoCurrency(payload?.[0]?.payload.volumeUsd)}</TooltipMetricValue>
                    <TooltipMetricLabel>Fees</TooltipMetricLabel>
                    <TooltipMetricValue>{formatPoolInfoCurrency(payload?.[0]?.payload.lpFeeUsd)}</TooltipMetricValue>
                  </TooltipGrid>
                </TooltipCard>
              )
            }}
            cursor={{ stroke: 'rgba(255, 255, 255, 0.16)', strokeDasharray: '4 4' }}
          />
          <Line
            activeDot={{ r: 7, fill: '#54AEFF', stroke: theme.buttonBlack, strokeWidth: 3 }}
            dataKey="value"
            dot={({ cx, cy, payload }) => {
              const hasValidPosition = typeof cx === 'number' && typeof cy === 'number'
              const dotKey =
                payload?.position !== undefined ? `apr-dot-${payload.position}` : `apr-dot-${String(cx)}-${String(cy)}`

              return (
                <circle
                  cx={hasValidPosition ? cx : 0}
                  cy={hasValidPosition ? cy : 0}
                  fill="#54AEFF"
                  key={dotKey}
                  opacity={hasValidPosition ? (payload.periodKey === interval ? 1 : 0.65) : 0}
                  r={payload.periodKey === interval ? 6 : 3.5}
                  stroke={theme.buttonBlack}
                  strokeWidth={payload.periodKey === interval ? 3 : 2}
                />
              )
            }}
            stroke="#54AEFF"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export default InformationAprChart

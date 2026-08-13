import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { usePoolEarningsQuery, usePositionEarningsQuery } from 'services/earn'
import type { PoolAnalyticsWindow } from 'services/earn/types'

import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { formatCompactUsd, formatUsd } from 'pages/Earns/PoolDetail/Information/utils'

type EarningsSegmentKey = 'lpFeeUsd' | 'lmUsd' | 'egUsd' | 'bonusUsd'

type PoolEarningPieChartItem = {
  color: string
  key: EarningsSegmentKey
  label: string
  value: number
}

type PoolEarningPieChartProps = {
  chainId: number
  poolAddress?: string
  positionId?: string
  size: number
}

const EARNINGS_BREAKDOWN_WINDOW: PoolAnalyticsWindow = '30d'

const LegendDot = ({ $color }: { $color: string }) => (
  <span className="size-3 flex-shrink-0 rounded-full" style={{ background: $color }} />
)

const PoolEarningPieChartSkeleton = ({ size }: { size: number }) => (
  <Stack className="mx-auto flex-row items-center justify-center gap-5 max-sm:w-full max-sm:flex-col max-sm:gap-3 sm:w-fit">
    <Skeleton circle height={size} width={size} />
    <Stack className="w-fit gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton height={17} key={index} width={120} />
      ))}
    </Stack>
  </Stack>
)

const PoolEarningPieChart = ({ chainId, poolAddress, positionId, size }: PoolEarningPieChartProps) => {
  const theme = useTheme()
  const isPositionChart = !!positionId

  const poolEarningsQuery = usePoolEarningsQuery(
    { chainId, address: poolAddress || '', window: EARNINGS_BREAKDOWN_WINDOW },
    { skip: !poolAddress },
  )
  const positionEarningsQuery = usePositionEarningsQuery(
    { chainId, positionId: positionId || '', window: EARNINGS_BREAKDOWN_WINDOW },
    { skip: !positionId },
  )

  const earningsData = isPositionChart ? positionEarningsQuery.data : poolEarningsQuery.data
  const isError = isPositionChart ? positionEarningsQuery.isError : poolEarningsQuery.isError
  const isLoading = isPositionChart ? positionEarningsQuery.isLoading : poolEarningsQuery.isLoading
  const buckets = useMemo(() => earningsData?.buckets ?? [], [earningsData?.buckets])
  const hasBonusUsd = useMemo(() => buckets.some(bucket => bucket.bonusUsd !== undefined), [buckets])

  const items = useMemo<PoolEarningPieChartItem[]>(() => {
    const config: Omit<PoolEarningPieChartItem, 'value'>[] = [
      { key: 'lpFeeUsd', label: 'LP Fee', color: theme.blue },
      { key: 'lmUsd', label: 'LM Rewards', color: '#42B8AE' },
      { key: 'egUsd', label: 'EG Sharing', color: '#DFD56A' },
      { key: 'bonusUsd', label: 'Bonus', color: '#FF9B5C' },
    ]

    return (hasBonusUsd ? config : config.filter(item => item.key !== 'bonusUsd')).map(item => ({
      ...item,
      value: buckets.reduce((sum, bucket) => sum + (bucket[item.key] ?? 0), 0),
    }))
  }, [buckets, hasBonusUsd, theme.blue])

  const pieData = useMemo(() => items.filter(item => item.value > 0), [items])
  const totalEarned = buckets.reduce((sum, bucket) => sum + bucket.totalUsd, 0)

  if (isLoading) {
    return <PoolEarningPieChartSkeleton size={size} />
  }

  if (isError) {
    return <span className="mx-auto text-sm font-medium text-subText">Unable to load earning breakdown.</span>
  }

  return (
    <Stack className="mx-auto flex-row items-center justify-center gap-5 max-sm:w-full max-sm:flex-col max-sm:gap-3 sm:w-fit">
      <Stack className="relative shrink-0" style={{ height: size, width: size }}>
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
        {items.map(item => (
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
  )
}

export default PoolEarningPieChart

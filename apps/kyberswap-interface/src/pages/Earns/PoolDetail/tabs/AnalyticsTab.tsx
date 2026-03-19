import { useMemo, useState } from 'react'
import { Text } from 'rebass'
import { type PoolAnalyticsWindow, usePoolLiquidityFlowsQuery, usePoolPriceQuery } from 'services/zapEarn'

import { Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import LiquidityFlowsChart from 'pages/Earns/PoolDetail/tabs/analytics/LiquidityFlowsChart'
import PoolPriceChart from 'pages/Earns/PoolDetail/tabs/analytics/PoolPriceChart'
import { MetricCard, MetricsStrip, formatNumber, formatUsd } from 'pages/Earns/PoolDetail/tabs/analytics/shared'

const AnalyticsTab = () => {
  const theme = useTheme()
  const { pool, poolParams } = usePoolDetailContext()
  const [window, setWindow] = useState<PoolAnalyticsWindow>('7d')

  const {
    data: priceAnalytics,
    isError: isPriceError,
    isLoading: isPriceLoading,
  } = usePoolPriceQuery({
    chainId: poolParams.poolChainId,
    address: poolParams.poolAddress,
    window,
  })

  const {
    data: liquidityFlows,
    isError: isLiquidityFlowsError,
    isLoading: isLiquidityFlowsLoading,
  } = usePoolLiquidityFlowsQuery({
    chainId: poolParams.poolChainId,
    address: poolParams.poolAddress,
    window,
  })

  const currentLiquidityBucket = liquidityFlows?.buckets?.[liquidityFlows.buckets.length - 1]

  const totalTvl = useMemo(() => {
    if (pool?.tvl !== undefined) return pool.tvl
    if (pool?.poolStats?.tvl !== undefined) return pool.poolStats.tvl
    if (pool?.reserveUsd !== undefined) {
      const parsedReserveUsd = Number(pool.reserveUsd)
      if (!Number.isNaN(parsedReserveUsd)) return parsedReserveUsd
    }

    return undefined
  }, [pool?.poolStats?.tvl, pool?.reserveUsd, pool?.tvl])

  const metrics = [
    { label: 'TVL', value: formatUsd(totalTvl) },
    { label: 'Current TVL', value: formatUsd(currentLiquidityBucket?.tvlUsd ?? totalTvl) },
    { label: 'Liquidity Provider', value: formatNumber(pool?.liquidity) },
  ]

  return (
    <Stack gap={16}>
      <MetricsStrip>
        {metrics.map(metric => (
          <MetricCard gap={4} key={metric.label}>
            <Text color={theme.subText} fontSize={14}>
              {metric.label}
            </Text>
            <Text color={theme.text} fontSize={20} fontWeight={500}>
              {metric.value}
            </Text>
          </MetricCard>
        ))}
      </MetricsStrip>

      <PoolPriceChart
        analytics={priceAnalytics}
        baseSymbol={pool.tokens[0]?.symbol}
        isError={isPriceError}
        isLoading={isPriceLoading}
        onSelectWindow={setWindow}
        quoteSymbol={pool.tokens[1]?.symbol}
        window={window}
      />

      <LiquidityFlowsChart
        analytics={liquidityFlows}
        isError={isLiquidityFlowsError}
        isLoading={isLiquidityFlowsLoading}
        onSelectWindow={setWindow}
        window={window}
      />
    </Stack>
  )
}

export default AnalyticsTab

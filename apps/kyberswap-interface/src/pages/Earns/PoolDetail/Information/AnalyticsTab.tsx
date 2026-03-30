import { useState } from 'react'

import { Stack } from 'components/Stack'
import { formatUsd, getPoolLiquidityUsd } from 'pages/Earns/PoolDetail/Information/utils'
import LiquidityFlowsChart from 'pages/Earns/PoolDetail/components/LiquidityFlowsChart'
import PoolPriceChart from 'pages/Earns/PoolDetail/components/PoolPriceChart'
import TopMetricsStrip from 'pages/Earns/PoolDetail/components/TopMetricsStrip'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { useTokenPrices } from 'state/tokenPrices/hooks'

const AnalyticsTab = () => {
  const { pool } = usePoolDetailContext()

  const [currentTvl, setCurrentTvl] = useState<number | undefined>()

  const tokenPrices = useTokenPrices(
    pool.tokens.map(token => token.address),
    pool.chainId,
  )

  let totalTvl = pool.tvl ?? pool.poolStats?.tvl

  if (totalTvl === undefined && pool.reserveUsd !== undefined) {
    const parsedReserveUsd = Number(pool.reserveUsd)

    totalTvl = Number.isNaN(parsedReserveUsd) ? undefined : parsedReserveUsd
  }

  const liquidityUsdValue = getPoolLiquidityUsd(pool, tokenPrices)

  const metrics = [
    { label: 'TVL', value: formatUsd(totalTvl) },
    { label: 'Current TVL', value: formatUsd(currentTvl ?? totalTvl) },
    { label: 'Liquidity', value: formatUsd(liquidityUsdValue) },
  ]

  return (
    <Stack gap={20}>
      <TopMetricsStrip items={metrics} split={true} />

      <PoolPriceChart />

      <LiquidityFlowsChart onCurrentTvlChange={setCurrentTvl} />
    </Stack>
  )
}

export default AnalyticsTab

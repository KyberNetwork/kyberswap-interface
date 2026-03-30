import { useState } from 'react'

import { Stack } from 'components/Stack'
import { formatUsd, getPoolLiquidityUsd } from 'pages/Earns/PoolDetail/Information/utils'
import LiquidityFlowsChart from 'pages/Earns/PoolDetail/components/LiquidityFlowsChart'
import PoolPriceChart from 'pages/Earns/PoolDetail/components/PoolPriceChart'
import TopMetricsStrip from 'pages/Earns/PoolDetail/components/TopMetricsStrip'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { useTokenPrices } from 'state/tokenPrices/hooks'

const AnalyticsTab = () => {
  const { chainId, pool, poolAddress } = usePoolDetailContext()
  const [currentTvl, setCurrentTvl] = useState<number | undefined>()

  const tokenPrices = useTokenPrices(
    pool.tokens.map(token => token.address),
    chainId,
  )
  const totalTvl = pool.poolStats?.tvl

  const liquidityUsdValue = getPoolLiquidityUsd(pool, tokenPrices)

  const metrics = [
    { label: 'TVL', value: formatUsd(totalTvl) },
    { label: 'Current TVL', value: formatUsd(currentTvl ?? totalTvl) },
    { label: 'Liquidity', value: formatUsd(liquidityUsdValue) },
  ]

  return (
    <Stack gap={20}>
      <TopMetricsStrip items={metrics} split={true} />

      <PoolPriceChart chainId={chainId} poolAddress={poolAddress} />

      <LiquidityFlowsChart chainId={chainId} onCurrentTvlChange={setCurrentTvl} poolAddress={poolAddress} />
    </Stack>
  )
}

export default AnalyticsTab

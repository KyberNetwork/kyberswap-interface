import { Stack } from 'components/Stack'
import LiquidityFlowsChart from 'pages/Earns/PoolDetail/components/LiquidityFlowsChart'
import PoolPriceChart from 'pages/Earns/PoolDetail/components/PoolPriceChart'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'

const AnalyticsTab = () => {
  const { chainId, poolAddress } = usePoolDetailContext()

  return (
    <Stack gap={20}>
      <PoolPriceChart chainId={chainId} poolAddress={poolAddress} />

      <LiquidityFlowsChart chainId={chainId} poolAddress={poolAddress} />
    </Stack>
  )
}

export default AnalyticsTab

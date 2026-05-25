import { ReactComponent as BagIcon } from 'assets/svg/kyber/ic_bag.svg'
import { HStack, Stack } from 'components/Stack'
import { formatApr, formatUsd, getPoolLiquidityUsd } from 'pages/Earns/PoolDetail/Information/utils'
import AprHistoryChart from 'pages/Earns/PoolDetail/components/AprHistoryChart'
import TopMetricsStrip, { type TopMetricItem } from 'pages/Earns/PoolDetail/components/TopMetricsStrip'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { useTokenPrices } from 'state/tokenPrices/hooks'

const InformationTab = () => {
  const { chainId, pool, poolAddress } = usePoolDetailContext()

  const tokenPrices = useTokenPrices(
    pool.tokens.map(token => token.address),
    chainId,
  )

  const poolStats = pool.poolStats
  const rewardApr = (poolStats?.kemEGApr ?? 0) + (poolStats?.kemLMApr ?? 0) + (poolStats?.bonusApr ?? 0)
  const liquidityUsdValue = getPoolLiquidityUsd(pool, tokenPrices)

  const tvlValue = formatUsd(poolStats?.tvl)
  const volumeValue = formatUsd(poolStats?.volume24h)
  const feesValue = formatUsd(poolStats?.fees24h)
  const liquidityValue = formatUsd(liquidityUsdValue)

  const rewardsValue = (
    <HStack className="items-center gap-1">
      <span className="font-medium text-text">{formatApr(rewardApr)}</span>
      {rewardApr > 0 ? <BagIcon height={20} width={20} /> : null}
    </HStack>
  )

  const topMetrics: TopMetricItem[] = [
    { label: 'TVL', value: tvlValue },
    { label: '24h Volume', value: volumeValue },
    { label: '24h Fees', value: feesValue },
    { label: 'Rewards', value: rewardsValue },
    { label: 'Liquidity', value: liquidityValue },
  ]

  return (
    <Stack className="gap-5">
      <TopMetricsStrip items={topMetrics} split={true} />

      <AprHistoryChart chainId={chainId} poolAddress={poolAddress} />
    </Stack>
  )
}

export default InformationTab

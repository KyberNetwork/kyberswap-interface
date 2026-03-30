import { Text } from 'rebass'

import { ReactComponent as BagIcon } from 'assets/svg/kyber/ic_bag.svg'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { formatApr, formatUsd, getPoolLiquidityUsd } from 'pages/Earns/PoolDetail/Information/utils'
import AprHistoryChart from 'pages/Earns/PoolDetail/components/AprHistoryChart'
import TopMetricsStrip, { type TopMetricItem } from 'pages/Earns/PoolDetail/components/TopMetricsStrip'
import { type Pool } from 'pages/Earns/PoolDetail/types'
import { useTokenPrices } from 'state/tokenPrices/hooks'

type InformationTabProps = {
  pool: Pool
}

const getRewardApr = (pool: Pool) => {
  const directRewardApr = (pool.kemEGApr || 0) + (pool.kemLMApr || 0) + (pool.bonusApr || 0)
  if (directRewardApr) return directRewardApr

  return (pool.poolStats?.kemEGApr24h || 0) + (pool.poolStats?.kemLMApr24h || 0) + (pool.poolStats?.bonusApr || 0)
}

const InformationTab = ({ pool }: InformationTabProps) => {
  const theme = useTheme()

  const tokenPrices = useTokenPrices(
    pool.tokens.map(token => token.address),
    pool.chainId,
  )

  const poolStats = pool.poolStats
  const rewardApr = getRewardApr(pool)
  const liquidityUsdValue = getPoolLiquidityUsd(pool, tokenPrices)

  const tvlValue = formatUsd(pool.tvl ?? poolStats?.tvl ?? Number(pool.reserveUsd))
  const volumeValue = formatUsd(pool.volume ?? poolStats?.volume24h)
  const feesValue = formatUsd(pool.earnFee ?? poolStats?.fees24h)
  const liquidityValue = formatUsd(liquidityUsdValue)

  const rewardsValue = (
    <HStack align="center" gap={4}>
      <Text as="span" color={theme.text} fontWeight={500}>
        {pool.egUsd ? formatUsd(pool.egUsd) : formatApr(rewardApr)}
      </Text>
      {pool.programs?.length || rewardApr ? <BagIcon height={20} width={20} /> : null}
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
    <Stack gap={20}>
      <TopMetricsStrip items={topMetrics} />

      <AprHistoryChart />
    </Stack>
  )
}

export default InformationTab

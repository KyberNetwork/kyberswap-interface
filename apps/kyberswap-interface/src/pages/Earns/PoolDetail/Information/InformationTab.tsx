import { useMemo } from 'react'

import { ReactComponent as BagIcon } from 'assets/svg/earn/ic_bag.svg'
import { HStack, Stack } from 'components/Stack'
import { formatUsd } from 'pages/Earns/PoolDetail/Information/utils'
import AprHistoryChart from 'pages/Earns/PoolDetail/components/AprHistoryChart'
import TopMetricsStrip, { type TopMetricItem } from 'pages/Earns/PoolDetail/components/TopMetricsStrip'
import { getParsedRewardAmount } from 'pages/Earns/PoolDetail/components/utils'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { ProgramType } from 'pages/Earns/types/pool'
import { useTokenPrices } from 'state/tokenPrices/hooks'

const BLOCKS_PER_CYCLE = 2016
const DAY_SECONDS = 24 * 60 * 60

const InformationTab = () => {
  const { chainId, pool, poolAddress } = usePoolDetailContext()

  const poolStats = pool.poolStats
  const bonusApr = poolStats?.bonusApr ?? 0
  const currentApr = {
    totalApr: poolStats?.allApr24h,
    activeApr: poolStats?.activeApr ? poolStats.activeApr + bonusApr : undefined,
  }

  const kemRewardTokens = useMemo(() => {
    const cycleDuration = (pool.kemReward?.endTime || 0) - (pool.kemReward?.startTime || 0)

    return (pool.kemReward?.rewardCfg || []).map(reward => {
      const decimals = reward.tokenInfo?.decimals
      const amountPerBlock = decimals !== undefined ? getParsedRewardAmount(reward.amountReward, decimals) : 0
      const totalAmount = amountPerBlock * BLOCKS_PER_CYCLE
      const dailyTotalAmount = cycleDuration > 0 ? totalAmount * (DAY_SECONDS / cycleDuration) : 0

      return {
        address: reward.tokenInfo?.address || reward.tokenAddress,
        dailyTotalAmount,
      }
    })
  }, [pool.kemReward?.endTime, pool.kemReward?.rewardCfg, pool.kemReward?.startTime])

  const kemRewardTokenPrices = useTokenPrices(
    useMemo(() => kemRewardTokens.map(token => token.address), [kemRewardTokens]),
    chainId,
  )

  const egRewards = pool.egUsd || 0
  const lmRewards = kemRewardTokens.reduce((sum, token) => {
    const tokenPrice = kemRewardTokenPrices[token.address] || 0
    return sum + token.dailyTotalAmount * tokenPrice
  }, 0)
  const merklRewards = pool.merklOpportunity?.dailyRewards ?? 0
  const rewards24hUsd = egRewards + lmRewards + merklRewards

  const tvlValue = formatUsd(poolStats?.tvl)
  const volumeValue = formatUsd(poolStats?.volume24h)
  const feesValue = formatUsd(poolStats?.fees24h)

  const rewardsValue = (
    <HStack className="items-center gap-1">
      <span className="font-medium text-text">{formatUsd(rewards24hUsd)}</span>
      <BagIcon height={18} width={18} />
    </HStack>
  )

  const topMetrics: TopMetricItem[] = [
    { label: 'TVL', value: tvlValue },
    { label: '24h Volume', value: volumeValue },
    { label: '24h Fees', value: feesValue },
    ...(rewards24hUsd > 0 ? [{ label: '24h Rewards', value: rewardsValue }] : []),
  ]

  return (
    <Stack className="gap-5">
      <TopMetricsStrip items={topMetrics} split={true} />

      <AprHistoryChart
        chainId={chainId}
        currentApr={currentApr}
        poolAddress={poolAddress}
        programs={pool.programs as ProgramType[]}
      />
    </Stack>
  )
}

export default InformationTab

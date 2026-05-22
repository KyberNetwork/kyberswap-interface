import { useMemo } from 'react'

import InfoHelper from 'components/InfoHelper'
import { HStack, Stack } from 'components/Stack'
import { formatAprValue } from 'pages/Earns/PoolDetail/components/AprHistoryChart'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'

const PoolEarningApr = () => {
  const { pool } = usePoolDetailContext()

  const aprSummary = useMemo(() => {
    const totalApr = pool.poolStats?.allApr24h ?? 0
    const feeApr = pool.poolStats?.lpApr24h ?? 0
    const rewardApr = Math.max(totalApr - feeApr, 0)

    const bonusApr = pool.poolStats?.bonusApr ?? 0
    const activeApr = pool.poolStats?.activeApr !== undefined ? pool.poolStats.activeApr + bonusApr : undefined
    const activeFeeApr = pool.poolStats?.activeFeeApr ?? 0
    const activeRewardApr = activeApr !== undefined ? Math.max(activeApr - activeFeeApr, 0) : undefined

    return {
      totalApr,
      feeApr,
      rewardApr,
      activeApr,
      activeFeeApr,
      activeRewardApr,
    }
  }, [pool])

  const hasActiveApr = aprSummary?.activeApr !== undefined

  return (
    <HStack align="stretch" gap={12} wrap="wrap">
      <HStack align="center" gap={24} className="flex-1 basis-[320px]">
        <Stack align="center" gap={8} className="flex-[0_0_128px]">
          <HStack align="center" gap={4}>
            <span className="text-sm font-medium text-text">APR</span>
            <InfoHelper text="Earning Per Total TVL" size={14} placement="top" />
          </HStack>
          <Stack className="rounded-xl bg-primary-12 px-3 py-1">
            <span className="text-2xl font-semibold text-primary">{formatAprValue(aprSummary.totalApr)}</span>
          </Stack>
        </Stack>

        <div className="w-px self-stretch bg-text-08" />

        <Stack gap={8}>
          <HStack align="baseline" gap={8}>
            <span className="text-sm text-subText">Fee</span>
            <span className="font-medium text-text">{formatAprValue(aprSummary.feeApr)}</span>
          </HStack>
          <HStack align="baseline" gap={8}>
            <span className="text-sm text-subText">Rewards</span>
            <span className="font-medium text-text">{formatAprValue(aprSummary.rewardApr)}</span>
          </HStack>
        </Stack>
      </HStack>

      {hasActiveApr ? (
        <HStack align="center" gap={24} className="flex-1 basis-[320px]">
          <Stack align="center" gap={8} className="flex-[0_0_128px]">
            <HStack align="center" gap={4}>
              <span className="text-sm font-medium text-text">Active APR</span>
              <InfoHelper text="Earning Per Active TVL" size={14} placement="top" />
            </HStack>
            <Stack className="bg-blue/[0.12] rounded-xl px-3 py-1">
              <span className="text-2xl font-semibold text-blue">{formatAprValue(aprSummary.activeApr)}</span>
            </Stack>
          </Stack>

          <div className="w-px self-stretch bg-text-08" />

          <Stack gap={8}>
            <HStack align="baseline" gap={8}>
              <span className="text-sm text-subText">Fee</span>
              <span className="font-medium text-text">{formatAprValue(aprSummary.activeFeeApr)}</span>
            </HStack>
            <HStack align="baseline" gap={8}>
              <span className="text-sm text-subText">Rewards</span>
              <span className="font-medium text-text">{formatAprValue(aprSummary.activeRewardApr)}</span>
            </HStack>
          </Stack>
        </HStack>
      ) : null}
    </HStack>
  )
}

export default PoolEarningApr

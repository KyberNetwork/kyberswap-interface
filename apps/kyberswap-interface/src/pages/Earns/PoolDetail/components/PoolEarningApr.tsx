import { useMemo } from 'react'

import InfoHelper from 'components/InfoHelper'
import { HStack, Stack } from 'components/Stack'
import { formatAprValue } from 'pages/Earns/PoolDetail/components/AprHistoryChart'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import EgCalculatingMarker from 'pages/Earns/components/EgCalculatingMarker'
import { excludeEg, hasEgProgram, isEgCalculating } from 'pages/Earns/utils/egCalculating'

const PoolEarningApr = () => {
  const { chainId, pool } = usePoolDetailContext()
  // Every aggregate here drops the EG share while it is unavailable, so it stays a real figure.
  const egCalculating = isEgCalculating(chainId, hasEgProgram(pool.programs))

  const aprSummary = useMemo(() => {
    const rawTotalApr = pool.poolStats?.allApr24h ?? 0
    const totalApr = egCalculating ? excludeEg(rawTotalApr, pool.poolStats?.kemEGApr24h) : rawTotalApr
    const feeApr = pool.poolStats?.lpApr24h ?? 0
    const rewardApr = Math.max(totalApr - feeApr, 0)

    const bonusApr = pool.poolStats?.bonusApr ?? 0
    const rawActiveApr = pool.poolStats?.activeApr
    const activeApr =
      rawActiveApr !== undefined
        ? (egCalculating ? excludeEg(rawActiveApr, pool.poolStats?.activeEgApr) : rawActiveApr) + bonusApr
        : undefined
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
  }, [egCalculating, pool])

  const hasActiveApr = !!aprSummary.activeApr

  return (
    <HStack className="flex-wrap items-stretch gap-3">
      <HStack className="flex-1 basis-[320px] items-center gap-6">
        <Stack className="flex-[0_0_128px] items-center gap-2">
          <HStack className="items-center gap-1">
            <span className="text-sm font-medium text-text">APR</span>
            <InfoHelper text="Earning Per Total TVL" size={14} placement="top" />
          </HStack>
          <Stack className="rounded-xl bg-blue/[0.12] px-3 py-1">
            <span className="whitespace-nowrap text-2xl font-semibold text-blue">
              {formatAprValue(aprSummary.totalApr)}
              {egCalculating && <EgCalculatingMarker compact />}
            </span>
          </Stack>
        </Stack>

        <div className="w-px self-stretch bg-text-08" />

        <Stack className="gap-2">
          <HStack className="items-baseline gap-2">
            <span className="text-sm text-subText">Fee</span>
            <span className="font-medium text-text">{formatAprValue(aprSummary.feeApr)}</span>
          </HStack>
          <HStack className="items-baseline gap-2">
            <span className="text-sm text-subText">Rewards</span>
            <span className="whitespace-nowrap font-medium text-text">
              {formatAprValue(aprSummary.rewardApr)}
              {egCalculating && <EgCalculatingMarker compact />}
            </span>
          </HStack>
        </Stack>
      </HStack>

      {hasActiveApr ? (
        <HStack className="flex-1 basis-[320px] items-center gap-6">
          <Stack className="flex-[0_0_128px] items-center gap-2">
            <HStack className="items-center gap-1">
              <span className="text-sm font-medium text-text">Active APR</span>
              <InfoHelper text="Earning Per Active TVL" size={14} placement="top" />
            </HStack>
            <Stack className="rounded-xl bg-primary-12 px-3 py-1">
              <span className="whitespace-nowrap text-2xl font-semibold text-primary">
                {formatAprValue(aprSummary.activeApr)}
                {egCalculating && <EgCalculatingMarker compact />}
              </span>
            </Stack>
          </Stack>

          <div className="w-px self-stretch bg-text-08" />

          <Stack className="gap-2">
            <HStack className="items-baseline gap-2">
              <span className="text-sm text-subText">Fee</span>
              <span className="font-medium text-text">{formatAprValue(aprSummary.activeFeeApr)}</span>
            </HStack>
            <HStack className="items-baseline gap-2">
              <span className="text-sm text-subText">Rewards</span>
              <span className="whitespace-nowrap font-medium text-text">
                {formatAprValue(aprSummary.activeRewardApr)}
                {egCalculating && <EgCalculatingMarker compact />}
              </span>
            </HStack>
          </Stack>
        </HStack>
      ) : null}
    </HStack>
  )
}

export default PoolEarningApr

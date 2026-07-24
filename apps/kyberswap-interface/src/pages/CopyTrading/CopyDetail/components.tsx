import copyTradingApi from 'services/copyTrading'
import type { CopyRunSummary } from 'services/copyTrading/types'

import { Center, HStack, Stack } from 'components/Stack'
import { CopyPositionsTable, TradeHistoryTable } from 'pages/CopyTrading/CopyDetail/Tables'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { OWNER_ADDRESS, formatDate, formatUsd, percent, signedPercent, signedUsd } from 'pages/CopyTrading/helpers'

type CopyRunPanelProps = {
  run: CopyRunSummary
}

const getCopyRunStats = (run: CopyRunSummary): LeaderboardStat[] => {
  return [
    {
      label: 'Total Realised P&L',
      value: signedUsd(run.realizedPnlUsd),
      icon: copyTradingStatIconMap.money,
    },
    {
      label: 'APR Since Copy',
      value: signedPercent(run.myAprSinceCopyPct),
      icon: copyTradingStatIconMap.positionOpen,
    },
    {
      label: 'Agent Win Rate',
      value: percent(run.agentStats.winRatePct),
      icon: copyTradingStatIconMap.users,
    },
    {
      label: 'Fees Paid',
      value: formatUsd(run.feesPaidUsd),
      icon: copyTradingStatIconMap.volume,
    },
    {
      label: 'Est. Rebate Pending',
      value: `~${formatUsd(run.estimatedRebatePendingUsd)}`,
      icon: copyTradingStatIconMap.money,
    },
  ]
}

export const CopyRunStats = ({ run }: CopyRunPanelProps) => <Leaderboard items={getCopyRunStats(run)} size="sm" />

export const CopyTimeline = ({ run }: CopyRunPanelProps) => (
  <HStack className="items-center justify-between gap-5 rounded-xl bg-buttonBlack p-5 max-md:flex-col max-md:items-stretch">
    <HStack className="items-center gap-5">
      <Center className="h-14 rounded-xl bg-primary-12 px-6 text-lg font-medium text-primary">Started Copy</Center>
      <Stack>
        <span className="text-sm text-subText">{formatDate(run.startedAt)}</span>
        <span className="text-lg font-medium text-text">In: {formatUsd(run.capitalInUsd)}</span>
      </Stack>
    </HStack>
    <div className="h-0.5 min-w-16 flex-1 bg-gradient-to-r from-primary to-red max-md:hidden" />
    <HStack className="items-center justify-end gap-5 max-md:justify-start">
      <Stack className="items-end max-md:items-start">
        <span className="text-sm text-subText">{formatDate(run.stoppedAt)}</span>
        <span className="text-lg font-medium text-text">Out: {formatUsd(run.capitalOutUsd)}</span>
      </Stack>
      <Center className="h-14 rounded-xl bg-red-20 px-6 text-lg font-medium text-red">Stopped Copy</Center>
    </HStack>
  </HStack>
)

export const OpenPositionsPanel = ({ run }: CopyRunPanelProps) => {
  const { data: positions, isFetching } = copyTradingApi.useGetCopyRunPositionsQuery({
    ownerAddress: OWNER_ADDRESS,
    copyRunId: run.copyRunId,
    status: 'open',
  })

  return (
    <Stack className="overflow-hidden rounded-xl bg-buttonBlack-60">
      <HStack className="flex-wrap items-center justify-between gap-4 border-b border-tableHeader bg-background-60 px-6 py-4">
        <HStack className="items-center gap-2">
          <h2 className="text-base font-medium text-text">My Positions</h2>
          <Center className="size-5 rounded-full bg-primary-12 text-xs text-primary">{run.openPositionCount}</Center>
        </HStack>
        <HStack className="flex-wrap gap-5 text-sm">
          <span className="text-subText">Realised P&L</span>
          <span className="font-medium text-primary">{signedUsd(run.realizedPnlUsd)}</span>
          <span className="text-subText">APR Since Copy</span>
          <span className="font-medium text-primary">{signedPercent(run.myAprSinceCopyPct)}</span>
        </HStack>
      </HStack>
      <div className="overflow-x-auto">
        <CopyPositionsTable loading={isFetching} rows={positions?.data || []} />
      </div>
    </Stack>
  )
}

export const ClosedPositionsPanel = ({ run }: CopyRunPanelProps) => {
  const { data: closedPositions, isFetching } = copyTradingApi.useGetCopyRunPositionsQuery({
    ownerAddress: OWNER_ADDRESS,
    copyRunId: run.copyRunId,
    status: 'closed',
  })

  return (
    <Stack className="overflow-hidden rounded-xl bg-buttonBlack-60">
      <HStack className="items-center gap-2 border-b border-tableHeader bg-background-60 px-6 py-4">
        <h2 className="text-lg font-medium text-text">Full Closed Positions</h2>
        <Center className="h-6 rounded-full bg-subText-20 px-3 text-xs text-text">{run.closedTradeCount}</Center>
      </HStack>
      <div className="overflow-x-auto">
        <TradeHistoryTable loading={isFetching} rows={closedPositions?.data || []} />
      </div>
    </Stack>
  )
}

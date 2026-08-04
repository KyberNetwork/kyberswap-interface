import { useEffect } from 'react'
import copyTradingApi from 'services/copyTrading'
import type { CopyRunSummary, PositionSummary } from 'services/copyTrading/types'

import { Center, HStack, Stack } from 'components/Stack'
import { CopyPositionsTable, TradeHistoryTable } from 'pages/CopyTrading/CopyDetail/Tables'
import useInfiniteCursorQuery from 'pages/CopyTrading/components/InfiniteScroll/useInfiniteCursorQuery'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { ContentPanel } from 'pages/CopyTrading/components/common'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { formatCount, formatUsd, percent, signedPercent, signedUsd } from 'pages/CopyTrading/helpers'
import { formatDateTime } from 'utils/time'

const PAGE_SIZE = 10

type CopyRunPanelProps = {
  run: CopyRunSummary
}

type OpenPositionsPanelProps = CopyRunPanelProps & {
  onPositionsChange?: (positions: PositionSummary[]) => void
}

const getCopyRunStats = (run: CopyRunSummary): LeaderboardStat[] => {
  return [
    {
      label: 'Total Realised P&L',
      value: signedUsd(run.realizedPnlUsd),
      icon: copyTradingStatIconMap.money,
      status: run.metrics.realizedPnlUsd?.status,
    },
    {
      label: 'APR Since Copy',
      value: signedPercent(run.myAprSinceCopyPct),
      icon: copyTradingStatIconMap.positionOpen,
      status: run.metrics.myAprSinceCopy?.status,
    },
    {
      label: 'Agent Win Rate',
      value: percent(run.agentStats.winRatePct),
      icon: copyTradingStatIconMap.users,
      status: run.agentStats.metrics.winRatePct?.status,
    },
    {
      label: 'Fees Paid',
      value: formatUsd(run.flatFeesCapturedUsd),
      icon: copyTradingStatIconMap.volume,
      status: run.metrics.flatFeesCapturedUsd?.status,
    },
    {
      label: 'Est. Rebate Pending',
      value: `~${formatUsd(run.estimatedCashbackPendingUsd)}`,
      icon: copyTradingStatIconMap.money,
      status: run.metrics.estimatedCashbackPendingUsd?.status,
    },
  ]
}

export const CopyRunStats = ({ run }: CopyRunPanelProps) => <Leaderboard items={getCopyRunStats(run)} size="sm" />

export const CopyTimeline = ({ run }: CopyRunPanelProps) => (
  <HStack className="items-center justify-between gap-5 rounded-xl bg-buttonBlack p-6 max-md:flex-col max-md:items-stretch">
    <HStack className="items-center gap-5">
      <Center className="min-h-12 rounded-xl bg-primary-12 px-6 py-2 text-lg font-medium text-primary">
        Started Copy
      </Center>
      <Stack>
        <span className="text-sm text-subText">{formatDateTime(run.startedAt)}</span>
        <span className="text-lg font-medium text-text">In: {formatUsd(run.capitalInUsd)}</span>
      </Stack>
    </HStack>
    <div className="h-0.5 min-w-16 flex-1 bg-gradient-to-r from-primary to-red max-md:hidden" />
    <HStack className="items-center justify-end gap-5 max-md:justify-start">
      <Stack className="items-end max-md:items-start">
        <span className="text-right text-sm text-subText">{formatDateTime(run.stoppedAt)}</span>
        <span className="text-lg font-medium text-text">Out: {formatUsd(run.capitalOutUsd)}</span>
      </Stack>
      <Center className="min-h-12 rounded-xl bg-red-20 px-6 py-2 text-lg font-medium text-red">Stopped Copy</Center>
    </HStack>
  </HStack>
)

export const OpenPositionsPanel = ({ run, onPositionsChange }: OpenPositionsPanelProps) => {
  const { ownerAddress } = useCopyTradingContext()
  const [getCopyRunPositions] = copyTradingApi.useLazyGetCopyRunPositionsQuery()
  const {
    infiniteScroll,
    isFetching,
    items: positions,
  } = useInfiniteCursorQuery({
    enabled: !!ownerAddress,
    queryKey: ['copy-trading', 'copy-run-positions', ownerAddress, run.copyRunId, 'open'],
    queryFn: cursor =>
      getCopyRunPositions({
        ownerAddress: ownerAddress || '',
        copyRunId: run.copyRunId,
        status: 'open',
        cursor,
        limit: 100,
      }).unwrap(),
  })

  useEffect(() => {
    onPositionsChange?.(positions)
  }, [onPositionsChange, positions])

  return (
    <ContentPanel
      title="My Positions"
      titleAddon={
        <Center className="size-5 rounded-full bg-primary-12 text-xs text-primary">
          {formatCount(run.openPositionCount)}
        </Center>
      }
      headerAside={
        <HStack className="flex-wrap gap-5 text-sm">
          <span className="text-subText">Realised P&L</span>
          <span className="font-medium text-primary">{signedUsd(run.realizedPnlUsd)}</span>
          <span className="text-subText">APR Since Copy</span>
          <span className="font-medium text-primary">{signedPercent(run.myAprSinceCopyPct)}</span>
        </HStack>
      }
    >
      <CopyPositionsTable infiniteScroll={infiniteScroll} loading={isFetching && !positions.length} rows={positions} />
    </ContentPanel>
  )
}

export const ClosedPositionsPanel = ({ run }: CopyRunPanelProps) => {
  const { ownerAddress } = useCopyTradingContext()
  const [getCopyRunPositions] = copyTradingApi.useLazyGetCopyRunPositionsQuery()
  const {
    infiniteScroll,
    isFetching,
    items: closedPositions,
  } = useInfiniteCursorQuery({
    enabled: !!ownerAddress,
    queryKey: ['copy-trading', 'copy-run-positions', ownerAddress, run.copyRunId, 'closed'],
    queryFn: cursor =>
      getCopyRunPositions({
        ownerAddress: ownerAddress || '',
        copyRunId: run.copyRunId,
        status: 'closed',
        cursor,
        limit: PAGE_SIZE,
      }).unwrap(),
  })

  return (
    <ContentPanel
      title="Full Closed Positions"
      titleAddon={
        <Center className="size-5 rounded-full bg-subText-20 text-xs text-subText">
          {formatCount(run.closedPositionCount)}
        </Center>
      }
    >
      <TradeHistoryTable
        infiniteScroll={infiniteScroll}
        loading={isFetching && !closedPositions.length}
        rows={closedPositions}
      />
    </ContentPanel>
  )
}

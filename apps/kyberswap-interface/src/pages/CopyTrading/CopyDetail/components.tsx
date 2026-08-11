import { useEffect } from 'react'
import copyTradingApi from 'services/copyTrading'
import type { CopyRunSummary, PositionSummary } from 'services/copyTrading/types'

import { Center, HStack, Stack } from 'components/Stack'
import useTab from 'hooks/useTab'
import { ActionLogsTable, CopyPositionsTable, TradeHistoryTable } from 'pages/CopyTrading/CopyDetail/Tables'
import useInfiniteCursorQuery from 'pages/CopyTrading/components/InfiniteScroll/useInfiniteCursorQuery'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { formatCount, formatUsd, percent, signedPercent, signedUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'
import { formatDateTime } from 'utils/time'

const PAGE_SIZE = 10
const copyDetailTabs = ['open-positions', 'closed-positions', 'action-logs'] as const

type CopyDetailTab = (typeof copyDetailTabs)[number]

const copyDetailTabLabels: Record<CopyDetailTab, string> = {
  'open-positions': 'Open Positions',
  'closed-positions': 'Closed Positions',
  'action-logs': 'Action Logs',
}

type CopyRunPanelProps = {
  enabled?: boolean
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

const OpenPositionsPanel = ({ enabled = true, run, onPositionsChange }: OpenPositionsPanelProps) => {
  const { ownerAddress } = useCopyTradingContext()
  const [getCopyRunPositions] = copyTradingApi.useLazyGetCopyRunPositionsQuery()
  const {
    infiniteScroll,
    isFetching,
    items: positions,
  } = useInfiniteCursorQuery({
    enabled: !!ownerAddress && enabled,
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
    <CopyPositionsTable infiniteScroll={infiniteScroll} loading={isFetching && !positions.length} rows={positions} />
  )
}

const ClosedPositionsPanel = ({ enabled = true, run }: CopyRunPanelProps) => {
  const { ownerAddress } = useCopyTradingContext()
  const [getCopyRunPositions] = copyTradingApi.useLazyGetCopyRunPositionsQuery()
  const {
    infiniteScroll,
    isFetching,
    items: closedPositions,
  } = useInfiniteCursorQuery({
    enabled: !!ownerAddress && enabled,
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
    <TradeHistoryTable
      infiniteScroll={infiniteScroll}
      loading={isFetching && !closedPositions.length}
      rows={closedPositions}
    />
  )
}

const ActionLogsPanel = ({ enabled = true, run }: CopyRunPanelProps) => {
  const { ownerAddress } = useCopyTradingContext()
  const [getOwnerActivity] = copyTradingApi.useLazyGetOwnerActivityQuery()
  const {
    infiniteScroll,
    isFetching,
    items: activities,
  } = useInfiniteCursorQuery({
    enabled: !!ownerAddress && enabled,
    queryKey: ['copy-trading', 'owner-activity', ownerAddress, run.copyRunId],
    queryFn: cursor =>
      getOwnerActivity({
        ownerAddress: ownerAddress || '',
        copyRunId: run.copyRunId,
        cursor,
        limit: PAGE_SIZE,
      }).unwrap(),
  })

  return (
    <ActionLogsTable infiniteScroll={infiniteScroll} loading={isFetching && !activities.length} rows={activities} />
  )
}

type CopyDetailTabsProps = CopyRunPanelProps & {
  defaultTab?: CopyDetailTab
  onOpenPositionsChange?: (positions: PositionSummary[]) => void
}

export const CopyDetailTabs = ({ defaultTab = 'open-positions', onOpenPositionsChange, run }: CopyDetailTabsProps) => {
  const { activeTab, setActiveTab } = useTab<CopyDetailTab>({
    tabs: copyDetailTabs,
    defaultTab,
    queryKey: 'detailTab',
  })
  const currentTab = activeTab || defaultTab
  const keepOpenPositionsLoaded = run.status === 'active' || run.status === 'closing'

  return (
    <Stack className="overflow-hidden rounded-xl bg-buttonBlack-60">
      <HStack className="items-center gap-3 border-b border-darkBorder bg-background pr-4">
        <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto" role="tablist">
          {copyDetailTabs.map((tab, index) => {
            const active = currentTab === tab
            const isLast = index === copyDetailTabs.length - 1
            const count =
              tab === 'open-positions'
                ? run.openPositionCount
                : tab === 'closed-positions'
                ? run.closedPositionCount
                : undefined

            return (
              <button
                key={tab}
                aria-selected={active}
                className={cn(
                  'relative flex min-h-10 shrink-0 cursor-pointer items-center gap-2 border-0 px-4 py-2 text-sm font-medium',
                  !isLast && 'border-r border-darkBorder',
                  active
                    ? 'bg-primary-15 text-primary shadow-[inset_0_-2px_0_var(--ks-primary)] hover:bg-primary-20 hover:text-primary'
                    : 'bg-transparent text-subText hover:bg-tabActive-80 hover:text-text',
                )}
                onClick={() => setActiveTab(tab)}
                role="tab"
                type="button"
              >
                <span className="text-sm font-medium uppercase">{copyDetailTabLabels[tab]}</span>
                {count !== undefined && (
                  <Center
                    className={cn(
                      'h-5 min-w-5 rounded-full px-1.5 text-xs',
                      active ? 'bg-primary-20' : 'bg-subText-20',
                    )}
                  >
                    {formatCount(count)}
                  </Center>
                )}
              </button>
            )
          })}
        </div>
      </HStack>

      <div className="relative min-h-20" hidden={currentTab !== 'open-positions'} role="tabpanel">
        <OpenPositionsPanel
          enabled={currentTab === 'open-positions' || keepOpenPositionsLoaded}
          run={run}
          onPositionsChange={onOpenPositionsChange}
        />
      </div>
      <div className="relative min-h-20" hidden={currentTab !== 'closed-positions'} role="tabpanel">
        <ClosedPositionsPanel enabled={currentTab === 'closed-positions'} run={run} />
      </div>
      <div className="relative min-h-20" hidden={currentTab !== 'action-logs'} role="tabpanel">
        <ActionLogsPanel enabled={currentTab === 'action-logs'} run={run} />
      </div>
    </Stack>
  )
}

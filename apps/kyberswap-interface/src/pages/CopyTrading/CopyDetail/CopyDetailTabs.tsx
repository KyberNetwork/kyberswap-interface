import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'

import { Stack } from 'components/Stack'
import useTab from 'hooks/useTab'
import { ActionLogsTable } from 'pages/CopyTrading/CopyDetail/tables/ActionLogsTable'
import { CopyPositionsTable } from 'pages/CopyTrading/CopyDetail/tables/CopyPositionsTable'
import { TradeHistoryTable } from 'pages/CopyTrading/CopyDetail/tables/TradeHistoryTable'
import { useInfiniteCursorQuery } from 'pages/CopyTrading/components/InfiniteScroll'
import { DetailTabBar, type DetailTabOption } from 'pages/CopyTrading/components/common/DetailTabBar'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { formatCount } from 'pages/CopyTrading/helpers'

const PAGE_SIZE = 10

const copyDetailTabs = ['open-positions', 'leftover-positions', 'closed-positions', 'action-logs'] as const
const closedCopyDetailTabs = ['closed-positions', 'action-logs'] as const

type CopyDetailTab = (typeof copyDetailTabs)[number]

const copyDetailTabLabels: Record<CopyDetailTab, string> = {
  'open-positions': 'Open Positions',
  'leftover-positions': 'Leftover Positions',
  'closed-positions': 'Closed Positions',
  'action-logs': 'Action Logs',
}

const copyDetailTabShortLabels: Partial<Record<CopyDetailTab, string>> = {
  'leftover-positions': 'Leftovers',
  'closed-positions': 'History',
  'action-logs': 'Logs',
}

const getCopyDetailTabCount = (tab: CopyDetailTab, run: CopyRunSummary) => {
  if (tab === 'closed-positions') return run.closedPositionCount
  if (tab === 'leftover-positions') return run.leftoverPositionCount
  return tab === 'open-positions' ? run.openPositionCount : undefined
}

type CopyDetailTabsProps = {
  defaultTab?: CopyDetailTab
  includeOpenPositions?: boolean
  run: CopyRunSummary
}

type CopyRunPanelProps = {
  enabled?: boolean
  run: CopyRunSummary
}

const PositionsPanel = ({
  enabled = true,
  positionContext,
  run,
}: CopyRunPanelProps & { positionContext: 'active' | 'leftover' }) => {
  const { ownerAddress } = useCopyTradingContext()
  const [getCopyRunPositions] = copyRunApi.useLazyGetCopyRunPositionsQuery()
  const {
    infiniteScroll,
    isFetching,
    items: positions,
  } = useInfiniteCursorQuery({
    enabled: !!ownerAddress && enabled,
    queryKey: ['copy-trading', 'copy-run-positions', ownerAddress, run.copyRunId, positionContext],
    queryFn: cursor =>
      getCopyRunPositions({
        ownerAddress: ownerAddress || '',
        copyRunId: run.copyRunId,
        status: positionContext === 'leftover' ? 'leftover' : 'open',
        cursor,
        limit: 100,
      }).unwrap(),
  })

  return (
    <CopyPositionsTable
      infiniteScroll={infiniteScroll}
      loading={isFetching && !positions.length}
      positionContext={positionContext}
      rows={positions}
    />
  )
}

const ClosedPositionsPanel = ({ enabled = true, run }: CopyRunPanelProps) => {
  const { ownerAddress } = useCopyTradingContext()
  const [getCopyRunPositions] = copyRunApi.useLazyGetCopyRunPositionsQuery()
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
  const [getOwnerActivity] = copyRunApi.useLazyGetOwnerActivityQuery()
  const {
    infiniteScroll,
    isFetching,
    items: activities,
  } = useInfiniteCursorQuery({
    enabled: !!ownerAddress && enabled,
    queryKey: ['copy-trading', 'owner-activity', ownerAddress, run.copyRunId, 'copy_run_log'],
    queryFn: cursor =>
      getOwnerActivity({
        ownerAddress: ownerAddress || '',
        copyRunId: run.copyRunId,
        activitySurface: 'copy_run_log',
        cursor,
        limit: PAGE_SIZE,
      }).unwrap(),
  })

  return (
    <ActionLogsTable infiniteScroll={infiniteScroll} loading={isFetching && !activities.length} rows={activities} />
  )
}

export const CopyDetailTabs = ({
  defaultTab = 'open-positions',
  includeOpenPositions = true,
  run,
}: CopyDetailTabsProps) => {
  const showLeftoverPositions = includeOpenPositions && Number(run.leftoverPositionCount || 0) > 0
  const tabs = includeOpenPositions
    ? copyDetailTabs.filter(tab => tab !== 'leftover-positions' || showLeftoverPositions)
    : closedCopyDetailTabs
  const { activeTab, setActiveTab } = useTab<CopyDetailTab>({
    tabs,
    defaultTab,
    queryKey: 'detailTab',
  })

  const currentTab = activeTab || defaultTab
  const tabOptions: DetailTabOption<CopyDetailTab>[] = tabs.map(tab => {
    const count = getCopyDetailTabCount(tab, run)

    return {
      badge: count === undefined ? undefined : formatCount(count),
      label: copyDetailTabLabels[tab],
      shortLabel: copyDetailTabShortLabels[tab],
      value: tab,
    }
  })

  return (
    <Stack className="overflow-hidden rounded-xl bg-buttonBlack-60">
      <DetailTabBar activeTab={currentTab} onChange={setActiveTab} options={tabOptions} />

      {includeOpenPositions && (
        <div className="relative min-h-20" hidden={currentTab !== 'open-positions'} role="tabpanel">
          <PositionsPanel enabled={currentTab === 'open-positions'} positionContext="active" run={run} />
        </div>
      )}
      {showLeftoverPositions && (
        <div className="relative min-h-20" hidden={currentTab !== 'leftover-positions'} role="tabpanel">
          <PositionsPanel enabled={currentTab === 'leftover-positions'} positionContext="leftover" run={run} />
        </div>
      )}
      <div className="relative min-h-20" hidden={currentTab !== 'closed-positions'} role="tabpanel">
        <ClosedPositionsPanel enabled={currentTab === 'closed-positions'} run={run} />
      </div>
      <div className="relative min-h-20" hidden={currentTab !== 'action-logs'} role="tabpanel">
        <ActionLogsPanel enabled={currentTab === 'action-logs'} run={run} />
      </div>
    </Stack>
  )
}

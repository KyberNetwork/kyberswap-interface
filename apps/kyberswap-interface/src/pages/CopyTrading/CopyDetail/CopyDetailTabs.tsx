import { useState } from 'react'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'

import { Stack } from 'components/Stack'
import useTab from 'hooks/useTab'
import { ActionLogsTable, type ActivityLogTypeFilter } from 'pages/CopyTrading/CopyDetail/tables/ActionLogsTable'
import { CopyPositionsTable } from 'pages/CopyTrading/CopyDetail/tables/CopyPositionsTable'
import { TradeHistoryTable } from 'pages/CopyTrading/CopyDetail/tables/TradeHistoryTable'
import { useInfiniteCursorQuery } from 'pages/CopyTrading/components/InfiniteScroll'
import { DetailTabBar, type DetailTabOption } from 'pages/CopyTrading/components/common/DetailTabBar'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { formatCount } from 'pages/CopyTrading/helpers'

const PAGE_SIZE = 10

const copyDetailTabs = ['open-positions', 'closed-positions', 'action-logs'] as const
const closedCopyDetailTabs = ['closed-positions', 'action-logs'] as const

type CopyDetailTab = (typeof copyDetailTabs)[number]

const copyDetailTabLabels: Record<CopyDetailTab, string> = {
  'open-positions': 'Open Positions',
  'closed-positions': 'Closed Positions',
  'action-logs': 'Action Logs',
}

const copyDetailTabShortLabels: Partial<Record<CopyDetailTab, string>> = {
  'closed-positions': 'History',
  'action-logs': 'Logs',
}

const getCopyDetailTabCount = (tab: CopyDetailTab, run: CopyRunSummary) => {
  if (tab === 'closed-positions') return run.closedPositionCount
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

const OpenPositionsPanel = ({ enabled = true, run }: CopyRunPanelProps) => {
  const { ownerAddress } = useCopyTradingContext()
  const [getCopyRunPositions] = copyRunApi.useLazyGetCopyRunPositionsQuery()
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

  return (
    <CopyPositionsTable
      infiniteScroll={infiniteScroll}
      loading={isFetching && !positions.length}
      copyRunStatus={run.status}
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
  const [typeFilter, setTypeFilter] = useState<ActivityLogTypeFilter>('')
  const [getOwnerActivity] = copyRunApi.useLazyGetOwnerActivityQuery()
  const categoryFilter =
    typeFilter === 'capital' || typeFilter === 'failed_action' || typeFilter === 'fee_rebate' ? typeFilter : undefined
  const subtypeFilter = typeFilter === 'buy' || typeFilter === 'sell' ? typeFilter : undefined

  const {
    infiniteScroll,
    isFetching,
    items: activities,
  } = useInfiniteCursorQuery({
    enabled: !!ownerAddress && enabled,
    queryKey: ['copy-trading', 'owner-activity', ownerAddress, run.copyRunId, 'copy_run_log', typeFilter],
    queryFn: cursor =>
      getOwnerActivity({
        ownerAddress: ownerAddress || '',
        copyRunId: run.copyRunId,
        activitySurface: 'copy_run_log',
        category: categoryFilter,
        subtype: subtypeFilter,
        cursor,
        limit: PAGE_SIZE,
      }).unwrap(),
  })

  return (
    <ActionLogsTable
      infiniteScroll={infiniteScroll}
      loading={isFetching && !activities.length}
      onTypeFilterChange={setTypeFilter}
      rows={activities}
      typeFilter={typeFilter}
    />
  )
}

export const CopyDetailTabs = ({
  defaultTab = 'open-positions',
  includeOpenPositions = true,
  run,
}: CopyDetailTabsProps) => {
  const tabs = includeOpenPositions ? copyDetailTabs : closedCopyDetailTabs
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
          <OpenPositionsPanel enabled={currentTab === 'open-positions'} run={run} />
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

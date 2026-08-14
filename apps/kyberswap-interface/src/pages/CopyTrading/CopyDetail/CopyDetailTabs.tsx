import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'

import { Center, HStack, Stack } from 'components/Stack'
import useTab from 'hooks/useTab'
import { ActionLogsTable } from 'pages/CopyTrading/CopyDetail/tables/ActionLogsTable'
import { CopyPositionsTable } from 'pages/CopyTrading/CopyDetail/tables/CopyPositionsTable'
import { TradeHistoryTable } from 'pages/CopyTrading/CopyDetail/tables/TradeHistoryTable'
import { useInfiniteCursorQuery } from 'pages/CopyTrading/components/InfiniteScroll'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { formatCount } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

const PAGE_SIZE = 10

const copyDetailTabs = ['open-positions', 'closed-positions', 'action-logs'] as const
const closedCopyDetailTabs = ['closed-positions', 'action-logs'] as const

type CopyDetailTab = (typeof copyDetailTabs)[number]

const copyDetailTabLabels: Record<CopyDetailTab, string> = {
  'open-positions': 'Open Positions',
  'closed-positions': 'Closed Positions',
  'action-logs': 'Action Logs',
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
    <CopyPositionsTable infiniteScroll={infiniteScroll} loading={isFetching && !positions.length} rows={positions} />
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
  const keepOpenPositionsLoaded = includeOpenPositions && (run.status === 'active' || run.status === 'closing')

  return (
    <Stack className="overflow-hidden rounded-xl bg-buttonBlack-60">
      <HStack className="items-center gap-3 border-b border-darkBorder bg-background pr-4">
        <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto" role="tablist">
          {tabs.map((tab, index) => {
            const active = currentTab === tab
            const isLast = index === tabs.length - 1
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

      {includeOpenPositions && (
        <div className="relative min-h-20" hidden={currentTab !== 'open-positions'} role="tabpanel">
          <OpenPositionsPanel enabled={currentTab === 'open-positions' || keepOpenPositionsLoaded} run={run} />
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

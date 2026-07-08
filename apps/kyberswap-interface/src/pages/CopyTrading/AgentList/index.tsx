import { useEffect, useMemo, useState } from 'react'
import { Search } from 'react-feather'
import copyTradingApi from 'services/copyTrading'
import type { LeaderboardSortBy, SortOrder, StrategyKey } from 'services/copyTrading/types'

import { ButtonEmpty } from 'components/Button'
import Pagination from 'components/Pagination'
import { HStack, Stack } from 'components/Stack'
import useTab from 'hooks/useTab'
import AgentTable from 'pages/CopyTrading/AgentList/AgentTable'
import LeaderboardSummary from 'pages/CopyTrading/AgentList/LeaderboardSummary'
import { CopyTradingPage } from 'pages/CopyTrading/components/common'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { cn } from 'utils/cn'

const strategyOptions = [
  { label: 'All Strategies', value: 'all' },
  { label: 'Focused', value: 'focused' },
  { label: 'Diversified', value: 'diversified' },
  { label: 'Active', value: 'active' },
] as const

type StrategyFilter = (typeof strategyOptions)[number]['value']

const strategyTabs = strategyOptions.map(option => option.value)

const PAGE_SIZE = 5

const toStrategyKey = (strategy: StrategyFilter): StrategyKey | undefined =>
  strategy === 'all' ? undefined : (strategy as StrategyKey)

const StrategyFilterControl = ({
  activeStrategy,
  onChange,
}: {
  activeStrategy: StrategyFilter
  onChange: (strategy: StrategyFilter) => void
}) => {
  const activeIndex = strategyOptions.findIndex(option => option.value === activeStrategy)
  const optionCount = strategyOptions.length

  return (
    <Stack className="max-w-full overflow-x-auto">
      <div
        className="relative grid min-w-[420px] gap-1 rounded-xl bg-buttonBlack p-1"
        role="tablist"
        style={{ gridTemplateColumns: `repeat(${optionCount}, minmax(0, 1fr))` }}
      >
        <div
          className="pointer-events-none absolute inset-y-1 left-1 rounded-lg bg-primary-20 [transition:transform_200ms_ease,background_200ms_ease]"
          style={{
            width: `calc((100% - 8px - ${4 * (optionCount - 1)}px) / ${optionCount})`,
            transform: `translateX(calc((100% + 4px) * ${Math.max(activeIndex, 0)}))`,
          }}
        />
        {strategyOptions.map(option => {
          const active = activeStrategy === option.value

          return (
            <ButtonEmpty
              key={option.value}
              aria-selected={active}
              className={cn('relative z-[1] rounded-lg', active ? 'text-primary' : 'text-subText hover:bg-primary-10')}
              onClick={() => onChange(option.value)}
              padding="8px 12px"
              role="tab"
              type="button"
            >
              {option.label}
            </ButtonEmpty>
          )
        })}
      </div>
    </Stack>
  )
}

const AgentListView = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<LeaderboardSortBy>()
  const [sortOrder, setSortOrder] = useState<SortOrder>()
  const { selectedChainId } = useCopyTradingContext()
  const { activeTab, setActiveTab } = useTab<StrategyFilter>({
    tabs: strategyTabs,
    defaultTab: 'all',
    queryKey: 'strategy',
  })

  const selectedStrategy = toStrategyKey(activeTab || 'all')
  const normalizedSearch = search.trim() || undefined
  const summaryQuery = useMemo(
    () => ({
      chainId: selectedChainId,
      strategy: selectedStrategy,
      search: normalizedSearch,
    }),
    [normalizedSearch, selectedChainId, selectedStrategy],
  )
  const leaderboardQuery = useMemo(
    () => ({
      ...summaryQuery,
      sortBy,
      sortOrder,
      page,
      pageSize: PAGE_SIZE,
    }),
    [page, sortBy, sortOrder, summaryQuery],
  )

  const { data: leaderboardSummary } = copyTradingApi.useGetLeaderboardSummaryQuery(summaryQuery)
  const { data: leaderboard } = copyTradingApi.useGetLeaderboardQuery(leaderboardQuery)

  useEffect(() => {
    setPage(1)
  }, [selectedChainId])

  const handleStrategyChange = (strategy: StrategyFilter) => {
    setActiveTab(strategy)
    setPage(1)
  }

  const handleSortChange = (nextSortBy: LeaderboardSortBy) => {
    setPage(1)
    if (sortBy !== nextSortBy) {
      setSortBy(nextSortBy)
      setSortOrder('desc')
      return
    }
    if (sortOrder === 'desc') {
      setSortOrder('asc')
      return
    }
    setSortBy(undefined)
    setSortOrder(undefined)
  }

  return (
    <CopyTradingPage>
      <Stack className="gap-3.5">
        <h1 className="text-4xl font-medium text-text max-md:text-3xl">
          Agent <span className="text-primary">Leaderboard</span>
        </h1>
        <p className="text-lg text-subText">
          Automatically delegate to top on-chain AI agents. Maintain full custody of your assets. Pay fees only on
          realized profits.
        </p>
      </Stack>

      <Stack className="gap-7">
        <LeaderboardSummary
          summary={leaderboardSummary?.data}
          fallbackAgentCount={leaderboard?.pagination.totalCount}
        />

        <HStack className="flex-wrap items-center justify-between gap-4">
          <StrategyFilterControl activeStrategy={activeTab || 'all'} onChange={handleStrategyChange} />

          <HStack className="h-11 w-full max-w-md items-center gap-3 rounded-xl bg-buttonBlack px-4">
            <input
              value={search}
              onChange={event => {
                setSearch(event.target.value)
                setPage(1)
              }}
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-text outline-none placeholder:text-subText"
              placeholder="Search agent, address, or strategy ..."
            />
            <Search size={18} className="shrink-0 text-subText" />
          </HStack>
        </HStack>
      </Stack>

      <Stack className="overflow-hidden rounded-2xl bg-background/80">
        <AgentTable
          agents={leaderboard?.data || []}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />
        <Pagination
          onPageChange={setPage}
          totalCount={leaderboard?.pagination.totalCount || 0}
          currentPage={leaderboard?.pagination.page || page}
          pageSize={leaderboard?.pagination.pageSize || PAGE_SIZE}
        />
      </Stack>
    </CopyTradingPage>
  )
}

export default AgentListView

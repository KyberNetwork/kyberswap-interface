import { useMemo, useState } from 'react'
import copyTradingApi from 'services/copyTrading'
import type { LeaderboardSortBy, SortOrder } from 'services/copyTrading/types'

import { HStack, Stack } from 'components/Stack'
import useDebounce from 'hooks/useDebounce'
import useTab from 'hooks/useTab'
import AgentTable from 'pages/CopyTrading/AgentList/AgentTable'
import {
  LeaderboardSummary,
  SearchInput,
  type StrategyFilter,
  StrategyFilterControl,
  strategyTabs,
  toStrategyKey,
} from 'pages/CopyTrading/AgentList/components'
import useCursorPageQuery from 'pages/CopyTrading/components/CursorPagination/useCursorPageQuery'
import { CopyTradingPage, CopyTradingPageHeading } from 'pages/CopyTrading/components/common'
import { useCopyTradingContext } from 'pages/CopyTrading/context'

const PAGE_SIZE = 5

const AgentList = () => {
  const { selectedChainId } = useCopyTradingContext()

  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<LeaderboardSortBy>()
  const [sortOrder, setSortOrder] = useState<SortOrder>()

  const { activeTab, setActiveTab } = useTab<StrategyFilter>({
    tabs: strategyTabs,
    defaultTab: 'all',
    queryKey: 'strategy',
  })

  const debouncedSearch = useDebounce(search, 300)

  const selectedStrategy = toStrategyKey(activeTab || 'all')
  const normalizedSearch = debouncedSearch.trim() || undefined

  const summaryQuery = useMemo(
    () => ({
      chainId: selectedChainId,
      strategy: selectedStrategy,
      search: normalizedSearch,
    }),
    [normalizedSearch, selectedChainId, selectedStrategy],
  )

  const { data: leaderboardSummary } = copyTradingApi.useGetLeaderboardSummaryQuery(summaryQuery)
  const [getLeaderboard] = copyTradingApi.useLazyGetLeaderboardQuery()
  const leaderboardPage = useCursorPageQuery({
    queryKey: ['copy-trading', 'leaderboard', selectedChainId, selectedStrategy, normalizedSearch, sortBy, sortOrder],
    queryFn: cursor =>
      getLeaderboard({
        ...summaryQuery,
        sortBy,
        sortOrder,
        cursor,
        limit: PAGE_SIZE,
      }).unwrap(),
  })

  const agents = leaderboardPage.items

  const handleStrategyChange = (strategy: StrategyFilter) => {
    setActiveTab(strategy)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handleSortChange = (nextSortBy: LeaderboardSortBy) => {
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
      <CopyTradingPageHeading
        title={
          <>
            Agent <span className="text-primary">Leaderboard</span>
          </>
        }
        description="Automatically delegate to top on-chain AI agents. Maintain full custody of your assets with transparent fees and cashback."
      />

      <LeaderboardSummary summary={leaderboardSummary?.data} fallbackAgentCount={agents.length} />

      <Stack className="gap-4">
        <HStack className="flex-wrap items-center justify-between gap-4">
          <StrategyFilterControl activeStrategy={activeTab || 'all'} onChange={handleStrategyChange} />
          <SearchInput value={search} onChange={handleSearchChange} />
        </HStack>

        <AgentTable
          agents={agents}
          loading={leaderboardPage.loading}
          pagination={leaderboardPage}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />
      </Stack>
    </CopyTradingPage>
  )
}

export default AgentList

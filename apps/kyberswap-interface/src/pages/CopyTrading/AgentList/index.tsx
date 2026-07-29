import { useEffect, useMemo, useState } from 'react'
import copyTradingApi from 'services/copyTrading'
import type { LeaderboardSortBy, SortOrder } from 'services/copyTrading/types'

import { HStack, Stack } from 'components/Stack'
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
import { CopyTradingPage, CopyTradingPageHeading } from 'pages/CopyTrading/components/common'
import { useCopyTradingContext } from 'pages/CopyTrading/context'

const PAGE_SIZE = 5

const AgentList = () => {
  const { selectedChainId } = useCopyTradingContext()

  const [page, setPage] = useState(1)
  const [pageCursors, setPageCursors] = useState<(string | undefined)[]>([undefined])
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<LeaderboardSortBy>()
  const [sortOrder, setSortOrder] = useState<SortOrder>()

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
      cursor: pageCursors[page - 1],
      limit: PAGE_SIZE,
    }),
    [page, pageCursors, sortBy, sortOrder, summaryQuery],
  )

  const { data: leaderboardSummary } = copyTradingApi.useGetLeaderboardSummaryQuery(summaryQuery)
  const { data: leaderboard, isFetching: isLeaderboardFetching } =
    copyTradingApi.useGetLeaderboardQuery(leaderboardQuery)

  const handleStrategyChange = (strategy: StrategyFilter) => {
    setPage(1)
    setPageCursors([undefined])
    setActiveTab(strategy)
  }

  const handleSearchChange = (value: string) => {
    setPage(1)
    setPageCursors([undefined])
    setSearch(value)
  }

  const handleSortChange = (nextSortBy: LeaderboardSortBy) => {
    setPage(1)
    setPageCursors([undefined])

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

  useEffect(() => {
    setPage(1)
    setPageCursors([undefined])
  }, [selectedChainId])

  const handlePageChange = (nextPage: number) => {
    if (nextPage > page && leaderboard?.pagination.nextCursor) {
      setPageCursors(current => {
        const next = [...current]
        next[nextPage - 1] = leaderboard.pagination.nextCursor
        return next
      })
    }
    setPage(nextPage)
  }

  const loadedCount = (page - 1) * PAGE_SIZE + (leaderboard?.data.length || 0)
  const totalCount = loadedCount + (leaderboard?.pagination.hasMore ? 1 : 0)

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

      <LeaderboardSummary summary={leaderboardSummary?.data} fallbackAgentCount={leaderboard?.data.length} />

      <Stack className="gap-4">
        <HStack className="flex-wrap items-center justify-between gap-4">
          <StrategyFilterControl activeStrategy={activeTab || 'all'} onChange={handleStrategyChange} />
          <SearchInput value={search} onChange={handleSearchChange} />
        </HStack>

        <AgentTable
          agents={leaderboard?.data || []}
          loading={isLeaderboardFetching}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          pagination={{
            totalCount,
            currentPage: page,
            pageSize: PAGE_SIZE,
            onPageChange: handlePageChange,
          }}
        />
      </Stack>
    </CopyTradingPage>
  )
}

export default AgentList

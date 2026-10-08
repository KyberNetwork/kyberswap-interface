import { useQuery } from '@tanstack/react-query'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import discoveryApi from 'services/copyTrading/api/endpoints/discovery'
import type { CursorResponse } from 'services/copyTrading/types/primitives'

const PAGE_SIZE = 100
const SIDEBAR_ITEM_LIMIT = 10
const REFRESH_INTERVAL = 10_000

const loadAllPages = async <T>(getPage: (cursor?: string) => Promise<CursorResponse<T>>): Promise<T[]> => {
  const items: T[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  while (true) {
    const page = await getPage(cursor)
    items.push(...page.data)
    if (!page.pagination.hasMore) return items

    const nextCursor = page.pagination.nextCursor
    if (!nextCursor || seenCursors.has(nextCursor)) {
      throw new Error('The sidebar response returned an invalid pagination cursor.')
    }
    seenCursors.add(nextCursor)
    cursor = nextCursor
  }
}

const useSidebarData = (ownerAddress?: string, chainId?: number) => {
  const [getLeaderboard] = discoveryApi.useLazyGetLeaderboardQuery()
  const [getCopyRuns] = copyRunApi.useLazyGetCopyRunsQuery()

  const allAgents = useQuery({
    queryKey: ['copy-trading', 'sidebar-fallback', 'agents'],
    queryFn: () => loadAllPages(cursor => getLeaderboard({ cursor, limit: PAGE_SIZE }).unwrap()),
    staleTime: REFRESH_INTERVAL,
    refetchInterval: REFRESH_INTERVAL,
    retry: false,
  })
  const allCopies = useQuery({
    queryKey: ['copy-trading', 'sidebar-fallback', 'open-copies', ownerAddress],
    enabled: !!ownerAddress,
    queryFn: () =>
      loadAllPages(cursor =>
        getCopyRuns({ ownerAddress: ownerAddress || '', view: 'open', cursor, limit: PAGE_SIZE }).unwrap(),
      ),
    staleTime: REFRESH_INTERVAL,
    refetchInterval: REFRESH_INTERVAL,
    retry: false,
  })

  const { currentData: leaderboard } = discoveryApi.useGetLeaderboardQuery(
    { chainId, limit: SIDEBAR_ITEM_LIMIT },
    { pollingInterval: REFRESH_INTERVAL },
  )
  const { currentData: openCopies, refetch: refetchOpenCopies } = copyRunApi.useGetCopyRunsQuery(
    { ownerAddress: ownerAddress || '', chainId, view: 'open', limit: SIDEBAR_ITEM_LIMIT },
    { pollingInterval: REFRESH_INTERVAL, skip: !ownerAddress },
  )
  const matchesChain = (item: { chainId: number }) => chainId === undefined || item.chainId === chainId

  return {
    agents: leaderboard?.data ?? (allAgents.data || []).filter(matchesChain).slice(0, SIDEBAR_ITEM_LIMIT),
    activeRuns: ownerAddress
      ? openCopies?.data ?? (allCopies.data || []).filter(matchesChain).slice(0, SIDEBAR_ITEM_LIMIT)
      : [],
    refetchOpenCopies,
  }
}

export default useSidebarData

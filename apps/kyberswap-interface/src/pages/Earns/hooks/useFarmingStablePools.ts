import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { usePoolsExplorerQuery } from 'services/earn'

import { PAIR_CATEGORY } from 'constants/trade'
import { FilterTag } from 'pages/Earns/PoolExplorer/Filter'
import { EarnPool } from 'pages/Earns/types'

/**
 * Hook to fetch farming stable pools for multiple chains
 * @returns Record<chainId, { pools: EarnPool[] }>
 */
const useFarmingStablePools = ({ chainIds }: { chainIds: ChainId[] }) => {
  // Sorted on a copy so callers keep their array intact, and joined into a primitive so the
  // grouping below stays memoized even when the caller passes a fresh array on every render.
  const chainIdsString = useMemo(() => [...chainIds].sort((a, b) => a - b).join(','), [chainIds])

  const { data } = usePoolsExplorerQuery(
    {
      chainIds: chainIdsString,
      protocol: '',
      interval: '7d',
      tag: FilterTag.FARMING_POOL,
      sortBy: 'apr',
      orderBy: 'DESC',
      page: 1,
      limit: 100,
    },
    {
      skip: !chainIdsString,
    },
  )

  const poolsByChain = useMemo(() => {
    const poolsData: Record<number, { pools: EarnPool[] }> = {}
    if (!chainIdsString) return poolsData

    // Seed every requested chain so callers can read `poolsData[chainId].pools` unconditionally.
    chainIdsString.split(',').forEach(chainId => {
      poolsData[Number(chainId)] = { pools: [] }
    })

    // Stable pools only — a single pass groups them into the seeded buckets.
    data?.data?.pools?.forEach((pool: EarnPool) => {
      if (pool.category !== PAIR_CATEGORY.STABLE || pool.chainId === undefined) return
      poolsData[pool.chainId]?.pools.push(pool)
    })

    return poolsData
  }, [data, chainIdsString])

  return poolsByChain
}

export default useFarmingStablePools

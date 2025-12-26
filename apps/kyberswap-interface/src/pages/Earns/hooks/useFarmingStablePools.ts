import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { usePoolsExplorerQuery } from 'services/zapEarn'

import { PAIR_CATEGORY } from 'constants/index'
import { FilterTag } from 'pages/Earns/PoolExplorer/Filter'
import { EarnPool } from 'pages/Earns/types'

/**
 * Hook to fetch farming stable pools for multiple chains
 * @returns Record<chainId, { pools: EarnPool[] }>
 */
const useFarmingStablePools = ({ chainIds }: { chainIds: ChainId[] }) => {
  const chainIdsString = useMemo(() => chainIds.sort().join(','), [chainIds])

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
      skip: chainIds.length === 0,
    },
  )

  const poolsByChain = useMemo(() => {
    const poolsData: Record<number, { pools: EarnPool[] }> = {}

    // Filter stable pools only
    const allPools = data?.data?.pools?.filter((pool: EarnPool) => pool.category === PAIR_CATEGORY.STABLE) || []

    // Group pools by chainId
    chainIds.forEach(chainId => {
      poolsData[chainId] = {
        pools: allPools.filter((pool: EarnPool) => pool.chainId === chainId),
      }
    })

    return poolsData
  }, [data, chainIds])

  return poolsByChain
}

export default useFarmingStablePools

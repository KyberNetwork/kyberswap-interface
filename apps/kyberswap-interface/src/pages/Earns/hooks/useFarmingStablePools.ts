import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo, useState } from 'react'

import { PAIR_CATEGORY } from 'constants/index'
import { FilterTag } from 'pages/Earns/PoolExplorer/index'
import { EarnPool } from 'pages/Earns/types'

const useFarmingStablePools = ({ chainIds }: { chainIds: ChainId[] }) => {
  const chainIdsString = useMemo(() => chainIds.sort().join(','), [chainIds])

  const [pools, setPools] = useState<Record<number, any>>({})

  useEffect(() => {
    const fetchPoolsForChains = async () => {
      if (chainIds.length === 0) return

      const poolsData: Record<number, any> = {}
      const baseUrl = import.meta.env.VITE_ZAP_EARN_URL

      for (const chainId of chainIds) {
        try {
          const params = new URLSearchParams({
            chainId: chainId.toString(),
            protocol: '',
            interval: '7d',
            tag: FilterTag.FARMING_POOL,
            sortBy: 'apr',
            orderBy: 'DESC',
            page: '1',
            limit: '100',
          })

          const response = await fetch(`${baseUrl}/v1/explorer/pools?${params.toString()}`)

          if (response.ok) {
            const data = await response.json()
            poolsData[chainId] = {
              chainId,
              fetched: true,
              pools: data?.data?.pools?.filter((pool: EarnPool) => pool.category === PAIR_CATEGORY.STABLE) || [],
            }
          } else {
            poolsData[chainId] = { chainId, fetched: false, pools: [], error: 'Failed to fetch' }
          }
        } catch (error) {
          console.error(`Error fetching pools for chain ${chainId}:`, error)
          poolsData[chainId] = { chainId, fetched: false, pools: [], error: error.message }
        }
      }

      setPools(poolsData)
    }

    fetchPoolsForChains()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainIdsString])

  return pools
}

export default useFarmingStablePools

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PoolQueryParams } from 'services/zapEarn'

import { useActiveWeb3React } from 'hooks'
import { SortBy } from 'pages/Earns/PoolExplorer'
import { FilterTag, timings } from 'pages/Earns/PoolExplorer/Filter'
import { Direction } from 'pages/MarketOverview/SortIcon'

export default function useFilter(setSearch?: (search: string) => void) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { account } = useActiveWeb3React()

  const filters: PoolQueryParams = useMemo(() => {
    return {
      chainIds: searchParams.get('chainIds') || '',
      page: +(searchParams.get('page') || 1),
      limit: 10,
      interval: searchParams.get('interval') || (timings[0].value as string),
      protocol: searchParams.get('protocol') || '',
      userAddress: account,
      tag: searchParams.get('tag') || '',
      sortBy: searchParams.get('sortBy') || '',
      orderBy: searchParams.get('orderBy') || '',
      q: searchParams.get('q')?.trim() || '',
    }
  }, [searchParams, account])

  const updateFilters = useCallback(
    (key: keyof PoolQueryParams, value: string) => {
      if (!value && key !== 'chainIds') {
        searchParams.delete(key)
      } else {
        searchParams.set(key, value)
        if (key === 'chainIds') searchParams.delete('protocol')
        if (key === 'tag') {
          searchParams.delete('sortBy')
          searchParams.delete('orderBy')
          setSearch?.('')
          if (value === FilterTag.LOW_VOLATILITY) {
            searchParams.set('sortBy', SortBy.APR)
            searchParams.set('orderBy', Direction.DESC)
          }
        }
      }
      if (key !== 'sortBy' && key !== 'orderBy' && key !== 'page') searchParams.delete('page')

      setSearchParams(searchParams)
    },
    [setSearchParams, searchParams, setSearch],
  )

  return {
    filters,
    updateFilters,
  }
}

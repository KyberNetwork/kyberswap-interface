import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { SmartExitFilter } from 'pages/Earns/types'

// import { Direction } from 'pages/MarketOverview/SortIcon'

// export enum SortBy {
//   VALUE = 'value',
//   APR = 'apr',
//   UNCLAIMED_FEE = 'unclaimed_fees',
//   UNCLAIMED_REWARDS = 'unclaimed_rewards',
// }

export default function useSmartExitFilter() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters: SmartExitFilter = useMemo(
    () => ({
      chainIds: searchParams.get('chainIds') || '',
      protocols: searchParams.get('protocols') || '',
      status: searchParams.get('status') || 'open',
      // q: searchParams.get('q') || '',
      // sortBy: searchParams.get('sortBy') || SortBy.VALUE,
      // orderBy: searchParams.get('orderBy') || Direction.DESC,
      page: +(searchParams.get('page') || 1),
    }),
    [searchParams],
  )

  const updateFilters = useCallback(
    (key: keyof SmartExitFilter, value: string | number) => {
      console.log(value, key)
      if (!value) searchParams.delete(key)
      else searchParams.set(key, value.toString())

      // if ((key !== 'sortBy' && key !== 'orderBy' && key !== 'page') || (key === 'page' && value === 1))
      //   searchParams.delete('page')

      // const orderBy = searchParams.get('orderBy')
      // const sortBy = searchParams.get('sortBy')
      // if (orderBy === Direction.DESC && sortBy === SortBy.VALUE) {
      //   searchParams.delete('orderBy')
      //   searchParams.delete('sortBy')
      // }

      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams],
  )

  return { filters, updateFilters }
}

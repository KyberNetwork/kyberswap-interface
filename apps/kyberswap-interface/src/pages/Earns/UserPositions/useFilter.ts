import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { DEFAULT_POSITION_FILTERS, POSITIONS_PAGE_SIZE, SortBy } from 'pages/Earns/UserPositions/positionsQuery'
import { PositionFilter } from 'pages/Earns/types'
import { Direction } from 'pages/MarketOverview/SortIcon'

// SortBy now lives in positionsQuery (shared with the nav-intent prefetch); re-export for existing importers.
export { SortBy }

export default function useFilter() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters: PositionFilter = useMemo(
    () => ({
      chainIds: searchParams.get('chainIds') || DEFAULT_POSITION_FILTERS.chainIds,
      protocols: searchParams.get('protocols') || DEFAULT_POSITION_FILTERS.protocols,
      statuses: (searchParams.get('statuses') as string) || DEFAULT_POSITION_FILTERS.statuses,
      keyword: searchParams.get('keyword') || DEFAULT_POSITION_FILTERS.keyword,
      sortBy: searchParams.get('sortBy') || DEFAULT_POSITION_FILTERS.sortBy,
      orderBy: searchParams.get('orderBy') || DEFAULT_POSITION_FILTERS.orderBy,
      page: +(searchParams.get('page') || DEFAULT_POSITION_FILTERS.page),
      pageSize: +(searchParams.get('pageSize') || POSITIONS_PAGE_SIZE),
    }),
    [searchParams],
  )

  const updateFilters = useCallback(
    (key: keyof PositionFilter, value: string | number) => {
      if (!value) searchParams.delete(key)
      else searchParams.set(key, value.toString())

      if ((key !== 'sortBy' && key !== 'orderBy' && key !== 'page') || (key === 'page' && value === 1))
        searchParams.delete('page')

      const orderBy = searchParams.get('orderBy')
      const sortBy = searchParams.get('sortBy')
      if (orderBy === Direction.DESC && sortBy === SortBy.VALUE) {
        searchParams.delete('orderBy')
        searchParams.delete('sortBy')
      }

      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams],
  )

  return { filters, updateFilters }
}

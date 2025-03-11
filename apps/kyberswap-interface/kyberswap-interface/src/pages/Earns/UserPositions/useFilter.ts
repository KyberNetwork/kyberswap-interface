import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PositionQueryParams } from 'services/zapEarn'

import { useActiveWeb3React } from 'hooks'
import { Direction } from 'pages/MarketOverview/SortIcon'

export enum SortBy {
  VALUE = 'value',
  APR_7D = 'apr_7d',
  UNCLAIMED_FEE = 'unclaimed_fee',
}

export default function useFilter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { account } = useActiveWeb3React()

  const filters: PositionQueryParams = useMemo(
    () => ({
      addresses: account || '',
      chainIds: searchParams.get('chainIds') || '',
      protocols: searchParams.get('protocols') || '',
      status: searchParams.get('status') || '',
      q: searchParams.get('q') || '',
      sortBy: searchParams.get('sortBy') || SortBy.VALUE,
      orderBy: searchParams.get('orderBy') || Direction.DESC,
      page: +(searchParams.get('page') || 1),
    }),
    [searchParams, account],
  )

  const updateFilters = useCallback(
    (key: keyof PositionQueryParams, value: string | number) => {
      if (!value) searchParams.delete(key)
      else searchParams.set(key, value.toString())
      if (key !== 'sortBy' && key !== 'orderBy' && key !== 'page') searchParams.delete('page')

      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams],
  )

  useEffect(() => {
    updateFilters('page', 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  return { filters, updateFilters }
}

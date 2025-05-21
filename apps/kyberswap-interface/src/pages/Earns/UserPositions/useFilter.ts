import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useActiveWeb3React } from 'hooks'
import { PositionFilter, PositionStatus } from 'pages/Earns/types'
import { Direction } from 'pages/MarketOverview/SortIcon'

export enum SortBy {
  VALUE = 'value',
  APR = 'apr',
  UNCLAIMED_FEE = 'unclaimed_fees',
  UNCLAIMED_REWARDS = 'unclaimed_rewards',
}

export default function useFilter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { account } = useActiveWeb3React()

  const filters: PositionFilter = useMemo(
    () => ({
      chainIds: searchParams.get('chainIds') || '',
      protocols: searchParams.get('protocols') || '',
      status:
        (searchParams.get('status') as PositionStatus) || `${PositionStatus.IN_RANGE},${PositionStatus.OUT_RANGE}`,
      q: searchParams.get('q') || '',
      sortBy: searchParams.get('sortBy') || SortBy.VALUE,
      orderBy: searchParams.get('orderBy') || Direction.DESC,
      page: +(searchParams.get('page') || 1),
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

      if (key === 'status') {
        const arrValue = value.toString().split(',')
        if (
          arrValue.includes(PositionStatus.IN_RANGE) &&
          arrValue.includes(PositionStatus.OUT_RANGE) &&
          !arrValue.includes(PositionStatus.CLOSED)
        ) {
          searchParams.delete('status')
        } else if (arrValue.includes(PositionStatus.CLOSED)) {
          const index = arrValue.indexOf(PositionStatus.CLOSED)
          if (index === arrValue.length - 1) searchParams.set('status', PositionStatus.CLOSED)
          else {
            arrValue.splice(index, 1)
            searchParams.set('status', arrValue.join(','))
          }
        } else searchParams.set('status', value.toString())
      }

      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams],
  )

  useEffect(() => {
    const page = searchParams.get('page')
    if (page && page !== '1') updateFilters('page', 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  return { filters, updateFilters }
}

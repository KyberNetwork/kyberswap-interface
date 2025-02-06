import { useEffect, useState } from 'react'

import { useActiveWeb3React } from 'hooks'
import { Direction } from 'pages/MarketOverview/SortIcon'

export enum SortBy {
  VALUE = 'value',
  APR_7D = 'apr_7d',
  UNCLAIMED_FEE = 'unclaimed_fee',
}

export default function useFilter() {
  const { account } = useActiveWeb3React()
  const [filters, setFilters] = useState({
    addresses: '',
    chainIds: '',
    protocols: '',
    status: '',
    q: '',
    sortBy: SortBy.VALUE,
    orderBy: Direction.DESC,
  })

  const onFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  useEffect(() => {
    setFilters(prev => ({ ...prev, addresses: account || '' }))
  }, [account])

  return { filters, onFilterChange }
}

import { useEffect, useState } from 'react'

import { useActiveWeb3React } from 'hooks'

export default function useFilter() {
  const { account } = useActiveWeb3React()
  const [filters, setFilters] = useState({
    addresses: '',
    chainIds: '',
    protocols: '',
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

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { SmartExitFilter } from 'pages/Earns/types'

export default function useSmartExitFilter() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters: SmartExitFilter = useMemo(
    () => ({
      chainIds: searchParams.get('chainIds') || '',
      dexTypes: searchParams.get('dexTypes') || '',
      status: searchParams.get('status') || '',
      page: +(searchParams.get('page') || 1),
    }),
    [searchParams],
  )

  const updateFilters = useCallback(
    (key: keyof SmartExitFilter, value: string | number) => {
      const nextParams = new URLSearchParams(searchParams)
      if (!value) nextParams.delete(key)
      else nextParams.set(key, value.toString())
      if (key === 'chainIds' || key === 'dexTypes' || key === 'status') {
        nextParams.set('page', '1')
      }
      setSearchParams(nextParams)
    },
    [searchParams, setSearchParams],
  )

  return { filters, updateFilters }
}

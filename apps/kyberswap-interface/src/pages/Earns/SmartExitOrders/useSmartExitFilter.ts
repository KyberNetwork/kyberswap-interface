import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { SmartExitFilter } from 'pages/Earns/types'

export enum DexType {
  DexTypeUniswapV3 = 'DexTypeUniswapV3',
  DexTypeUniswapV4 = 'DexTypeUniswapV4',
  DexTypeUniswapV4FairFlow = 'DexTypeUniswapV4FairFlow',
  DexTypePancakeV3 = 'DexTypePancakeV3',
  DexTypePancakeInfinityCL = 'DexTypePancakeInfinityCL',
  DexTypePancakeInfinityCLFairFlow = 'DexTypePancakeInfinityCLFairFlow',
}

export default function useSmartExitFilter() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters: SmartExitFilter = useMemo(
    () => ({
      chainIds: searchParams.get('chainIds') || '',
      dexTypes: searchParams.get('dexTypes') || '',
      status: searchParams.get('status') || '',
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

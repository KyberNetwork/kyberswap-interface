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
      page: +(searchParams.get('page') || 1),
    }),
    [searchParams],
  )

  const updateFilters = useCallback(
    (key: keyof SmartExitFilter, value: string | number) => {
      console.log(value, key)
      if (!value) searchParams.delete(key)
      else searchParams.set(key, value.toString())
      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams],
  )

  return { filters, updateFilters }
}

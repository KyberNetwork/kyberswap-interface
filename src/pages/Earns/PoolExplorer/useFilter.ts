import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { QueryParams } from 'services/zapEarn'

import { useActiveWeb3React } from 'hooks'

import { timings } from '.'

export default function useFilter(setSearch?: (search: string) => void) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { account, chainId } = useActiveWeb3React()

  const filters: QueryParams = useMemo(() => {
    return {
      chainId: +(searchParams.get('chainId') || chainId || ChainId.MAINNET),
      page: +(searchParams.get('page') || 1),
      limit: 10,
      interval: searchParams.get('interval') || (timings[1].value as string),
      protocol: searchParams.get('protocol') || '',
      userAddress: account,
      tag: searchParams.get('tag') || '',
      sortBy: searchParams.get('sortBy') || '',
      orderBy: searchParams.get('orderBy') || '',
      q: searchParams.get('q')?.trim() || '',
    }
  }, [searchParams, account, chainId])

  const updateFilters = useCallback(
    (key: keyof QueryParams, value: string) => {
      if (!value) searchParams.delete(key)
      else {
        searchParams.set(key, value)
        if (key === 'chainId') searchParams.delete('protocol')
      }
      if (key !== 'sortBy' && key !== 'orderBy' && key !== 'page') {
        searchParams.delete('page')
        if (key !== 'q' && setSearch) setSearch('')
      }
      setSearchParams(searchParams)
    },
    [setSearchParams, searchParams, setSearch],
  )

  return {
    filters,
    updateFilters,
  }
}

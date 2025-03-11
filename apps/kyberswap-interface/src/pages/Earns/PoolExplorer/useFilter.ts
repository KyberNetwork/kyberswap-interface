import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PoolQueryParams, earnSupportedChains } from 'services/zapEarn'

import { useActiveWeb3React } from 'hooks'
import { Direction } from 'pages/MarketOverview/SortIcon'

import { FilterTag, SortBy, timings } from '.'

export default function useFilter(setSearch?: (search: string) => void) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { account, chainId } = useActiveWeb3React()
  const [defaultChainId] = useState(chainId && earnSupportedChains.includes(chainId) ? chainId : ChainId.MAINNET)

  const filters: PoolQueryParams = useMemo(() => {
    return {
      chainId: +(searchParams.get('chainId') || defaultChainId),
      page: +(searchParams.get('page') || 1),
      limit: 10,
      interval: searchParams.get('interval') || (timings[0].value as string),
      protocol: searchParams.get('protocol') || '',
      userAddress: account,
      tag: searchParams.get('tag') || '',
      sortBy: searchParams.get('sortBy') || (!searchParams.get('tag') ? SortBy.TVL : ''),
      orderBy: searchParams.get('orderBy') || (!searchParams.get('tag') ? Direction.DESC : ''),
      q: searchParams.get('q')?.trim() || '',
    }
  }, [searchParams, defaultChainId, account])

  const updateFilters = useCallback(
    (key: keyof PoolQueryParams, value: string) => {
      if (!value) {
        searchParams.delete(key)
        if (key === 'tag') {
          searchParams.set('sortBy', SortBy.TVL)
          searchParams.set('orderBy', Direction.DESC)
        }
      } else {
        searchParams.set(key, value)
        if (key === 'chainId') searchParams.delete('protocol')
        if (key === 'tag') {
          searchParams.delete('sortBy')
          searchParams.delete('orderBy')
          if (setSearch) setSearch('')
          if (value === FilterTag.LOW_VOLATILITY) {
            searchParams.set('sortBy', SortBy.APR)
            searchParams.set('orderBy', Direction.DESC)
          }
        }
      }
      if (key !== 'sortBy' && key !== 'orderBy' && key !== 'page') searchParams.delete('page')

      setSearchParams(searchParams)
    },
    [setSearchParams, searchParams, setSearch],
  )

  return {
    filters,
    updateFilters,
  }
}

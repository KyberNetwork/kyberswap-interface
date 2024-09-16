import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { QueryParams } from 'services/marketOverview'

import { useActiveWeb3React } from 'hooks'

export default function useFilter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { account } = useActiveWeb3React()

  const filters: QueryParams = useMemo(() => {
    const isFavorite = searchParams.get('isFavorite') === 'true'
    return {
      chainId: +(searchParams.get('chainId') || ChainId.MAINNET),
      search: searchParams.get('search') || '',
      user: account,
      isFavorite,
      tags: (searchParams.get('tags') || '').split(',').filter(Boolean),
      sort: searchParams.get('sort') || '',
      page: +(searchParams.get('page') || '1'),
      pageSize: +(searchParams.get('pageSize') || 20),
    }
  }, [searchParams, account])

  const updateFilters = useCallback(
    (key: keyof QueryParams, value: string) => {
      if (!value) searchParams.delete(key)
      else searchParams.set(key, value)
      if (key !== 'sort' && key !== 'page') searchParams.set('page', '1')
      setSearchParams(searchParams)
    },
    [setSearchParams, searchParams],
  )

  return {
    filters,
    updateFilters,
  }
}

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { QueryParams } from 'services/marketOverview'

import { useActiveWeb3React } from 'hooks'

export default function useFilter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { account, chainId } = useActiveWeb3React()

  const filters: QueryParams = useMemo(() => {
    const isFavorite = searchParams.get('isFavorite') === 'true'
    return {
      chainId: +(searchParams.get('chainId') || (chainId as number)),
      search: searchParams.get('search') || undefined,
      user: account,
      isFavorite,
      tags: searchParams.get('tags') || undefined,
      sort: searchParams.get('sort') || 'volume_24h desc',
      page: +(searchParams.get('page') || '1'),
      pageSize: +(searchParams.get('pageSize') || 10),
    }
  }, [searchParams, account, chainId])

  const updateFilters = useCallback(
    (key: keyof QueryParams, value: string) => {
      if (!value) searchParams.delete(key)
      else searchParams.set(key, value)
      setSearchParams(searchParams)
    },
    [setSearchParams, searchParams],
  )

  return {
    filters,
    updateFilters,
  }
}

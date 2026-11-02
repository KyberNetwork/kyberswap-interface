import { ChainId, Currency, WETH } from '@kyberswap/ks-sdk-core'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import { TokenSelectorNetwork, tokenRowKey } from 'components/TokenSelectorModal/types'
import { TOKEN_SEARCH_PAGE_SIZE, fetchAllNetworkTokenPage } from 'components/TokenSelectorModal/utils'
import { getTokenAddress, isTokenNative } from 'utils/tokenInfo'

export const useAllNetworksTokens = ({
  active,
  networks,
  query,
  filterWrap,
  otherSelectedCurrency,
}: {
  active: boolean
  networks: TokenSelectorNetwork[]
  query: string
  filterWrap: boolean
  otherSelectedCurrency?: Currency | null
}) => {
  const chainKey = networks
    .filter(n => typeof n.chainId === 'number')
    .map(n => n.chainId)
    .sort()
    .join(',')
  const chains = useMemo(() => chainKey.split(',').filter(Boolean).map(Number) as ChainId[], [chainKey])
  const allowedChains = useMemo(() => new Set(chains), [chains])
  const catalog = useInfiniteQuery({
    queryKey: ['token-selector-all-networks-ks-setting', query],
    enabled: active,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchAllNetworkTokenPage(query, pageParam),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.rawCount, 0)
      if (lastPage.rawCount < TOKEN_SEARCH_PAGE_SIZE || loaded >= (lastPage.totalItems ?? Infinity)) return undefined
      return pages.length + 1
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  })
  const currencies = useMemo(() => {
    const remote = (catalog.data?.pages ?? []).flatMap(page => page.tokens)
    const seen = new Set<string>()
    return remote.flatMap(token => {
      const key = tokenRowKey(token.chainId, getTokenAddress(token))
      if (seen.has(key) || !allowedChains.has(token.chainId)) return []
      seen.add(key)
      if (filterWrap && otherSelectedCurrency && token.chainId === otherSelectedCurrency.chainId) {
        const wrapped = WETH[token.chainId]
        if (wrapped && otherSelectedCurrency.equals(wrapped) && isTokenNative(token)) return []
        if (wrapped && isTokenNative(otherSelectedCurrency) && token.equals(wrapped)) return []
      }
      return [token]
    })
  }, [catalog.data, allowedChains, filterWrap, otherSelectedCurrency])

  const { hasNextPage, isFetching, isFetchNextPageError, fetchNextPage } = catalog
  const fetchMore = useCallback(async () => {
    if (hasNextPage && !isFetching && !isFetchNextPageError) await fetchNextPage()
  }, [hasNextPage, isFetching, isFetchNextPageError, fetchNextPage])
  const retry = () => {
    if (catalog.isFetchNextPageError) void catalog.fetchNextPage()
    else if (catalog.isError) void catalog.refetch()
  }
  return {
    currencies,
    loading: catalog.isLoading,
    hasMore: !!catalog.hasNextPage && !catalog.isFetchNextPageError,
    fetchMore,
    error: catalog.isError,
    retry,
  }
}

import { ChainId } from '@kyberswap/ks-sdk-core'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { fetchTokenCatalogTokens } from 'services/tokenCatalog'

import { NEW_TOKEN_MAX_DISPLAY } from 'components/TokenSelectorModal/constants'
import { catalogMetricsToExtra, mapCatalogTokens } from 'components/TokenSelectorModal/hooks/catalog'
import { TokenRowExtraMap, TokenSort } from 'components/TokenSelectorModal/types'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

/** Server-side `sort` param, or `undefined` to let the API apply its default (`whitelistedAt:desc`). */
const toSortParam = (sort: TokenSort | null): string | undefined => (sort ? `${sort.field}:${sort.dir}` : undefined)

/**
 * Recently whitelisted tokens for the selected chains from the public token-catalog `tag=new`
 * endpoint (newest-first by default). Sorting by 24h change / volume is resolved server-side via the
 * `sort` param — the API supports both columns — so consumers don't sort these in memory. Price /
 * 24h change / volume come from each token's `metrics`.
 */
export const useNewTokens = (
  chainIds: ChainId[],
  sort: TokenSort | null = null,
  active = true,
): { tokens: WrappedTokenInfo[]; extras: TokenRowExtraMap; loading: boolean } => {
  const chainIdsParam = chainIds.join(',')
  const sortParam = toSortParam(sort)

  const { data, isLoading } = useQuery({
    queryKey: ['token-selector-new-tokens', chainIdsParam, sortParam ?? 'default'],
    enabled: active && chainIds.length > 0,
    queryFn: () =>
      fetchTokenCatalogTokens({
        chainIds: chainIdsParam,
        tag: 'new',
        page: 1,
        pageSize: NEW_TOKEN_MAX_DISPLAY,
        sort: sortParam,
      }),
    // Changing the sort starts a new query; keep the current rows on screen while the new order loads
    // (same chain only) so the list re-sorts in place instead of flashing the skeleton.
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey?.[1] === chainIdsParam ? previousData : undefined,
    staleTime: 60_000,
    retry: false,
  })

  return useMemo(() => {
    const { tokens, extras } = mapCatalogTokens(data?.data?.tokens ?? [], raw => ({
      ...catalogMetricsToExtra(raw),
      addedAt: raw.whitelistedAt ?? raw.createdAt,
    }))
    return { tokens, extras, loading: isLoading }
  }, [data, isLoading])
}

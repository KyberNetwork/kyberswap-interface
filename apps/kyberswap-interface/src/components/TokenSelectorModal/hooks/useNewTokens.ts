import { ChainId } from '@kyberswap/ks-sdk-core'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { fetchTokenCatalogTokens } from 'services/tokenCatalog'

import { NEW_TOKEN_MAX_DISPLAY } from 'components/TokenSelectorModal/constants'
import { catalogMetricsToExtra, mapCatalogTokens } from 'components/TokenSelectorModal/hooks/catalog'
import { TokenRowExtraMap } from 'components/TokenSelectorModal/types'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

/**
 * Recently whitelisted tokens for the selected chains, newest-first. Sourced directly from the
 * public token-catalog list endpoint (ks-setting does not expose `createdAt`/sort). Price and 24h
 * change come from each token's `metrics`; consumers sort by 24h change client-side.
 */
export const useNewTokens = (
  chainIds: ChainId[],
  active = true,
): { tokens: WrappedTokenInfo[]; extras: TokenRowExtraMap; loading: boolean } => {
  const chainIdsParam = chainIds.join(',')

  const { data, isLoading } = useQuery({
    queryKey: ['token-selector-new-tokens', chainIdsParam],
    enabled: active && chainIds.length > 0,
    queryFn: () =>
      fetchTokenCatalogTokens({
        chainIds: chainIdsParam,
        isWhitelisted: true,
        page: 1,
        pageSize: NEW_TOKEN_MAX_DISPLAY,
        sort: 'createdAt:desc',
      }),
    staleTime: 60_000,
    retry: false,
  })

  return useMemo(() => {
    const { tokens, extras } = mapCatalogTokens(data?.data?.tokens ?? [], raw => ({
      ...catalogMetricsToExtra(raw),
      addedAt: raw.createdAt ?? raw.whitelistedAt,
    }))
    return { tokens, extras, loading: isLoading }
  }, [data, isLoading])
}

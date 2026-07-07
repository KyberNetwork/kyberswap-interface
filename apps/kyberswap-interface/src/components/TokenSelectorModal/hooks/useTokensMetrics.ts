import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { fetchTokenCatalogTokens } from 'services/tokenCatalog'

import { mapCatalogTokens } from 'components/TokenSelectorModal/hooks/catalog'
import { TokenRowExtraMap } from 'components/TokenSelectorModal/types'

// The token-api caps pageSize at 100, so requests are chunked at this size.
const CHUNK_SIZE = 100

/**
 * Fetch price / 24h-change / volume `metrics` for an arbitrary set of tokens (by address) on one
 * chain, keyed by `${chainId}-${address}`. Used by the Imported / Favorites tabs, whose tokens are
 * local (no catalog fetch of their own) but still show the price & 24h-change column.
 */
export const useTokensMetrics = (currencies: Currency[], chainId: ChainId): TokenRowExtraMap => {
  const addresses = useMemo(
    () => Array.from(new Set(currencies.map(currency => currency.wrapped.address.toLowerCase()))).sort(),
    [currencies],
  )
  const addressesParam = addresses.join(',')

  const { data } = useQuery({
    queryKey: ['token-selector-metrics', chainId, addressesParam],
    enabled: addresses.length > 0,
    queryFn: async () => {
      const chunks: string[][] = []
      for (let i = 0; i < addresses.length; i += CHUNK_SIZE) chunks.push(addresses.slice(i, i + CHUNK_SIZE))
      const responses = await Promise.all(
        chunks.map(chunk =>
          fetchTokenCatalogTokens({ chainIds: chainId, addresses: chunk.join(','), page: 1, pageSize: chunk.length }),
        ),
      )
      return responses.flatMap(res => res?.data?.tokens ?? [])
    },
    staleTime: 60_000,
    retry: false,
  })

  return useMemo(() => mapCatalogTokens(data ?? []).extras, [data])
}

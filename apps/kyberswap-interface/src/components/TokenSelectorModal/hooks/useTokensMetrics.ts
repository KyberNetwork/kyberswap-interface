import { ChainId, Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { fetchTokenCatalogTokens } from 'services/tokenCatalog'

import { mapCatalogTokens } from 'components/TokenSelectorModal/hooks/catalog'
import { TokenRowExtraMap, tokenRowKey } from 'components/TokenSelectorModal/types'
import { ETHER_ADDRESS } from 'constants/index'
import { isTokenNative } from 'utils/tokenInfo'

// The token-api caps pageSize at 100, so requests are chunked at this size.
const CHUNK_SIZE = 100

/**
 * Fetch price / 24h-change / volume `metrics` for an arbitrary set of tokens (by address) on one
 * chain, keyed by `${chainId}-${address}`. Used by the Imported / Favorites tabs, whose tokens are
 * local (no catalog fetch of their own) but still show the price & 24h-change column.
 *
 * A native token carries no price on its `0xEeee…` placeholder address (the catalog only returns a
 * 24h change there), so its metrics are fetched from — and aliased to — the wrapped (WETH) token,
 * which is where the real price lives.
 */
export const useTokensMetrics = (currencies: Currency[], chainId: ChainId): TokenRowExtraMap => {
  const wrappedNativeAddress = (WETH[chainId] as Token | undefined)?.address?.toLowerCase()

  const addresses = useMemo(
    () =>
      Array.from(
        new Set(
          currencies
            .map(currency => (isTokenNative(currency) ? wrappedNativeAddress : currency.wrapped.address.toLowerCase()))
            .filter((address): address is string => !!address),
        ),
      ).sort(),
    [currencies, wrappedNativeAddress],
  )
  const addressesParam = addresses.join(',')
  const hasNative = useMemo(() => currencies.some(isTokenNative), [currencies])

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

  return useMemo(() => {
    const extras = mapCatalogTokens(data ?? []).extras
    // Native rows look up their metrics by the `0xEeee…` placeholder key; point that at the wrapped
    // (WETH) token's metrics so a native token shows the same price / 24h change as its wrapped form.
    if (hasNative && wrappedNativeAddress) {
      const wrappedExtra = extras[tokenRowKey(chainId, wrappedNativeAddress)]
      if (wrappedExtra) extras[tokenRowKey(chainId, ETHER_ADDRESS)] = wrappedExtra
    }
    return extras
  }, [data, hasNative, wrappedNativeAddress, chainId])
}

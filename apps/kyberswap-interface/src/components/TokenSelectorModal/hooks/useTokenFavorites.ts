import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { fetchListTokenByAddresses, useAllTokens } from 'hooks/useTokens'
import { useFavoriteTokenActions } from 'state/user/favorites'
import { useRemoveUserAddedToken, useUserFavoriteTokens } from 'state/user/hooks'
import { getTokenAddress } from 'utils/tokenInfo'

export const splitFavoriteTokens = (addresses: string[], defaultTokens: ReturnType<typeof useAllTokens>) => {
  const known = new Map(Object.entries(defaultTokens).map(([address, token]) => [address.toLowerCase(), token]))
  return {
    available: addresses.flatMap(address => known.get(address.toLowerCase()) ?? []),
    missing: addresses.filter(address => !known.has(address.toLowerCase())),
  }
}

export const resolveFavoriteTokens = async (
  addresses: string[],
  defaultTokens: ReturnType<typeof useAllTokens>,
  chainId: ChainId,
): Promise<Currency[]> => {
  const { available, missing } = splitFavoriteTokens(addresses, defaultTokens)
  if (!missing.length) return available
  const resolved = await fetchListTokenByAddresses(missing, chainId)
  return available.concat(
    resolved.sort((a, b) => missing.indexOf(a.address.toLowerCase()) - missing.indexOf(b.address.toLowerCase())),
  )
}

/** Shared selector operations; the currency owns chain identity in both browsing modes. */
export const useTokenFavoriteActions = () => {
  const { toggleFavoriteToken, removeFavoriteToken } = useFavoriteTokenActions()
  const removeToken = useRemoveUserAddedToken()

  const handleClickFavorite = useCallback(
    (event: MouseEvent, currency: Currency) => {
      event.stopPropagation()
      toggleFavoriteToken({ chainId: currency.chainId, address: getTokenAddress(currency) })
    },
    [toggleFavoriteToken],
  )

  const removeImportedToken = useCallback(
    (token: Token) => {
      removeToken(token.chainId, token.address)
      removeFavoriteToken({ chainId: token.chainId, address: token.address })
    },
    [removeToken, removeFavoriteToken],
  )

  return { handleClickFavorite, removeImportedToken }
}

export const useTokenFavorites = (primaryChainId: ChainId, defaultTokens: ReturnType<typeof useAllTokens>) => {
  const { favoriteTokens } = useUserFavoriteTokens(primaryChainId)
  const [pinnedTokens, setPinnedTokens] = useState<Currency[]>([])
  const favoriteAddressSet = useMemo(() => new Set(favoriteTokens ?? []), [favoriteTokens])

  useEffect(() => {
    let cancelled = false
    if (Object.keys(defaultTokens).length) {
      void resolveFavoriteTokens(favoriteTokens ?? [], defaultTokens, primaryChainId)
        .then(tokens => {
          if (!cancelled) setPinnedTokens(tokens)
        })
        .catch(() => {
          // Preserve the existing single-chain behavior: keep the last result on lookup failure.
        })
    }
    // Each lookup belongs to this chain/membership/map; a replacement or unmount invalidates it.
    return () => {
      cancelled = true
    }
  }, [primaryChainId, favoriteTokens, defaultTokens])

  return { pinnedTokens, favoriteAddressSet }
}

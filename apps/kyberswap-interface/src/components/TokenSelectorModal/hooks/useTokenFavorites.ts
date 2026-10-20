import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ETHER_ADDRESS } from 'constants/index'
import { fetchListTokenByAddresses, useAllTokens } from 'hooks/useTokens'
import { useRemoveUserAddedToken, useUserFavoriteTokens } from 'state/user/hooks'
import { isTokenNative } from 'utils/tokenInfo'

export const useTokenFavorites = (primaryChainId: ChainId, defaultTokens: ReturnType<typeof useAllTokens>) => {
  const { favoriteTokens, toggleFavoriteToken } = useUserFavoriteTokens(primaryChainId)
  const removeToken = useRemoveUserAddedToken()
  const [pinnedTokens, setPinnedTokens] = useState<Currency[]>([])
  const favoriteAddressSet = useMemo(() => new Set(favoriteTokens ?? []), [favoriteTokens])

  const handleClickFavorite = useCallback(
    (event: MouseEvent, currency: Currency) => {
      event.stopPropagation()
      // The native currency is favorited under its sentinel address. Its wrapped address is a real,
      // different token: toggling that would add or remove the wrapped token's own pin.
      const address = isTokenNative(currency) ? ETHER_ADDRESS : currency.wrapped.address
      if (!address) return
      toggleFavoriteToken({ chainId: currency.chainId, address })
    },
    [toggleFavoriteToken],
  )

  // Tracks the current chain so an in-flight fetchPinnedTokens started before a chain switch can bail
  // out instead of overwriting pinnedTokens with the previous chain's (now filtered-out) tokens.
  const pinnedChainRef = useRef(primaryChainId)
  pinnedChainRef.current = primaryChainId
  // Monotonic id so two concurrent same-chain fetches (rapid star/unstar) can't let a slow one
  // overwrite the newest result — the chain guard alone can't distinguish them.
  const pinnedReqIdRef = useRef(0)

  const fetchPinnedTokens = useCallback(async () => {
    const requestedChainId = primaryChainId
    const reqId = ++pinnedReqIdRef.current
    try {
      if (!Object.keys(defaultTokens).length) return
      // Lowercased address → token, so each favorite is an O(1) lookup instead of scanning the whole map.
      const byAddress = new Map<string, Token | Currency>()
      Object.entries(defaultTokens).forEach(([address, token]) => byAddress.set(address.toLowerCase(), token))

      const result: (Token | Currency)[] = []
      const addressesToFetch: string[] = []
      favoriteTokens?.forEach(address => {
        const token = byAddress.get(address.toLowerCase())
        if (token) result.push(token)
        else addressesToFetch.push(address)
      })

      let resolved = result
      if (addressesToFetch.length) {
        const tokens = await fetchListTokenByAddresses(addressesToFetch, primaryChainId)
        // Sort the returned token list to match the order of the passed address list.
        resolved = result.concat(
          tokens.sort(
            (x, y) => addressesToFetch.indexOf(x.wrapped.address) - addressesToFetch.indexOf(y.wrapped.address),
          ),
        )
      }
      // Commit only if this is still the newest invocation and the chain hasn't changed.
      if (reqId !== pinnedReqIdRef.current || pinnedChainRef.current !== requestedChainId) return
      setPinnedTokens(resolved)
    } catch {
      // Pinned tokens are a convenience row; on failure keep the previous set rather than clearing it.
    }
  }, [primaryChainId, favoriteTokens, defaultTokens])

  const removeImportedToken = useCallback(
    (token: Token) => {
      removeToken(primaryChainId, token.address)
      if (favoriteTokens?.some(el => el.toLowerCase() === token.address.toLowerCase()))
        toggleFavoriteToken({
          chainId: primaryChainId,
          address: token.address,
        })
    },
    [primaryChainId, toggleFavoriteToken, removeToken, favoriteTokens],
  )

  useEffect(() => {
    void fetchPinnedTokens()
  }, [fetchPinnedTokens])

  return { pinnedTokens, favoriteAddressSet, handleClickFavorite, removeImportedToken }
}

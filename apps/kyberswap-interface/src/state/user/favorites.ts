import { useCallback } from 'react'
import { useStore } from 'react-redux'

import type { AppState } from 'state'
import { ToggleFavoriteTokenPayload, toggleFavoriteToken as setFavoriteToken } from 'state/user/actions'

const MAX_FAVORITE_LIMIT = 12

export const getFavoriteTokenAddresses = (overrides: Record<string, boolean> = {}, commonTokens: string[] = []) => [
  ...new Set(
    commonTokens
      .filter(address => overrides[address.toLowerCase()] !== false)
      .concat(Object.keys(overrides).filter(address => overrides[address]))
      .map(address => address.toLowerCase()),
  ),
]

/** Read membership on the token's chain at action time, including consecutive clicks before a render. */
export const useFavoriteTokenActions = () => {
  const store = useStore<AppState>()

  const updateFavorite = useCallback(
    (payload: ToggleFavoriteTokenPayload, remove: boolean) => {
      const state = store.getState()
      const favorites = getFavoriteTokenAddresses(
        state.user.favoriteTokensByChainIdv2?.[payload.chainId],
        state.application.config[payload.chainId]?.commonTokens,
      )
      const isFavorite = favorites.includes(payload.address.toLowerCase())
      if (remove ? !isFavorite : !isFavorite && favorites.length >= MAX_FAVORITE_LIMIT) return
      store.dispatch(setFavoriteToken({ ...payload, newValue: remove ? false : !isFavorite }))
    },
    [store],
  )

  const toggleFavoriteToken = useCallback(
    (payload: ToggleFavoriteTokenPayload) => updateFavorite(payload, false),
    [updateFavorite],
  )
  const removeFavoriteToken = useCallback(
    (payload: ToggleFavoriteTokenPayload) => updateFavorite(payload, true),
    [updateFavorite],
  )

  return { toggleFavoriteToken, removeFavoriteToken }
}

import { ChainId } from '@kyberswap/ks-sdk-core'

export enum TokenSelectorTab {
  All = 'all',
  Trending = 'trending',
  New = 'new',
  Imported = 'imported',
  Favorites = 'favorites',
}

export const TOKEN_SELECTOR_TAB_ORDER: TokenSelectorTab[] = [
  TokenSelectorTab.All,
  TokenSelectorTab.Trending,
  TokenSelectorTab.New,
  TokenSelectorTab.Imported,
  TokenSelectorTab.Favorites,
]

export const TRENDING_SUPPORTED_CHAINS: ChainId[] = [
  ChainId.MAINNET,
  ChainId.BASE,
  ChainId.BSCMAINNET,
  ChainId.HYPEREVM,
  ChainId.ARBITRUM,
  ChainId.OPTIMISM,
  ChainId.AVAXMAINNET,
  ChainId.MATIC,
  ChainId.MONAD,
]

export const isTrendingSupportedChain = (chainId: ChainId): boolean => TRENDING_SUPPORTED_CHAINS.includes(chainId)

/** Page size for the Trending list's infinite scroll (the token-api caps page size at 100). */
export const TRENDING_PAGE_SIZE = 20

/** Max rows fetched for the New list (whitelisted, newest-first). */
export const NEW_TOKEN_MAX_DISPLAY = 20

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
  ChainId.ROBINHOOD,
]

export const isTrendingSupportedChain = (chainId: ChainId): boolean => TRENDING_SUPPORTED_CHAINS.includes(chainId)

/**
 * Whether Trending rows the catalog returns without a `metrics.price` are topped up from the live
 * prices endpoint. While off, such a row's price column reads "--" and no extra request is made — a
 * catalog that prices its own trending rows makes the top-up redundant. The New tab tops up either way.
 */
export const TRENDING_PRICE_FALLBACK_ENABLED = false

/** Page size for the Trending list's infinite scroll (the token-api caps page size at 100). */
export const TRENDING_PAGE_SIZE = 20

/** Max rows fetched for the New list (whitelisted, newest-first). */
export const NEW_TOKEN_MAX_DISPLAY = 20

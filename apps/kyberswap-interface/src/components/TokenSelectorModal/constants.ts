import { ChainId } from '@kyberswap/ks-sdk-core'

import { ChainFeatureMap } from 'constants/chainFeature'

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

/** What a chain still needs before the Trending tab can rank its tokens. */
const NEEDS_KYBERSCORE = 'needs KyberScore rankings from token-catalog'

const TRENDING_BY_CHAIN: ChainFeatureMap = {
  [ChainId.MAINNET]: true,
  [ChainId.BASE]: true,
  [ChainId.BSCMAINNET]: true,
  [ChainId.HYPEREVM]: true,
  [ChainId.ARBITRUM]: true,
  [ChainId.OPTIMISM]: true,
  [ChainId.AVAXMAINNET]: true,
  [ChainId.MATIC]: true,
  [ChainId.MONAD]: true,
  [ChainId.ROBINHOOD]: true,
  [ChainId.ARC]: true,
  [ChainId.ELYSIUM]: true,
  [ChainId.GÖRLI]: 'testnet',
  [ChainId.FANTOM]: NEEDS_KYBERSCORE,
  [ChainId.ZKSYNC]: NEEDS_KYBERSCORE,
  [ChainId.LINEA]: NEEDS_KYBERSCORE,
  [ChainId.SCROLL]: NEEDS_KYBERSCORE,
  [ChainId.BLAST]: NEEDS_KYBERSCORE,
  [ChainId.MANTLE]: NEEDS_KYBERSCORE,
  [ChainId.SONIC]: NEEDS_KYBERSCORE,
  [ChainId.BERA]: NEEDS_KYBERSCORE,
  [ChainId.RONIN]: NEEDS_KYBERSCORE,
  [ChainId.UNICHAIN]: NEEDS_KYBERSCORE,
  [ChainId.PLASMA]: NEEDS_KYBERSCORE,
  [ChainId.ETHERLINK]: NEEDS_KYBERSCORE,
  [ChainId.MEGAETH]: NEEDS_KYBERSCORE,
  [ChainId.RISE]: NEEDS_KYBERSCORE,
  [ChainId.ABSTRACT]: NEEDS_KYBERSCORE,
}

export const isTrendingSupportedChain = (chainId: ChainId): boolean => TRENDING_BY_CHAIN[chainId] === true

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

/**
 * Widths of the list's right-hand column, shared by the header and the rows so the two stay aligned.
 * Below `sm` the metric column is the wider of the two, to fit the VOL / FDV switch in its header.
 */
export const METRIC_COLUMN_CLASS = 'w-[76px] sm:w-[128px]'
export const BALANCE_COLUMN_CLASS = 'w-[72px] sm:w-[104px]'

/**
 * Character budget a formatted balance has to fit in, sized for the narrower of the two column
 * widths above: 10 tabular-nums characters measure ~69px at `text-xs`, and 11 overflow the 72px
 * column. Keeping one budget for both breakpoints costs a few digits on wide screens and saves the
 * rows a viewport subscription each.
 */
export const BALANCE_MAX_LENGTH = 10

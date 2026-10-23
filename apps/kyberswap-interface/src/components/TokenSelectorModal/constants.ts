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
  ChainId.ARC,
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

// Virtualized row heights. A restricted row the user clicked grows to fit the "not available" notice.
export const ROW_CONTENT_HEIGHT = 12 * 4 // 48px
export const NORMAL_ITEM_SIZE = ROW_CONTENT_HEIGHT + 8 // 56px (content + row gap)
// Rows on either side of the viewport included in `onRowsRendered`, so a scroll lands on rows whose
// data was already asked for; the debounce turns a fling into one report.
export const ROWS_RENDERED_MARGIN = 40
export const ROWS_RENDERED_DEBOUNCE_MS = 150
export const RESTRICTED_CONTENT_HEIGHT = ROW_CONTENT_HEIGHT + 28 // 76px
export const RESTRICTED_ITEM_SIZE = RESTRICTED_CONTENT_HEIGHT + 8 // 84px

export const TOKEN_ROW_CLASS =
  'flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-1 sm:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[selected=true]:bg-primary-20'
export const TOKEN_ROW_HOVER_CLASS =
  '[@media(hover:hover)]:hover:bg-primary-15 [@media(hover:hover)]:data-[selected=true]:hover:bg-primary-25'

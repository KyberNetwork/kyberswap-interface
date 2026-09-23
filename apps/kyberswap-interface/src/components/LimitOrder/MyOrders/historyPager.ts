/**
 * Paging state for the order-history tabs, which walk the backend's keyset cursor instead of numbered
 * pages. The backend refuses a cursor past 1,000 rows (numbered paging is rejected there too), so the
 * walk is capped rather than left to discover the limit through a 400.
 */

/** Hard ceiling the backend puts on a history walk, cursor or numbered. */
export const MAX_HISTORY_ORDERS = 1000

export type HistoryPagerState = {
  /** 1-based page currently displayed. */
  page: number
  /**
   * Cursor that fetches page `index + 2`; page 1 is always cursor-less. An entry is `undefined` when
   * the backend reported more rows without handing out a cursor, and that page falls back to `page`.
   */
  cursors: (string | undefined)[]
}

export const INITIAL_HISTORY_PAGER_STATE: HistoryPagerState = { page: 1, cursors: [] }

/** Highest page a walk can reach without asking the backend for a row past its 1,000-row limit. */
export const getMaxHistoryPage = (pageSize: number): number =>
  Math.max(Math.floor(MAX_HISTORY_ORDERS / Math.max(pageSize, 1)), 1)

export const getHistoryPagerCursor = ({ page, cursors }: HistoryPagerState): string | undefined =>
  page < 2 ? undefined : cursors[page - 2]

export const canGoToPreviousHistoryPage = ({ page }: HistoryPagerState): boolean => page > 1

export const canGoToNextHistoryPage = ({ page }: HistoryPagerState, hasMore: boolean, pageSize: number): boolean =>
  hasMore && page + 1 <= getMaxHistoryPage(pageSize)

/**
 * `nextCursor` is the cursor the current page's response handed out; `undefined` steps to the next
 * numbered page instead, which the backend still serves inside the 1,000-row window.
 */
export const goToNextHistoryPage = (state: HistoryPagerState, nextCursor: string | undefined): HistoryPagerState => ({
  page: state.page + 1,
  cursors: [...state.cursors.slice(0, state.page - 1), nextCursor],
})

export const goToPreviousHistoryPage = (state: HistoryPagerState): HistoryPagerState =>
  state.page > 1 ? { ...state, page: state.page - 1 } : state

/** Jump straight to a numbered page (the active tab's pager), dropping any cursors already collected. */
export const goToNumberedPage = (page: number): HistoryPagerState => ({ page, cursors: [] })

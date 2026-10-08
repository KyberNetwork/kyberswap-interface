import { describe, expect, it } from 'vitest'

import {
  INITIAL_HISTORY_PAGER_STATE,
  canGoToNextHistoryPage,
  canGoToPreviousHistoryPage,
  getHistoryPagerCursor,
  getMaxHistoryPage,
  goToNextHistoryPage,
  goToNumberedPage,
  goToPreviousHistoryPage,
} from 'components/LimitOrder/MyOrders/historyPager'

const PAGE_SIZE = 10

describe('history pager', () => {
  it('sends no cursor on page 1 and the pushed cursor afterwards', () => {
    expect(getHistoryPagerCursor(INITIAL_HISTORY_PAGER_STATE)).toBeUndefined()

    const page2 = goToNextHistoryPage(INITIAL_HISTORY_PAGER_STATE, 'cursor-2')
    expect(page2).toEqual({ page: 2, cursors: ['cursor-2'] })
    expect(getHistoryPagerCursor(page2)).toBe('cursor-2')

    const page3 = goToNextHistoryPage(page2, 'cursor-3')
    expect(page3).toEqual({ page: 3, cursors: ['cursor-2', 'cursor-3'] })
    expect(getHistoryPagerCursor(page3)).toBe('cursor-3')
  })

  it('walks back to the cursor of the previous page and stops at page 1', () => {
    const page3 = goToNextHistoryPage(goToNextHistoryPage(INITIAL_HISTORY_PAGER_STATE, 'cursor-2'), 'cursor-3')

    const page2 = goToPreviousHistoryPage(page3)
    expect(page2.page).toBe(2)
    expect(getHistoryPagerCursor(page2)).toBe('cursor-2')

    const page1 = goToPreviousHistoryPage(page2)
    expect(page1.page).toBe(1)
    expect(getHistoryPagerCursor(page1)).toBeUndefined()
    expect(canGoToPreviousHistoryPage(page1)).toBe(false)
    expect(goToPreviousHistoryPage(page1)).toBe(page1)
  })

  it('re-pushes the fresh cursor when the user steps forward again', () => {
    const page2 = goToNextHistoryPage(INITIAL_HISTORY_PAGER_STATE, 'cursor-2')
    const page3 = goToNextHistoryPage(page2, 'cursor-3')
    const backToPage2 = goToPreviousHistoryPage(page3)

    const forwardAgain = goToNextHistoryPage(backToPage2, 'cursor-3-refreshed')
    expect(forwardAgain).toEqual({ page: 3, cursors: ['cursor-2', 'cursor-3-refreshed'] })
  })

  it('falls back to numbered paging when the backend reports more rows without a cursor', () => {
    const page2 = goToNextHistoryPage(INITIAL_HISTORY_PAGER_STATE, undefined)
    expect(page2).toEqual({ page: 2, cursors: [undefined] })
    // No cursor for page 2 means the request carries `page: 2` instead.
    expect(getHistoryPagerCursor(page2)).toBeUndefined()

    // A cursor handed out by that legacy page still moves the walk forward.
    const page3 = goToNextHistoryPage(page2, 'cursor-3')
    expect(getHistoryPagerCursor(page3)).toBe('cursor-3')
  })

  it('never offers a page past the backend 1000-row limit', () => {
    expect(getMaxHistoryPage(PAGE_SIZE)).toBe(100)
    expect(getMaxHistoryPage(100)).toBe(10)
    // A page bigger than the whole window still leaves exactly one page.
    expect(getMaxHistoryPage(3000)).toBe(1)

    expect(canGoToNextHistoryPage({ page: 99, cursors: [] }, true, PAGE_SIZE)).toBe(true)
    expect(canGoToNextHistoryPage({ page: 100, cursors: [] }, true, PAGE_SIZE)).toBe(false)
  })

  it('offers a next page only while the backend reports more rows', () => {
    expect(canGoToNextHistoryPage(INITIAL_HISTORY_PAGER_STATE, false, PAGE_SIZE)).toBe(false)
    expect(canGoToNextHistoryPage(INITIAL_HISTORY_PAGER_STATE, true, PAGE_SIZE)).toBe(true)
  })

  it('drops collected cursors on a numbered jump and on reset', () => {
    expect(goToNumberedPage(4)).toEqual({ page: 4, cursors: [] })
    expect(INITIAL_HISTORY_PAGER_STATE).toEqual({ page: 1, cursors: [] })
  })
})

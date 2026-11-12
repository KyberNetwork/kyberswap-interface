// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useHistorySearch } from 'components/SwapTransactions/History/useHistorySearch'
import type { HistoryTransaction } from 'components/SwapTransactions/history'

let metadataLoading = false
vi.mock('components/SwapTransactions/useHistoryTokens', () => ({
  useHistoryTokens: () => ({ resolve: (token: unknown) => token, loading: metadataLoading, unresolved: false }),
}))

const row = (id: number, symbol = 'USDC') =>
  ({ id: String(id), sourceToken: symbol, targetToken: 'ETH', sourceChain: 1, targetChain: 8453 } as HistoryTransaction)
let root: ReturnType<typeof createRoot>
let result: ReturnType<typeof useHistorySearch>
let input: Parameters<typeof useHistorySearch>[0]
const loadMore = vi.fn()
const Harness = () => {
  result = useHistorySearch(input)
  return null
}
const render = () => act(async () => root.render(<Harness key={input.query} />))
const advance = (ms = 300) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  metadataLoading = false
  loadMore.mockReset()
  root = createRoot(document.createElement('div'))
  input = { transactions: [], query: 'usdc', hasMore: true, loadingMore: false, isError: false, onLoadMore: loadMore }
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('automatically fills only the requested result page, then resumes on next page', async () => {
  input.transactions = [row(1), row(2, 'DAI')]
  await render()
  await advance()
  expect(loadMore).toHaveBeenCalledTimes(1)
  input = { ...input, loadingMore: true }
  await render()
  await advance()
  expect(loadMore).toHaveBeenCalledTimes(1)

  input = { ...input, loadingMore: false, transactions: Array.from({ length: 11 }, (_, i) => row(i)) }
  await render()
  await advance(10_000)
  expect(result.transactions).toHaveLength(10)
  expect(result.currentPage).toBe(1)
  expect(result.canGoNext).toBe(true)
  expect(loadMore).toHaveBeenCalledTimes(1)
  await act(async () => result.goNext())
  await advance()
  expect(loadMore).toHaveBeenCalledTimes(2)
  expect(result.currentPage).toBe(2)
  expect(result.transactions.map(tx => tx.id)).toEqual(['10'])

  input = { ...input, hasMore: false, transactions: Array.from({ length: 14 }, (_, i) => row(i)) }
  await render()
  await advance()
  expect(result.currentPage).toBe(2)
  expect(result.transactions).toHaveLength(4)
  expect(result.canGoNext).toBe(false)
  await act(async () => result.goPrevious())
  await advance()
  expect(result.transactions).toHaveLength(10)
  expect(loadMore).toHaveBeenCalledTimes(2)
})

it('waits for metadata, stops on errors, and resumes after retry', async () => {
  metadataLoading = true
  await render()
  await advance()
  expect(loadMore).not.toHaveBeenCalled()
  metadataLoading = false
  input = { ...input, isError: true }
  await render()
  await advance()
  expect(loadMore).not.toHaveBeenCalled()
  expect(result.loading).toBe(false)
  input = { ...input, isError: false }
  await render()
  await advance()
  expect(loadMore).toHaveBeenCalledTimes(1)
})

it.each([11, 20])('keeps cached result pages navigable after a refresh error with %i matches', async count => {
  input = { ...input, transactions: Array.from({ length: count }, (_, i) => row(i)), isError: true }
  await render()
  expect(result.canGoNext).toBe(true)
  await act(async () => result.goNext())
  await advance()
  expect(result.currentPage).toBe(2)
  expect(result.transactions).toHaveLength(count - 10)
  expect(result.canGoNext).toBe(false)
  expect(result.canGoPrevious).toBe(true)
  expect(loadMore).not.toHaveBeenCalled()
  await act(async () => result.goPrevious())
  expect(result.currentPage).toBe(1)
  expect(result.transactions).toHaveLength(10)
})

it('does not leave a phantom empty page when the remaining history has no matches', async () => {
  input.transactions = Array.from({ length: 10 }, (_, i) => row(i))
  await render()
  await act(async () => result.goNext())
  await advance()
  input = { ...input, hasMore: false, transactions: [...input.transactions, row(11, 'DAI')] }
  await render()
  expect(result.currentPage).toBe(1)
  expect(result.transactions).toHaveLength(10)
  expect(result.canGoNext).toBe(false)
})

it('cancels scheduled loading when the query changes or search closes', async () => {
  await render()
  input = { ...input, query: 'eth', transactions: Array.from({ length: 10 }, (_, i) => row(i)) }
  await render()
  await advance()
  expect(loadMore).not.toHaveBeenCalled()
  expect(result.currentPage).toBe(1)
  input = { ...input, query: 'missing' }
  await render()
  await act(async () => root.render(null))
  await advance()
  expect(loadMore).not.toHaveBeenCalled()
})

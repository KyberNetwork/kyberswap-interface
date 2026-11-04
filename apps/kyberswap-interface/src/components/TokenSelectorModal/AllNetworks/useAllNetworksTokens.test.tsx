import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, it, vi } from 'vitest'

import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import { useAllNetworksTokens } from './useAllNetworksTokens'

const mocks = vi.hoisted(() => ({
  infinite: vi.fn(),
  fetch: vi.fn(),
}))
vi.mock('@tanstack/react-query', () => ({ useInfiniteQuery: mocks.infinite }))
vi.mock('components/TokenSelectorModal/utils', () => ({
  fetchAllNetworkTokenPage: mocks.fetch,
  TOKEN_SEARCH_PAGE_SIZE: 20,
}))

const address = '0x0000000000000000000000000000000000000001'
const token = (chainId: number, symbol = 'TOKEN') =>
  new WrappedTokenInfo({ chainId, address, symbol, name: symbol, decimals: 18, isWhitelisted: true })
const read = (options: Partial<Parameters<typeof useAllNetworksTokens>[0]> = {}) => {
  let result!: ReturnType<typeof useAllNetworksTokens>
  const Probe = () => {
    result = useAllNetworksTokens({ active: true, query: '', ...options })
    return null
  }
  renderToStaticMarkup(createElement(Probe))
  return result
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.infinite.mockReturnValue({
    data: { pages: [{ tokens: [token(1), token(56), token(8453), token(1)], rawCount: 20, totalItems: 1000 }] },
    hasNextPage: true,
    fetchNextPage: vi.fn(),
  })
})
it('paginates by raw response length, even if mappings or unsupported chains removed every row', () => {
  read()
  const next = mocks.infinite.mock.lastCall?.[0].getNextPageParam
  const page = { tokens: [], rawCount: 20, totalItems: 1000 }
  expect(next(page, [page])).toBe(2)
  expect(next({ tokens: [], rawCount: 0 }, [page])).toBeUndefined()
  expect(next({ ...page, totalItems: 20 }, [page])).toBeUndefined()
})
it('stops automatic pagination retries after a failed page and lets the user retry explicitly', async () => {
  const fetchNextPage = vi.fn()
  mocks.infinite.mockReturnValue({ isError: true, isFetchNextPageError: true, hasNextPage: true, fetchNextPage })
  const result = read()
  expect(result.error).toBe(true)
  expect(result.hasMore).toBe(false)
  await result.fetchMore()
  expect(fetchNextPage).not.toHaveBeenCalled()
  result.retry()
  expect(fetchNextPage).toHaveBeenCalledOnce()
})

import { ChainId } from '@kyberswap/ks-sdk-core'
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
const networks = [
  { chainId: ChainId.MAINNET, name: 'Ethereum', icon: '' },
  { chainId: ChainId.BSCMAINNET, name: 'BNB', icon: '' },
]
const read = (options: Partial<Parameters<typeof useAllNetworksTokens>[0]> = {}) => {
  let result!: ReturnType<typeof useAllNetworksTokens>
  const Probe = () => {
    result = useAllNetworksTokens({ active: true, networks, query: '', filterWrap: false, ...options })
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
it('keeps same-address tokens on different allowed chains, removes duplicates and unsupported chains', () => {
  expect(read().currencies.map(token => token.chainId)).toEqual([1, 56])
})
it('uses KS Setting for browsing, symbol and address searches without a tab or sort param', async () => {
  for (const search of ['', 'USDC', address]) {
    read({ query: search })
    await mocks.infinite.mock.lastCall?.[0].queryFn({ pageParam: 2 })
    expect(mocks.fetch).toHaveBeenLastCalledWith(search, 2)
  }
})
it('paginates by raw response length, even if mappings or unsupported chains removed every row', () => {
  read()
  const next = mocks.infinite.mock.lastCall?.[0].getNextPageParam
  const page = { tokens: [], rawCount: 20, totalItems: 1000 }
  expect(next(page, [page])).toBe(2)
  expect(next({ tokens: [], rawCount: 0 }, [page])).toBeUndefined()
  expect(next({ ...page, totalItems: 20 }, [page])).toBeUndefined()
})
it('does not supplement an empty API response, including for Abstract', () => {
  mocks.infinite.mockReturnValue({ data: { pages: [{ tokens: [], rawCount: 0 }] } })
  expect(
    read({ networks: [...networks, { chainId: ChainId.ABSTRACT, name: 'Abstract', icon: '' }] }).currencies,
  ).toEqual([])
})
it('does not request the catalog when the aggregate tab is inactive', () => {
  read({ active: false })
  expect(mocks.infinite.mock.lastCall?.[0].enabled).toBe(false)
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

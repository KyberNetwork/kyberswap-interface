// @vitest-environment happy-dom
import { Currency, CurrencyAmount, Token, WETH } from '@kyberswap/ks-sdk-core'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { ChainSnapshot } from 'components/TokenSelectorModal/AllNetworks/types'
import { TokenSelectorTab } from 'components/TokenSelectorModal/constants'
import { tokenRowKey } from 'components/TokenSelectorModal/types'
import { NativeCurrencies } from 'constants/tokens'

import { AGGREGATE_UPDATE_INTERVAL_MS, useAggregateTokens } from './useAggregateTokens'

const mocks = vi.hoisted(() => ({
  account: 'a',
  all: { currencies: [] as Currency[], loading: false, hasMore: false, fetchMore: vi.fn() },
  trending: vi.fn(),
  recent: vi.fn(),
}))
vi.mock('state/wallet/WalletBalanceContext', () => ({ useEvmBalanceAccount: () => mocks.account }))
vi.mock('components/TokenSelectorModal/AllNetworks/useAllNetworksTokens', () => ({
  useAllNetworksTokens: () => mocks.all,
}))
vi.mock('components/TokenSelectorModal/hooks/useTrendingTokens', () => ({ useTrendingTokens: mocks.trending }))
vi.mock('components/TokenSelectorModal/hooks/useNewTokens', () => ({ useNewTokens: mocks.recent }))
vi.mock('state/walletInventory/metadata', () => ({ ensureTokenMetadata: vi.fn() }))
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const address = '0x0000000000000000000000000000000000000001'
const a = new Token(1, address, 6, 'AAA')
const b = new Token(56, address, 18, 'BBB')
const c = new Token(137, address, 18, 'CCC')
const d = new Token(42161, address, 18, 'DDD')
const e = new Token(10, address, 18, 'EEE')
const unsupported = new Token(8453, address, 18, 'CCC')
const networks = [
  { chainId: 1, name: 'Ethereum', icon: '' },
  { chainId: 56, name: 'BSC', icon: '' },
]
const manyNetworks = [
  ...networks,
  { chainId: 137, name: 'Polygon', icon: '' },
  { chainId: 42161, name: 'Arbitrum', icon: '' },
  { chainId: 10, name: 'Optimism', icon: '' },
]
let root: ReturnType<typeof createRoot>
let data: ReturnType<typeof useAggregateTokens>
const Probe = ({
  tab,
  query,
  active,
  other,
  networkList = networks,
}: {
  tab: TokenSelectorTab
  query: string
  active: boolean
  other?: Currency
  networkList?: typeof networks
}) => {
  data = useAggregateTokens({
    active,
    networks: networkList,
    activeTab: tab,
    query,
    sort: null,
    filterWrap: !!other,
    otherSelectedCurrency: other,
  })
  return null
}
const mount = async (
  tab: TokenSelectorTab,
  query = '',
  active = true,
  other?: Currency,
  networkList: typeof networks = networks,
) => {
  root ??= createRoot(document.createElement('div'))
  await act(async () =>
    root?.render(<Probe tab={tab} query={query} active={active} other={other} networkList={networkList} />),
  )
}
const flushBatch = async () => {
  await act(async () => {
    vi.advanceTimersByTime(AGGREGATE_UPDATE_INTERVAL_MS)
  })
}
const snapshot = (token: Token, loading = false): ChainSnapshot => ({
  currencies: [token],
  balances: {
    [tokenRowKey(token.chainId, address)]: {
      balance: CurrencyAmount.fromRawAmount(token, token.chainId === 1 ? '1000000' : '2000000000000000000'),
      price: 10,
      waiting: false,
    },
  },
  extras: {},
  loading,
})
beforeEach(() => {
  vi.useFakeTimers()
  mocks.account = 'a'
  mocks.all = { currencies: [], loading: false, hasMore: false, fetchMore: vi.fn() }
  mocks.trending.mockReturnValue({ tokens: [], extras: {}, loading: false, hasMore: false, fetchMore: vi.fn() })
  mocks.recent.mockReturnValue({ tokens: [], extras: {}, loading: false })
})
afterEach(async () => {
  await act(async () => root?.unmount())
  root = undefined as unknown as typeof root
  vi.useRealTimers()
})
it('publishes a completed Favorites chain before the others and ends loading after an empty completion', async () => {
  await mount(TokenSelectorTab.Favorites)
  expect(data.isListLoading).toBe(true)
  await act(async () => data.onSnapshot(data.session, 1, snapshot(a)))
  await flushBatch()
  expect(data.visibleCurrencies).toEqual([a])
  expect(data.isListLoading).toBe(true)
  await act(async () => data.onSnapshot(data.session, 56, { currencies: [], extras: {}, balances: {}, loading: false }))
  await flushBatch()
  expect(data.isListLoading).toBe(false)
  expect(data.visibleCurrencies).toEqual([a])
})

it('publishes only the latest chain snapshot at the batch boundary', async () => {
  await mount(TokenSelectorTab.Favorites)
  const first = snapshot(a, true)
  const latest = snapshot(a, false)
  latest.balances[tokenRowKey(a.chainId, address)].price = 20

  await act(async () => data.onSnapshot(data.session, 1, first))
  await act(async () => vi.advanceTimersByTime(AGGREGATE_UPDATE_INTERVAL_MS - 1))
  await act(async () => {
    data.onSnapshot(data.session, 1, latest)
    data.onSnapshot(data.session, 56, { currencies: [], extras: {}, balances: {}, loading: false })
  })
  expect(data.visibleCurrencies).toEqual([])
  expect(data.isListLoading).toBe(true)

  await flushBatch()
  expect(data.visibleCurrencies).toEqual([a])
  expect(data.balances[tokenRowKey(a.chainId, address)].price).toBe(20)
  expect(data.isListLoading).toBe(false)
})

it('does not extend the window when more chain responses arrive', async () => {
  await mount(TokenSelectorTab.Favorites)
  await act(async () => data.onSnapshot(data.session, 1, snapshot(a)))
  await act(async () => vi.advanceTimersByTime(AGGREGATE_UPDATE_INTERVAL_MS - 1))
  await act(async () => data.onSnapshot(data.session, 56, { currencies: [], extras: {}, balances: {}, loading: false }))
  await act(async () => vi.advanceTimersByTime(1))
  expect(data.visibleCurrencies).toEqual([a])
  expect(data.isListLoading).toBe(false)
})

it('publishes every chain received within the window in the same batch', async () => {
  await mount(TokenSelectorTab.Favorites, '', true, undefined, manyNetworks)
  const tokens = [a, b, c, d, e]
  await act(async () => {
    tokens.forEach(token => data.onSnapshot(data.session, token.chainId, snapshot(token)))
  })

  expect(data.visibleCurrencies).toEqual([])
  expect(data.isListLoading).toBe(true)

  await flushBatch()
  expect(data.visibleCurrencies).toHaveLength(tokens.length)
  expect(data.isListLoading).toBe(false)
  expect(vi.getTimerCount()).toBe(0)

  const updated = snapshot(e)
  updated.balances[tokenRowKey(e.chainId, address)].price = 30
  await act(async () => data.onSnapshot(data.session, e.chainId, updated))
  expect(data.balances[tokenRowKey(e.chainId, address)].price).toBe(10)
  await flushBatch()
  expect(data.balances[tokenRowKey(e.chainId, address)].price).toBe(30)
})

it('discards an unflushed batch when the wallet changes and cancels it on unmount', async () => {
  await mount(TokenSelectorTab.Favorites)
  await act(async () => data.onSnapshot(data.session, 1, snapshot(a)))
  mocks.account = 'b'
  await mount(TokenSelectorTab.Favorites)
  await flushBatch()
  expect(data.visibleCurrencies).toEqual([])
  await act(async () => data.onSnapshot(data.session, 56, snapshot(b)))
  await act(async () => root.unmount())
  root = undefined as unknown as typeof root
  expect(vi.getTimerCount()).toBe(0)
})

it('merges holdings absent from catalog, deduplicates by chain and ranks Imported by balance too', async () => {
  mocks.all.currencies = [a, a, unsupported]
  await mount(TokenSelectorTab.All)
  await act(async () => {
    data.onSnapshot(data.session, 1, snapshot(a))
    data.onSnapshot(data.session, 56, snapshot(b))
  })
  await flushBatch()
  expect(data.visibleCurrencies).toEqual([b, a])
  await mount(TokenSelectorTab.Imported)
  await act(async () => {
    data.onSnapshot(data.session, 1, snapshot(a))
    data.onSnapshot(data.session, 56, snapshot(b))
  })
  await flushBatch()
  expect(data.visibleCurrencies).toEqual([b, a])
})
it('searches local tokens absent from the API', async () => {
  await mount(TokenSelectorTab.All, 'BBB')
  await act(async () => data.onSnapshot(data.session, 56, snapshot(b)))
  await flushBatch()
  expect(data.visibleCurrencies).toEqual([b])
})
it('provides held matches only for All search and clears them when browsing or changing tabs', async () => {
  await mount(TokenSelectorTab.All)
  await act(async () => data.onSnapshot(data.session, 56, snapshot(b)))
  await flushBatch()
  expect(data.heldAddresses).toBeUndefined()

  await mount(TokenSelectorTab.All, 'BBB')
  expect(data.heldAddresses).toEqual(new Set([tokenRowKey(b.chainId, b.address)]))
  expect(data.heldAddresses?.has(tokenRowKey(a.chainId, a.address))).toBe(false)

  await mount(TokenSelectorTab.All)
  expect(data.heldAddresses).toBeUndefined()
  await mount(TokenSelectorTab.Favorites, 'BBB')
  await act(async () => data.onSnapshot(data.session, 56, snapshot(b)))
  await flushBatch()
  expect(data.heldAddresses).toBeUndefined()
})
it('uses aggregate discovery sources, filters supported chains and advances filtered-empty pages', async () => {
  const next = vi.fn()
  mocks.trending.mockReturnValue({ tokens: [unsupported], extras: {}, loading: false, hasMore: true, fetchMore: next })
  await mount(TokenSelectorTab.Trending)
  expect(mocks.trending).toHaveBeenCalledWith(undefined, null, true)
  expect(data.visibleCurrencies).toEqual([])
  expect(next).toHaveBeenCalledOnce()
  mocks.recent.mockReturnValue({ tokens: [a, unsupported, b], extras: {}, loading: false })
  await mount(TokenSelectorTab.New)
  expect(data.visibleCurrencies).toEqual([a, b])
  expect(data.listHasMore).toBe(false)
})

it('rejects late publications across wallet A/B/A, disconnect and close/reopen', async () => {
  await mount(TokenSelectorTab.Imported)
  const firstSession = data.session
  const publish = data.onSnapshot
  await act(async () => publish(firstSession, 1, snapshot(a)))
  await flushBatch()
  mocks.account = 'b'
  await mount(TokenSelectorTab.Imported)
  expect(data.visibleCurrencies).toEqual([])
  await act(async () => publish(firstSession, 1, snapshot(a)))
  expect(data.visibleCurrencies).toEqual([])
  mocks.account = 'a'
  await mount(TokenSelectorTab.Imported)
  expect(data.session).not.toBe(firstSession)
  await act(async () => publish(firstSession, 1, snapshot(a)))
  expect(data.visibleCurrencies).toEqual([])
  await act(async () => publish(data.session, 56, snapshot(b)))
  await flushBatch()
  expect(data.visibleCurrencies).toEqual([b])
  mocks.account = ''
  await mount(TokenSelectorTab.Imported)
  expect(data.visibleCurrencies).toEqual([])
  const beforeClose = data.session
  await mount(TokenSelectorTab.Imported, '', false)
  await act(async () => publish(beforeClose, 1, snapshot(a)))
  await mount(TokenSelectorTab.Imported)
  await act(async () => publish(beforeClose, 1, snapshot(a)))
  expect(data.visibleCurrencies).toEqual([])
})

it.each(Object.values(TokenSelectorTab))('applies search and wrap eligibility to the final %s list', async tab => {
  const native = NativeCurrencies[1]
  const wrapped = WETH[1]
  const otherChain = new Token(56, wrapped.address, 18, 'WETH')
  const tokens = [native, wrapped, otherChain]
  mocks.all.currencies = tokens
  mocks.trending.mockReturnValue({ tokens, extras: {}, loading: false, hasMore: false, fetchMore: vi.fn() })
  mocks.recent.mockReturnValue({ tokens, extras: {}, loading: false })
  await mount(tab, '', true, native)
  if (data.needsChainSources) {
    await act(async () =>
      data.onSnapshot(data.session, 1, { currencies: tokens, balances: {}, extras: {}, loading: false }),
    )
    await flushBatch()
  }
  expect(data.visibleCurrencies).toHaveLength(2)
  expect(data.visibleCurrencies).toContain(native)
  expect(data.visibleCurrencies).toContain(otherChain)
  expect(data.visibleCurrencies).not.toContain(wrapped)
  await mount(tab, 'WETH', true, native)
  expect(data.visibleCurrencies).toEqual([otherChain])
  await mount(tab, '', true, wrapped)
  expect(data.visibleCurrencies).not.toContain(native)
  expect(data.visibleCurrencies).toContain(wrapped)
  expect(data.visibleCurrencies).toContain(otherChain)
})

it('keeps Imported balance ties alphabetical regardless of favorite membership', async () => {
  await mount(TokenSelectorTab.Imported)
  const first = snapshot(a)
  const second = snapshot(b)
  first.balances[tokenRowKey(1, address)].balance = CurrencyAmount.fromRawAmount(a, '0')
  second.balances[tokenRowKey(56, address)].balance = CurrencyAmount.fromRawAmount(b, '0')
  second.balances[tokenRowKey(56, address)].favorite = true
  await act(async () => {
    data.onSnapshot(data.session, 1, first)
    data.onSnapshot(data.session, 56, second)
  })
  await flushBatch()
  expect(data.visibleCurrencies).toEqual([a, b])
})

it('keeps API address matches when the pasted query contains outer whitespace', async () => {
  mocks.all.currencies = [a]
  await mount(TokenSelectorTab.All, ` ${address} `)
  expect(data.visibleCurrencies).toEqual([a])
})

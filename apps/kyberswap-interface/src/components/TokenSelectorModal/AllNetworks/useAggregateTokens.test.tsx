// @vitest-environment happy-dom
import { Currency, CurrencyAmount, Token, WETH } from '@kyberswap/ks-sdk-core'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { ChainSnapshot } from 'components/TokenSelectorModal/AllNetworks/types'
import { TokenSelectorTab } from 'components/TokenSelectorModal/constants'
import { tokenRowKey } from 'components/TokenSelectorModal/types'
import { NativeCurrencies } from 'constants/tokens'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import { AGGREGATE_UPDATE_INTERVAL_MS } from './useAggregateSnapshot'
import { mergeAggregateTokens, useAggregateTokens } from './useAggregateTokens'

const mocks = vi.hoisted(() => ({
  account: 'a',
  comparator: vi.fn(),
  all: { currencies: [] as Currency[], loading: false, hasMore: false, fetchMore: vi.fn() },
  trending: vi.fn(),
  recent: vi.fn(),
}))
vi.mock('components/TokenSelectorModal/hooks/holdingSort', async importOriginal => {
  const actual = await importOriginal<typeof import('components/TokenSelectorModal/hooks/holdingSort')>()
  mocks.comparator.mockImplementation(actual.getHoldingComparator)
  return { ...actual, getHoldingComparator: mocks.comparator }
})
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
  mocks.comparator.mockClear()
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

it.each([TokenSelectorTab.All, TokenSelectorTab.Trending, TokenSelectorTab.New])(
  'keeps %s loading until the completed catalog is published',
  async tab => {
    const setCatalog = (tokens: Currency[], loading: boolean) => {
      mocks.all = { ...mocks.all, currencies: tokens, loading }
      mocks.trending.mockReturnValue({ tokens, extras: {}, loading, hasMore: false, fetchMore: vi.fn() })
      mocks.recent.mockReturnValue({ tokens, extras: {}, loading })
    }
    setCatalog([], true)
    await mount(tab)
    if (data.needsChainSources) {
      await act(async () => {
        networks.forEach(({ chainId }) =>
          data.onSnapshot(data.session, chainId, { currencies: [], balances: {}, extras: {}, loading: false }),
        )
      })
      await flushBatch()
    }

    setCatalog([a], false)
    await mount(tab)
    await act(async () => vi.advanceTimersByTime(AGGREGATE_UPDATE_INTERVAL_MS - 1))
    expect(data.visibleCurrencies).toEqual([])
    expect(data.isListLoading).toBe(true)
    await act(async () => vi.advanceTimersByTime(1))
    expect(data.visibleCurrencies).toEqual([a])
    expect(data.isListLoading).toBe(false)
  },
)

it.each([TokenSelectorTab.Trending, TokenSelectorTab.New])(
  'ends %s loading when an empty catalog completion is published',
  async tab => {
    const source = tab === TokenSelectorTab.Trending ? mocks.trending : mocks.recent
    source.mockReturnValue({ tokens: [], extras: {}, loading: true, hasMore: false })
    await mount(tab)
    source.mockReturnValue({ tokens: [], extras: {}, loading: false, hasMore: false })
    await mount(tab)
    expect(data.isListLoading).toBe(true)
    await flushBatch()
    expect(data.visibleCurrencies).toEqual([])
    expect(data.isListLoading).toBe(false)
  },
)

it('preserves chain subscriptions and their batch deadline across search A/B/A, discarding obsolete catalog data', async () => {
  mocks.all.currencies = [a]
  await mount(TokenSelectorTab.All)
  const session = data.session
  await act(async () => {
    data.onSnapshot(session, 1, { ...snapshot(a), currencies: [] })
    data.onSnapshot(session, 56, { ...snapshot(b), currencies: [] })
  })
  mocks.all.currencies = [a, b]
  await mount(TokenSelectorTab.All)
  await act(async () => vi.advanceTimersByTime(100))

  mocks.all.currencies = [a]
  await mount(TokenSelectorTab.All, 'AAA')
  expect(data.session).toBe(session)
  expect(data.visibleCurrencies).toEqual([a])
  await mount(TokenSelectorTab.All)
  expect(data.session).toBe(session)
  expect(data.balances).toEqual({})
  await act(async () => vi.advanceTimersByTime(AGGREGATE_UPDATE_INTERVAL_MS - 100))
  expect(data.visibleCurrencies).toEqual([a])
  expect(Object.keys(data.balances)).toHaveLength(2)
  expect(data.isListLoading).toBe(false)

  // Existing observers keep publishing through their original session after the search changes.
  await act(async () => data.onSnapshot(session, 56, snapshot(b)))
  await flushBatch()
  expect(data.visibleCurrencies).toEqual([b, a])
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

it('restores the sorted All Networks snapshot immediately and only reorders for new data', async () => {
  mocks.all.currencies = [a, b]
  await mount(TokenSelectorTab.All)
  const oldSession = data.session
  const first = snapshot(a)
  const second = snapshot(b)
  await act(async () => {
    data.onSnapshot(oldSession, 1, first)
    data.onSnapshot(oldSession, 56, second)
  })
  await flushBatch()
  expect(data.visibleCurrencies).toEqual([b, a])
  const balances = data.balances

  // A pending update from the previous subscription must not survive leaving the view.
  const updated = snapshot(a)
  updated.balances[tokenRowKey(a.chainId, address)].price = 100
  await act(async () => data.onSnapshot(oldSession, 1, updated))
  await mount(TokenSelectorTab.All, '', false)
  await mount(TokenSelectorTab.All)
  expect(data.session).not.toBe(oldSession)
  expect(data.visibleCurrencies).toEqual([b, a])
  expect(data.balances).toEqual(balances)
  expect(data.isListLoading).toBe(false)
  await act(async () => data.onSnapshot(oldSession, 1, updated))
  await flushBatch()
  expect(data.visibleCurrencies).toEqual([b, a])

  // Republishing the same source data does not change order; a new price still does.
  await act(async () => {
    data.onSnapshot(data.session, 1, first)
    data.onSnapshot(data.session, 56, second)
  })
  await flushBatch()
  expect(data.visibleCurrencies).toEqual([b, a])
  await act(async () => data.onSnapshot(data.session, 1, updated))
  await flushBatch()
  expect(data.visibleCurrencies).toEqual([a, b])
})

it('publishes reactivated chains at each batch deadline without waiting for other chains or the catalog', async () => {
  mocks.all.currencies = [a, b]
  await mount(TokenSelectorTab.All)
  const publish = data.onSnapshot
  await act(async () => {
    publish(data.session, 1, snapshot(a))
    publish(data.session, 56, snapshot(b))
  })
  await flushBatch()
  const previous = data.visibleCurrencies
  const retainedB = data.balances[tokenRowKey(56, address)]
  expect(previous).toEqual([b, a])

  await mount(TokenSelectorTab.All, '', false)
  mocks.all = { ...mocks.all, loading: true }
  await mount(TokenSelectorTab.All)
  const resumedSession = data.session
  expect(data.visibleCurrencies).toBe(previous)
  expect(data.onSnapshot).toBe(publish)

  // Even a loading chain can contribute available data; later observations replace it in the batch.
  const updatedA = snapshot(a, true)
  updatedA.balances[tokenRowKey(1, address)].price = 100
  await act(async () => publish(resumedSession, 1, snapshot(a, true)))
  await act(async () => vi.advanceTimersByTime(100))
  await act(async () => publish(resumedSession, 1, updatedA))
  await act(async () => vi.advanceTimersByTime(149))
  expect(data.visibleCurrencies).toBe(previous)
  await act(async () => vi.advanceTimersByTime(1))
  expect(data.visibleCurrencies).toEqual([a, b])
  expect(data.balances[tokenRowKey(56, address)]).toBe(retainedB)
  expect(data.isListLoading).toBe(true)

  // A slower chain changes the ranking in the next batch, without waiting for catalog completion.
  const updatedB = snapshot(b)
  updatedB.balances[tokenRowKey(56, address)].price = 200
  await act(async () => publish(resumedSession, 56, updatedB))
  expect(data.visibleCurrencies).toEqual([a, b])
  await flushBatch()
  expect(data.visibleCurrencies).toEqual([b, a])
  expect(data.isListLoading).toBe(true)

  mocks.all = { ...mocks.all, loading: false }
  await mount(TokenSelectorTab.All)
  await act(async () => publish(resumedSession, 1, { ...updatedA, loading: false }))
  await flushBatch()
  expect(data.isListLoading).toBe(false)
  expect(vi.getTimerCount()).toBe(0)
})

it('clears retained observations if the wallet changes while All Networks is inactive', async () => {
  await mount(TokenSelectorTab.All)
  await act(async () => data.onSnapshot(data.session, 1, snapshot(a)))
  await flushBatch()
  await mount(TokenSelectorTab.All, '', false)
  mocks.account = 'b'
  await mount(TokenSelectorTab.All, '', false)
  await mount(TokenSelectorTab.All)
  expect(data.visibleCurrencies).toEqual([])
  expect(data.balances).toEqual({})
})

it('publishes catalog pages and the latest per-chain balances together at a fixed deadline', async () => {
  mocks.all.currencies = [a]
  await mount(TokenSelectorTab.All)
  const initial = data.visibleCurrencies
  await act(async () => data.onSnapshot(data.session, 1, snapshot(a)))
  await act(async () => vi.advanceTimersByTime(100))
  mocks.all.currencies = [a, b]
  await mount(TokenSelectorTab.All)
  await act(async () => data.onSnapshot(data.session, 56, snapshot(b)))
  expect(data.visibleCurrencies).toBe(initial)
  expect(data.balances).toEqual({})
  const calls = mocks.comparator.mock.calls.length
  await act(async () => vi.advanceTimersByTime(150))
  expect(data.visibleCurrencies).toEqual([b, a])
  expect(Object.keys(data.balances)).toHaveLength(2)
  expect(mocks.comparator).toHaveBeenCalledTimes(calls + 1)

  // A response after the boundary belongs to the next publication, not a replay of the last batch.
  const next = snapshot(a)
  next.balances[tokenRowKey(1, address)].price = 100
  await act(async () => data.onSnapshot(data.session, 1, next))
  expect(data.visibleCurrencies).toEqual([b, a])
  await flushBatch()
  expect(data.visibleCurrencies).toEqual([a, b])
})

it('does not sort for equivalent snapshots or waiting-only updates, including remounted sources', async () => {
  await mount(TokenSelectorTab.All)
  await act(async () => data.onSnapshot(data.session, 1, snapshot(a)))
  await flushBatch()
  const original = data.visibleCurrencies
  const balances = data.balances
  const calls = mocks.comparator.mock.calls.length
  // New objects, including a newly constructed SDK balance, with exactly the same values.
  await act(async () => data.onSnapshot(data.session, 1, snapshot(a)))
  await flushBatch()
  expect(data.visibleCurrencies).toBe(original)
  expect(data.balances).toBe(balances)
  expect(mocks.comparator).toHaveBeenCalledTimes(calls)

  const waiting = snapshot(a, true)
  waiting.balances[tokenRowKey(1, address)].waiting = true
  await act(async () => data.onSnapshot(data.session, 1, waiting))
  await flushBatch()
  expect(data.balances[tokenRowKey(1, address)].waiting).toBe(true)
  expect(data.visibleCurrencies).toBe(original)
  expect(mocks.comparator).toHaveBeenCalledTimes(calls)

  await mount(TokenSelectorTab.All, '', false)
  await mount(TokenSelectorTab.All)
  const resumedCalls = mocks.comparator.mock.calls.length
  await act(async () => data.onSnapshot(data.session, 1, { ...waiting }))
  await flushBatch()
  expect(data.visibleCurrencies).toBe(original)
  expect(mocks.comparator).toHaveBeenCalledTimes(resumedCalls)
})

it('keeps order identity for value changes that do not change rank and replaces stale catalog batches on search', async () => {
  mocks.all.currencies = [a, b]
  await mount(TokenSelectorTab.All)
  await act(async () => {
    data.onSnapshot(data.session, 1, snapshot(a))
    data.onSnapshot(data.session, 56, snapshot(b))
  })
  await flushBatch()
  const original = data.visibleCurrencies
  const update = snapshot(b)
  update.balances[tokenRowKey(56, address)].price = 30
  await act(async () => data.onSnapshot(data.session, 56, update))
  await flushBatch()
  expect(data.visibleCurrencies).toBe(original)
  expect(data.balances[tokenRowKey(56, address)].price).toBe(30)

  mocks.all.currencies = [a, b, c]
  await mount(TokenSelectorTab.All)
  mocks.all.currencies = [a]
  await mount(TokenSelectorTab.All, 'AAA')
  expect(data.visibleCurrencies).toEqual([a])
  await flushBatch()
  expect(data.visibleCurrencies).toEqual([a])
})

it('does not starve publication under continuous responses and ignores callbacks after unmount', async () => {
  await mount(TokenSelectorTab.All)
  for (let i = 0; i < 5; i++) {
    const update = snapshot(a)
    update.balances[tokenRowKey(1, address)].price = i + 1
    await act(async () => data.onSnapshot(data.session, 1, update))
    await act(async () => vi.advanceTimersByTime(50))
  }
  expect(data.balances[tokenRowKey(1, address)].price).toBe(5)
  expect(data.visibleCurrencies).toEqual([a])
  const publish = data.onSnapshot
  const session = data.session
  await act(async () => root.unmount())
  root = undefined as unknown as typeof root
  await act(async () => publish(session, 1, snapshot(a)))
  expect(vi.getTimerCount()).toBe(0)
})

it('keeps API market-cap order for unpriced tokens and prioritizes priced wallet value', async () => {
  mocks.all.currencies = [b, a, d, c]
  await mount(TokenSelectorTab.All, '', true, undefined, manyNetworks)
  await flushBatch()
  expect(data.visibleCurrencies).toEqual([b, a, d, c])

  const unpriced = snapshot(b)
  unpriced.balances[tokenRowKey(b.chainId, address)].price = 0
  await act(async () => {
    data.onSnapshot(data.session, 1, snapshot(a))
    data.onSnapshot(data.session, 56, unpriced)
    data.onSnapshot(data.session, 137, snapshot(c))
  })
  await flushBatch()
  expect(data.visibleCurrencies).toEqual([c, a, b, d])
})

it.each([true, false])('advances search-empty Trending pages and settles when a match exists: %s', async found => {
  const next = vi.fn()
  const nvidia = new Token(1, '0x0000000000000000000000000000000000000002', 18, 'NVDA', 'NVIDIA')
  const source = {
    tokens: [a],
    extras: {},
    loading: false,
    hasMore: true,
    fetchMore: next,
    lastPageChains: [1],
    pageCount: 1,
  }
  mocks.trending.mockReturnValue(source)
  await mount(TokenSelectorTab.Trending, 'nvidia')
  expect(data.visibleCurrencies).toEqual([])
  expect(next).toHaveBeenCalledOnce()

  mocks.trending.mockReturnValue({ ...source, tokens: [a, b], lastPageChains: [56], pageCount: 2 })
  await mount(TokenSelectorTab.Trending, 'nvidia')
  await flushBatch()
  expect(next).toHaveBeenCalledTimes(2)

  mocks.trending.mockReturnValue({
    ...source,
    tokens: found ? [a, b, nvidia] : [a, b],
    pageCount: 3,
    hasMore: false,
  })
  await mount(TokenSelectorTab.Trending, 'nvidia')
  await flushBatch()
  expect(data.visibleCurrencies).toEqual(found ? [nvidia] : [])
  expect(data.isListLoading).toBe(false)
  expect(data.listHasMore).toBe(false)
  expect(next).toHaveBeenCalledTimes(2)
})

it('preserves local execution metadata while retaining catalog order', () => {
  const local = new WrappedTokenInfo({
    chainId: 1,
    address,
    decimals: 6,
    symbol: 'AAA',
    name: 'AAA',
    permitType: 'AMOUNT',
    permitVersion: '1',
    domainSeparator: 'domain',
    isWhitelisted: true,
  })
  const result = mergeAggregateTokens([local, c], [b, a, b])
  expect(result).toEqual([b, local, c])
  expect(result[1]).toBe(local)
  expect((result[1] as WrappedTokenInfo).permitType).toBe('AMOUNT')
  expect((result[1] as WrappedTokenInfo).permitVersion).toBe('1')
})

it('continues past a search-empty page even when earlier pages have matches', async () => {
  const next = vi.fn()
  const source = {
    tokens: [a],
    extras: {},
    loading: false,
    hasMore: true,
    fetchMore: next,
    lastPageTokens: [a],
    lastPageChains: [1],
    pageCount: 1,
  }
  mocks.trending.mockReturnValue(source)
  await mount(TokenSelectorTab.Trending, 'AAA')
  expect(data.visibleCurrencies).toEqual([a])
  expect(next).not.toHaveBeenCalled()

  mocks.trending.mockReturnValue({ ...source, tokens: [a, b], lastPageTokens: [b], lastPageChains: [56], pageCount: 2 })
  await mount(TokenSelectorTab.Trending, 'AAA')
  await flushBatch()
  expect(data.visibleCurrencies).toEqual([a])
  expect(next).toHaveBeenCalledOnce()

  mocks.trending.mockReturnValue({ ...source, tokens: [a, b], lastPageTokens: [], pageCount: 3, hasMore: false })
  await mount(TokenSelectorTab.Trending, 'AAA')
  await flushBatch()
  expect(data.listHasMore).toBe(false)
  expect(data.isListLoading).toBe(false)
  expect(next).toHaveBeenCalledOnce()
})

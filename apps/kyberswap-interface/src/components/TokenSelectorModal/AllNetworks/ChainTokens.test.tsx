// @vitest-environment happy-dom
import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'

import { TokenSelectorTab } from 'components/TokenSelectorModal/constants'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import { ChainTokens } from './ChainTokens'
import { ChainSnapshot } from './types'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  account: 'wallet',
  configsLoading: false,
  metadata: {},
  prices: {},
  imports: [] as Token[],
  defaults: {},
  rows: {},
  tokenMetadata: new Map(),
  holdings: {},
}))
vi.mock('hooks/useTokens', () => ({
  useAllTokensWithLoading: () => ({ tokens: mocks.defaults, isLoading: false }),
  fetchListTokenByAddresses: mocks.fetch,
}))
vi.mock('state/user/hooks', () => ({
  useUserAddedTokens: () => mocks.imports,
  useUserFavoriteTokens: () => ({
    favoriteTokens: ['0x0000000000000000000000000000000000000001'],
    isLoading: mocks.configsLoading,
  }),
}))
vi.mock('state/wallet/WalletBalanceContext', () => ({ useEvmBalanceAccount: () => mocks.account }))
vi.mock('state/wallet/hooks', () => ({
  useNativeBalance: () => undefined,
  useTokenBalancesWithLoadingIndicator: () => [{}, false],
}))
vi.mock('state/walletInventory/hooks', () => ({
  useWalletInventory: (_chainId: number, enabled = true) => ({ active: enabled, rows: mocks.rows, loading: false }),
  useTokenMetadata: () => mocks.tokenMetadata,
  useInventoryTokenBalances: () => mocks.holdings,
}))
vi.mock('components/TokenSelectorModal/hooks/useLocalTokenMetrics', () => ({
  useLocalTokenMetrics: () => mocks.metadata,
}))
vi.mock('state/tokenPrices/hooks', () => ({ useTokenPrices: () => mocks.prices }))
vi.mock('hooks/useBalanceWait', () => ({ useBalanceWait: () => false }))
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const address = '0x0000000000000000000000000000000000000001'
const token = new Token(1, address, 18, 'AAA')
let root: ReturnType<typeof createRoot>
let client: QueryClient
const remote: Token[] = []
afterEach(async () => {
  await act(async () => root?.unmount())
  client?.clear()
  mocks.imports = []
  mocks.defaults = {}
  mocks.rows = {}
  mocks.holdings = {}
  vi.clearAllMocks()
})
const render = async (
  activeTab: TokenSelectorTab,
  onSnapshot: (session: string, chainId: number, snapshot: ChainSnapshot) => void,
) => {
  root = createRoot(document.createElement('div'))
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <ChainTokens
          chainId={1}
          activeTab={activeTab}
          session="wallet:all"
          catalogTokens={remote}
          onSnapshot={onSnapshot}
        />
      </QueryClientProvider>,
    ),
  )
}
it('publishes pending Favorites then resolves common/user membership through the shared resolver', async () => {
  let resolve!: (tokens: Token[]) => void
  mocks.fetch.mockReturnValue(
    new Promise<Token[]>(done => {
      resolve = done
    }),
  )
  const onSnapshot = vi.fn()
  await render(TokenSelectorTab.Favorites, onSnapshot)
  expect(onSnapshot.mock.lastCall?.[2].loading).toBe(true)
  expect(mocks.fetch).toHaveBeenCalledWith([address], 1)
  await act(async () => {
    resolve([token])
    await new Promise(done => setTimeout(done, 10))
  })
  expect(onSnapshot.mock.lastCall?.[2].currencies).toEqual([token])
  expect(onSnapshot.mock.lastCall?.[2].loading).toBe(false)
  expect(mocks.fetch).toHaveBeenCalledTimes(1)
})
it('ends loading on metadata failure without requiring error UI', async () => {
  mocks.fetch.mockRejectedValue(new Error('unavailable'))
  const onSnapshot = vi.fn()
  await render(TokenSelectorTab.Favorites, onSnapshot)
  await act(async () => {
    await new Promise(done => setTimeout(done, 10))
  })
  expect(onSnapshot.mock.lastCall?.[2].loading).toBe(false)
  expect(onSnapshot.mock.lastCall?.[2].currencies).toEqual([])
})

it('derives Favorites and import eligibility from late local metadata', async () => {
  const info = { chainId: 1, address, decimals: 18, symbol: 'AAA', name: 'AAA' }
  mocks.defaults = {}
  mocks.fetch.mockResolvedValue([])
  const onSnapshot = vi.fn()
  await render(TokenSelectorTab.Favorites, onSnapshot)
  await act(async () => {
    await new Promise(done => setTimeout(done, 10))
  })

  for (const isWhitelisted of [false, true, false]) {
    await act(async () => {
      mocks.defaults = { [address]: new WrappedTokenInfo({ ...info, isWhitelisted }) }
      root.render(
        <QueryClientProvider client={client}>
          <ChainTokens
            chainId={1}
            activeTab={TokenSelectorTab.Favorites}
            session="wallet:all"
            catalogTokens={remote}
            onSnapshot={onSnapshot}
          />
        </QueryClientProvider>,
      )
      await new Promise(done => setTimeout(done, 10))
    })
    const currency = onSnapshot.mock.lastCall?.[2].currencies[0]
    expect(currency.isWhitelisted).toBe(isWhitelisted)
  }
})

it('publishes an inventory holding before its token appears in any catalog page', async () => {
  mocks.rows = { [address]: { address, decimals: 18, symbol: 'AAA', rawBalance: 1000000000000000000n } }
  mocks.holdings = { [address]: CurrencyAmount.fromRawAmount(token, '1000000000000000000') }
  const onSnapshot = vi.fn()
  await render(TokenSelectorTab.All, onSnapshot)
  expect(onSnapshot.mock.lastCall?.[2].currencies.map((currency: Token) => currency.address)).toEqual([address])
  expect(onSnapshot.mock.lastCall?.[2].balances[`1-${address}`].unlisted).toBe(true)
  expect(onSnapshot.mock.lastCall?.[2].loading).toBe(false)
})

it.each([TokenSelectorTab.Imported, TokenSelectorTab.Favorites])(
  'preserves imported-token impersonation warnings in %s without adding discovery rows',
  async tab => {
    const listed = new WrappedTokenInfo({
      chainId: 1,
      address: '0x0000000000000000000000000000000000000002',
      decimals: 18,
      symbol: 'AAA',
      name: 'Listed AAA',
      isWhitelisted: true,
    })
    mocks.defaults = { [listed.address]: listed, [address]: token }
    mocks.imports = [token]
    mocks.rows = {
      [address]: { address, decimals: 18, symbol: 'AAA', rawBalance: 1n },
      [listed.address]: { address: listed.address, decimals: 18, symbol: 'AAA', rawBalance: 1n },
    }
    const onSnapshot = vi.fn()
    await render(tab, onSnapshot)
    await act(async () => {
      await new Promise(done => setTimeout(done, 10))
    })
    const snapshot = onSnapshot.mock.lastCall?.[2] as ChainSnapshot
    expect(snapshot.currencies).toEqual([token])
    expect(snapshot.balances[`1-${address}`].impersonator).toBe(true)
    expect(snapshot.loading).toBe(false)
  },
)

it('publishes only changed observations without dropping token metadata changes', async () => {
  const info = { chainId: 1, address, decimals: 18, symbol: 'AAA', name: 'AAA' }
  const onSnapshot = vi.fn()
  mocks.imports = [new WrappedTokenInfo(info)]
  mocks.holdings = { [address]: CurrencyAmount.fromRawAmount(token, '10') }
  await render(TokenSelectorTab.Imported, onSnapshot)
  const calls = onSnapshot.mock.calls.length
  const update = async () =>
    act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <ChainTokens
            chainId={1}
            activeTab={TokenSelectorTab.Imported}
            session="wallet:all"
            catalogTokens={remote}
            onSnapshot={onSnapshot}
          />
        </QueryClientProvider>,
      ),
    )
  mocks.imports = [new WrappedTokenInfo(info)]
  mocks.holdings = { [address]: CurrencyAmount.fromRawAmount(token, '10') }
  await update()
  expect(onSnapshot).toHaveBeenCalledTimes(calls)
  mocks.imports = [new WrappedTokenInfo({ ...info, permitVersion: '2' })]
  await update()
  expect(onSnapshot).toHaveBeenCalledTimes(calls + 1)
  expect(onSnapshot.mock.lastCall?.[2].currencies[0].permitVersion).toBe('2')
})

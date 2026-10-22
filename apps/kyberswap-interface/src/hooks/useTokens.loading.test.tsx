// @vitest-environment happy-dom
import { ChainId } from '@kyberswap/ks-sdk-core'
import { configureStore } from '@reduxjs/toolkit'
import { QueryClient, QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query'
import { type ReactNode, act } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { afterEach, expect, it, vi } from 'vitest'

import { useAllTokensWithLoading } from 'hooks/useTokens'
import lists from 'state/lists/reducer'

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), userTokens: [] }))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ chainId: 1 }) }))
vi.mock('components/Web3Provider', () => ({ wagmiConfig: {} }))
vi.mock('hooks/useContract', () => ({}))
vi.mock('state/multicall/hooks', () => ({ NEVER_RELOAD: {} }))
vi.mock('state/user/hooks', () => ({ useUserAddedTokens: () => mocks.userTokens }))
vi.mock('services/ksSetting', () => ({
  default: { useLazyGetTokenListQuery: () => [mocks.fetch] },
}))

const Probe = ({ chainId = ChainId.BASE }: { chainId?: ChainId }) => {
  const { tokens, isLoading } = useAllTokensWithLoading(false, chainId)
  return (
    <output>{`${isLoading}:${Object.values(tokens)
      .map(token => token.symbol)
      .join(',')}`}</output>
  )
}
let root: ReturnType<typeof createRoot>
let container: HTMLDivElement
let client: QueryClient
const createStore = () =>
  configureStore({ reducer: { lists }, middleware: getDefault => getDefault({ serializableCheck: false }) })
let store: ReturnType<typeof createStore>
const mount = async (children?: ReactNode) => {
  vi.useFakeTimers()
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  client = new QueryClient()
  store = createStore()
  container = document.createElement('div')
  root = createRoot(container)
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <Provider store={store}>
          {children ?? (
            <>
              <Probe />
              <Probe />
            </>
          )}
        </Provider>
      </QueryClientProvider>,
    )
  })
}
const advance = async (ms: number) => act(async () => vi.advanceTimersByTimeAsync(ms))
const values = () => [...container.querySelectorAll('output')].map(node => node.textContent)
afterEach(async () => {
  await act(async () => root?.unmount())
  client?.clear()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  onlineManager.setOnline(true)
  focusManager.setFocused(undefined)
  vi.clearAllMocks()
})

it('shares one list request and stays loading until the debounced token map is available', async () => {
  let resolve!: (result: unknown) => void
  mocks.fetch.mockReturnValue(new Promise(done => (resolve = done)))
  await mount()
  expect(values()).toEqual(['true:', 'true:'])
  expect(mocks.fetch).toHaveBeenCalledTimes(1)

  await act(async () => {
    resolve({
      data: {
        data: {
          tokens: [
            {
              chainId: ChainId.BASE,
              address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
              decimals: 18,
              symbol: 'DAI',
              name: 'Dai',
            },
          ],
          pagination: { totalItems: 1 },
        },
      },
    })
  })
  await advance(0)
  expect(values()).toEqual(['true:', 'true:'])
  await advance(300)
  expect(values()).toEqual(['false:DAI', 'false:DAI'])
  expect(mocks.fetch).toHaveBeenCalledTimes(1)
})

it.each(['empty', 'error'])('ends loading when the list response is %s', async result => {
  let resolve!: (result: unknown) => void
  mocks.fetch.mockReturnValue(new Promise(done => (resolve = done)))
  await mount()
  expect(values()).toEqual(['true:', 'true:'])
  await act(async () => {
    resolve(
      result === 'error'
        ? { error: { status: 500 } }
        : { data: { data: { tokens: [], pagination: { totalItems: 0 } } } },
    )
  })
  await advance(result === 'error' ? 3_500 : 300)
  expect(values()).toEqual(['false:', 'false:'])
  expect(mocks.fetch).toHaveBeenCalledTimes(result === 'error' ? 3 : 1)
})

const emptyList = { data: { data: { tokens: [], pagination: { totalItems: 0 } } } }
const daiList = {
  data: {
    data: {
      tokens: [
        {
          chainId: ChainId.BASE,
          address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
          decimals: 18,
          symbol: 'DAI',
          name: 'Dai',
        },
      ],
      pagination: { totalItems: 1 },
    },
  },
}
const renderConsumers = async (visible: boolean) =>
  act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <Provider store={store}>
          {visible ? (
            <>
              <Probe />
              <Probe />
            </>
          ) : null}
        </Provider>
      </QueryClientProvider>,
    )
  })

it('retries a transient failure once for all consumers and publishes the recovered list', async () => {
  mocks.fetch.mockResolvedValueOnce({ error: { status: 500 } }).mockResolvedValue(daiList)
  await mount()
  expect(values()).toEqual(['true:', 'true:'])
  await advance(1_500)
  expect(values()).toEqual(['false:DAI', 'false:DAI'])
  expect(mocks.fetch).toHaveBeenCalledTimes(2)
})

it('does not automatically retry a client error, but retries on remount', async () => {
  mocks.fetch.mockResolvedValue({ error: { status: 400 } })
  await mount()
  await advance(5_000)
  expect(values()).toEqual(['false:', 'false:'])
  expect(mocks.fetch).toHaveBeenCalledTimes(1)
  await renderConsumers(false)
  mocks.fetch.mockResolvedValue(daiList)
  await renderConsumers(true)
  await advance(300)
  expect(values()).toEqual(['false:DAI', 'false:DAI'])
  expect(mocks.fetch).toHaveBeenCalledTimes(2)
})

it('recovers on reconnect after exhausting retries, without refetching on window focus', async () => {
  mocks.fetch.mockResolvedValue({ error: { status: 500 } })
  await mount()
  await advance(3_500)
  expect(mocks.fetch).toHaveBeenCalledTimes(3)
  await act(async () => {
    focusManager.setFocused(false)
    focusManager.setFocused(true)
  })
  await advance(0)
  expect(mocks.fetch).toHaveBeenCalledTimes(3)
  mocks.fetch.mockResolvedValue(daiList)
  await act(async () => {
    onlineManager.setOnline(false)
    onlineManager.setOnline(true)
  })
  await advance(300)
  expect(values()).toEqual(['false:DAI', 'false:DAI'])
  expect(mocks.fetch).toHaveBeenCalledTimes(4)
})

it('caches an empty list briefly and fetches fresh pages after it becomes stale', async () => {
  mocks.fetch.mockResolvedValue(emptyList)
  await mount()
  await advance(300)
  await renderConsumers(false)
  await renderConsumers(true)
  expect(mocks.fetch).toHaveBeenCalledTimes(1)
  await advance(60_000)
  await renderConsumers(false)
  mocks.fetch.mockResolvedValue(daiList)
  await renderConsumers(true)
  await advance(300)
  expect(values()).toEqual(['false:DAI', 'false:DAI'])
  expect(mocks.fetch).toHaveBeenCalledTimes(2)
  expect(mocks.fetch.mock.calls.every(call => call[1] === false)).toBe(true)
})

it('retains a populated list on remount and reconnect even after query cache expires', async () => {
  mocks.fetch.mockResolvedValue(daiList)
  await mount()
  await advance(300)
  await renderConsumers(false)
  await advance(6 * 60_000)
  await renderConsumers(true)
  await act(async () => {
    onlineManager.setOnline(false)
    onlineManager.setOnline(true)
  })
  await advance(300)
  expect(values()).toEqual(['false:DAI', 'false:DAI'])
  expect(mocks.fetch).toHaveBeenCalledTimes(1)
})

it('never publishes a partial list when a later page is malformed', async () => {
  mocks.fetch.mockImplementation(({ page }) =>
    Promise.resolve(
      page === 1
        ? { data: { data: { ...daiList.data.data, pagination: { totalItems: 101 } } } }
        : { data: { data: {} } },
    ),
  )
  await mount()
  await advance(3_500)
  expect(values()).toEqual(['false:', 'false:'])
  expect(Object.keys(store.getState().lists.mapWhitelistTokens[ChainId.BASE])).toHaveLength(0)
  expect(mocks.fetch).toHaveBeenCalledTimes(6)
})

it('keeps a late response on its own chain after the consumer changes chain', async () => {
  let resolveBase!: (result: unknown) => void
  mocks.fetch.mockImplementation(({ chainId }) =>
    chainId === ChainId.BASE
      ? new Promise(resolve => {
          resolveBase = resolve
        })
      : Promise.resolve(emptyList),
  )
  await mount(<Probe />)
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <Provider store={store}>
          <Probe chainId={ChainId.MAINNET} />
        </Provider>
      </QueryClientProvider>,
    )
  })
  await advance(300)
  expect(values()).toEqual(['false:'])
  await act(async () => resolveBase(daiList))
  await advance(300)
  expect(values()).toEqual(['false:'])
  expect(Object.values(store.getState().lists.mapWhitelistTokens[ChainId.BASE]).map(token => token.symbol)).toEqual([
    'DAI',
  ])
  expect(Object.keys(store.getState().lists.mapWhitelistTokens[ChainId.MAINNET])).toHaveLength(0)
})

// @vitest-environment happy-dom
import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import useGetRoute from './useGetRoute'

const mocks = vi.hoisted(() => ({ trigger: vi.fn(), fee: vi.fn(), dispatch: vi.fn(), sources: '' }))
vi.mock('services/route', () => ({
  fetchRoute: (_dispatch: unknown, args: unknown) => mocks.trigger(args),
  AGGREGATOR_API_PATHS: { GET_ROUTE: '/routes' },
}))
vi.mock('services/route/enrichRouteResponse', () => ({ enrichRouteResponse: async (response: unknown) => response }))
vi.mock('components/SwapForm/hooks/useGetFeeConfig', () => ({ default: () => null }))
vi.mock('components/SwapForm/hooks/useGetSwapFeeConfig', () => ({ default: () => mocks.fee }))
vi.mock('components/SwapForm/hooks/useSelectedDexes', () => ({ default: () => mocks.sources }))
vi.mock('constants/env', () => ({ AGGREGATOR_API: 'https://example.test' }))
vi.mock('constants/index', () => ({ INPUT_DEBOUNCE_TIME: 100 }))
vi.mock('constants/networks', () => ({ NETWORKS_INFO: { 1: { aggregatorRoute: 'ethereum' } } }))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ chainId: 1 }) }))
vi.mock('hooks/useKyberSwapConfig', () => ({ useKyberswapGlobalConfig: () => ({}) }))
vi.mock('state/authen/hooks', () => ({ useSessionInfo: () => ({}) }))
vi.mock('state/lists/wrappedTokenInfo', () => ({ WrappedTokenInfo: class {} }))
vi.mock('utils/nativeErc20', () => ({
  routeAmountIn: (amount: CurrencyAmount<Token>) => amount.quotient.toString(),
  routeTokenAddress: (token: Token) => token.address,
  routeTokenDecimals: (token: Token) => token.decimals,
}))
vi.mock('utils/safeApp', () => ({ isInSafeApp: false, SAFE_APP_CLIENT_ID: 'safe' }))

const currencyIn = new Token(1, '0x0000000000000000000000000000000000000001', 18)
const currencyOut = new Token(1, '0x0000000000000000000000000000000000000002', 18)
const amounts = [1, 2].map(value => CurrencyAmount.fromRawAmount(currencyIn, String(value)))

vi.mock('state/hooks', () => ({ useAppDispatch: () => mocks.dispatch }))
const response = { code: 0, message: 'latest' }
const deferred = () => {
  let resolve!: (value?: typeof response) => void
  const promise = new Promise<typeof response | undefined>(done => (resolve = done))
  return { promise, resolve }
}
let root: ReturnType<typeof createRoot>
let queryClient: QueryClient
let state: ReturnType<typeof useGetRoute>
type Props = { index?: number; autoRefresh?: boolean; paused?: boolean; enabled?: boolean; clientId?: string }
const Harness = ({ index = 0, autoRefresh = false, paused = false, enabled = true, clientId }: Props) => {
  state = useGetRoute({
    currencyIn,
    currencyOut,
    parsedAmount: amounts[index],
    autoRefresh,
    isProcessingSwap: paused,
    enabled,
    clientId,
  })
  return null
}
const flush = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1)
  })
}
const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
  await flush()
}
const render = async (props: Props = {}) => {
  await act(async () =>
    root.render(
      <QueryClientProvider client={queryClient}>
        <Harness {...props} />
      </QueryClientProvider>,
    ),
  )
  await flush()
}
const resolve = async (pending: ReturnType<typeof deferred>, value = response) => {
  await act(async () => pending.resolve(value))
  await flush()
}
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers()
  mocks.trigger.mockReset().mockResolvedValue(response)
  mocks.fee.mockReset().mockResolvedValue(undefined)
  mocks.sources = ''
  queryClient = new QueryClient()
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  queryClient.clear()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('loads comparison quotes once, without polling, and supports explicit refresh', async () => {
  await render()
  await advance(20000)
  expect(mocks.trigger).toHaveBeenCalledOnce()
  await act(async () => state.fetcher())
  await flush()
  expect(mocks.trigger).toHaveBeenCalledTimes(2)
})
it('does not clear latest loading or publish an old response when requests finish out of order', async () => {
  const old = deferred(),
    latest = deferred()
  mocks.trigger.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
  await render({ autoRefresh: true })
  await render({ index: 1, autoRefresh: true })
  await advance(100)
  await resolve(old, { code: 0, message: 'old' })
  expect(state.result.data).toBeUndefined()
  expect(state.isLoading).toBe(true)
  await resolve(latest)
  expect(state.result.data).toEqual(response)
  expect(state.isLoading).toBe(false)
})
it('late fee lookup may finish but cannot replace the current query result', async () => {
  const oldFee = deferred()
  mocks.fee.mockReturnValueOnce(oldFee.promise)
  await render({ autoRefresh: true })
  await render({ index: 1, autoRefresh: true })
  await advance(100)
  mocks.trigger.mockResolvedValueOnce({ code: 0, message: 'old' })
  await act(async () => oldFee.resolve())
  await flush()
  expect(mocks.trigger.mock.calls.map(([request]) => request.params.amountIn)).toEqual(['2', '1'])
  expect(state.result.data).toEqual(response)
})
it('hides old data immediately and debounces rapidly changing input', async () => {
  await render({ autoRefresh: true })
  expect(state.result.data).toEqual(response)
  await render({ index: 1, autoRefresh: true })
  expect(state.result.data).toBeUndefined()
  await advance(50)
  expect(mocks.trigger).toHaveBeenCalledOnce()
  await advance(51)
  expect(mocks.trigger).toHaveBeenCalledTimes(2)
})
it('requests a new quote when returning to previously quoted inputs', async () => {
  await render()
  await render({ index: 1 })
  await advance(101)
  const fresh = deferred()
  mocks.trigger.mockReturnValueOnce(fresh.promise)
  await render({ index: 0 })
  expect(state.result.data).toBeUndefined()
  await advance(101)
  expect(mocks.trigger.mock.calls.map(([request]) => request.params.amountIn)).toEqual(['1', '2', '1'])
  expect(state.result.data).toBeUndefined()
  await resolve(fresh, { code: 0, message: 'fresh quote' })
  expect(state.result.data?.message).toBe('fresh quote')
})
it('keeps the quote during refetch and starts countdown after the request settles', async () => {
  await render({ autoRefresh: true })
  const next = deferred()
  mocks.trigger.mockReturnValueOnce(next.promise)
  await advance(10000)
  expect(mocks.trigger).toHaveBeenCalledTimes(2)
  expect(state.result.data).toEqual(response)
  expect(state.refresh.isRefreshing).toBe(true)
  await advance(20000)
  expect(mocks.trigger).toHaveBeenCalledTimes(2)
  await resolve(next)
  expect(state.refresh.isRefreshing).toBe(false)
  expect(state.refresh.countdown).toBeGreaterThan(9900)
  await advance(10000)
  expect(mocks.trigger).toHaveBeenCalledTimes(3)
})
it('throttles manual refresh and deduplicates repeated requests while fetching', async () => {
  await render({ autoRefresh: true })
  const pending = deferred()
  mocks.trigger.mockReturnValueOnce(pending.promise)
  await act(async () => {
    state.refresh.onRefresh()
    state.refresh.onRefresh()
    state.fetcher()
  })
  await flush()
  expect(mocks.trigger).toHaveBeenCalledTimes(2)
  await resolve(pending)
  await act(async () => state.refresh.onRefresh())
  await flush()
  expect(mocks.trigger).toHaveBeenCalledTimes(2)
  await advance(2000)
  await act(async () => state.refresh.onRefresh())
  await flush()
  expect(mocks.trigger).toHaveBeenCalledTimes(3)
})
it('pauses polling for review and fetches fresh data on close', async () => {
  await render({ autoRefresh: true })
  await render({ autoRefresh: true, paused: true })
  expect(state.result.data).toEqual(response)
  await advance(20000)
  expect(mocks.trigger).toHaveBeenCalledOnce()
  await render({ autoRefresh: true })
  expect(mocks.trigger).toHaveBeenCalledTimes(2)
})
it('restarts polling after cross-chain unmount and single-chain remount', async () => {
  await render({ autoRefresh: true })
  await act(async () => root.render(null))
  await advance(20000)
  expect(mocks.trigger).toHaveBeenCalledOnce()
  await render({ autoRefresh: true })
  expect(mocks.trigger).toHaveBeenCalledTimes(2)
  expect(state.refresh.countdown).toBeGreaterThan(9900)
  await advance(10000)
  expect(mocks.trigger).toHaveBeenCalledTimes(3)
})
it('ends loading on transport and fee errors, retrying at the next poll', async () => {
  mocks.fee.mockRejectedValueOnce(new Error('fee failed'))
  await render({ autoRefresh: true })
  expect(state.result.error).toEqual(new Error('fee failed'))
  expect(state.isLoading).toBe(false)
  mocks.trigger.mockRejectedValueOnce({ status: 500 })
  await advance(10000)
  expect(state.result.error).toEqual({ status: 500 })
  expect(state.isLoading).toBe(false)
  await advance(10000)
  expect(state.result.error).toBeNull()
  expect(state.result.data).toEqual(response)
})
it('includes sources and partner identity in the query key', async () => {
  const old = deferred()
  mocks.trigger.mockReturnValueOnce(old.promise)
  await render({ autoRefresh: true })
  mocks.sources = 'uniswap-v3'
  await render({ autoRefresh: true, clientId: 'partner' })
  await advance(100)
  expect(mocks.trigger.mock.calls[1][0]).toMatchObject({
    clientId: 'partner',
    params: { includedSources: 'uniswap-v3' },
  })
  await resolve(old, { code: 0, message: 'old' })
  expect(state.result.data).toEqual(response)
})

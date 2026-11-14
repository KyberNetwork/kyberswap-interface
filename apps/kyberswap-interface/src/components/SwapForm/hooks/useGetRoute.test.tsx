// @vitest-environment happy-dom
import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import {
  SingleChainSwapProvider,
  useSingleChainSwapContext,
} from 'components/SwapForm/SingleChain/SingleChainSwapProvider'
import type { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import useGetRoute from 'components/SwapForm/hooks/useGetRoute'

vi.mock('components/SwapForm/hooks/useRecipientAddress', () => ({
  useRecipientAddress: (value: string) => ({ address: value || undefined, loading: false, error: false }),
}))

const mocks = vi.hoisted(() => ({
  trigger: vi.fn(),
  fee: vi.fn(),
  dispatch: vi.fn(),
  sources: '',
  amount: '1',
  account: '0xsender',
  wrapType: 0,
  build: vi.fn(),
}))
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
vi.mock('constants/networks', () => ({ MAINNET_NETWORKS: [1], NETWORKS_INFO: { 1: { aggregatorRoute: 'ethereum' } } }))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ chainId: 1, account: mocks.account }) }))
vi.mock('hooks/useKyberSwapConfig', () => ({ useKyberswapGlobalConfig: () => ({}) }))
vi.mock('state/authen/hooks', () => ({ useSessionInfo: () => ({}) }))
vi.mock('state/lists/wrappedTokenInfo', () => ({ WrappedTokenInfo: class {} }))
vi.mock('utils/nativeErc20', () => ({
  routeAmountIn: (amount: CurrencyAmount<Token>) => amount.quotient.toString(),
  routeTokenAddress: (token: Token) => token.address,
  routeTokenDecimals: (token: Token) => token.decimals,
}))
vi.mock('utils/safeApp', () => ({ isInSafeApp: false, SAFE_APP_CLIENT_ID: 'safe' }))

vi.mock('components/SwapForm/hooks/useBuildRoute', () => ({
  default: (args: unknown) => {
    mocks.build(args)
    return async () => ({})
  },
}))
vi.mock('components/SwapForm/hooks/useSwapInputAmount', () => ({
  useSwapInputAmount: () => ({ typedValue: mocks.amount, onUserInput: vi.fn() }),
}))
vi.mock('components/SwapForm/hooks/useParsedAmount', () => ({
  default: (currency: Token, amount: string) => CurrencyAmount.fromRawAmount(currency, amount),
}))
vi.mock('hooks/useWrapCallback', () => ({
  default: () => ({ wrapType: mocks.wrapType }),
  WrapType: { NOT_APPLICABLE: 0 },
}))
vi.mock('services/route/utils', () => ({ parseGetRouteResponse: (data: unknown) => data }))

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
let swap: ReturnType<typeof useSingleChainSwapContext>
const SwapConsumer = () => {
  swap = useSingleChainSwapContext()
  return null
}
const renderSwap = async () => {
  await act(async () =>
    root.render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SingleChainSwapProvider
            currencyIn={currencyIn}
            currencyOut={currencyOut}
            balanceIn={undefined}
            balanceOut={undefined}
            isDegenMode={false}
            slippage={50}
            transactionTimeout={1200}
          >
            <SwapConsumer />
          </SingleChainSwapProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  )
  await flush()
}
const builtRoute = { data: { data: '0x1234', routerAddress: '0xrouter' } } as BuildRouteResult
const firstRoute = { parsedAmountIn: amounts[0] }
const firstRouteResponse = { code: 0, data: { routeSummary: firstRoute } }
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
  mocks.amount = '1'
  mocks.account = '0xsender'
  mocks.wrapType = 0
  mocks.build.mockClear()
  queryClient = new QueryClient()
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  queryClient.clear()
  onlineManager.setOnline(true)
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

// Exercise the real provider/query/review owners together; form and panel are independent subscribers.
it('shares a single quote across panels, pauses for review and isolates input changes', async () => {
  let form!: ReturnType<typeof useSingleChainSwapContext>
  let panel!: ReturnType<typeof useSingleChainSwapContext>
  const Form = () => {
    form = useSingleChainSwapContext()
    return null
  }
  const Panel = () => {
    panel = useSingleChainSwapContext()
    return null
  }
  const renderPanels = async (showForm = true) => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <SingleChainSwapProvider
              currencyIn={currencyIn}
              currencyOut={currencyOut}
              balanceIn={undefined}
              balanceOut={undefined}
              isDegenMode={false}
              slippage={50}
              transactionTimeout={1200}
            >
              {showForm && <Form />}
              <Panel />
            </SingleChainSwapProvider>
          </MemoryRouter>
        </QueryClientProvider>,
      ),
    )
    await flush()
  }
  const firstQuote = { parsedAmountIn: amounts[0] }
  mocks.trigger.mockResolvedValue({ code: 0, data: { routeSummary: firstQuote } })
  await renderPanels()
  expect(mocks.trigger).toHaveBeenCalledOnce()
  expect(form.routeSummary).toBe(panel.routeSummary)
  expect(panel.routeSummary).toEqual(firstQuote)

  // Opening and closing without Submit preserves this fresh quote and makes no GET.
  await act(async () => form.openReview(form.buildRoute))
  await act(async () => form.dismissReview())
  await flush()
  expect(mocks.trigger).toHaveBeenCalledOnce()
  expect(form.routeSummary).toBe(panel.routeSummary)
  expect(panel.routeSummary).toEqual(firstQuote)
  expect(form.routeLoading).toBe(false)

  await act(async () => form.openReview(form.buildRoute))
  await advance(20000)
  expect(mocks.trigger).toHaveBeenCalledOnce()
  expect(panel.review.phase).toBe('review')
  await act(async () => form.dismissReview())
  await flush()
  expect(mocks.trigger).toHaveBeenCalledTimes(2)

  mocks.amount = '2'
  const pending = deferred()
  mocks.trigger.mockReturnValueOnce(pending.promise)
  await renderPanels()
  expect(form.routeSummary).toBeUndefined()
  expect(panel.routeSummary).toBeUndefined()
  expect(form.routeLoading).toBe(true)
  expect(panel.routeLoading).toBe(true)
  await advance(101)
  const nextQuote = { code: 0, message: 'next', data: { routeSummary: { parsedAmountIn: amounts[1] } } }
  await resolve(pending, nextQuote)
  expect(form.routeSummary).toBe(panel.routeSummary)
  expect(panel.routeSummary?.parsedAmountIn).toEqual(amounts[1])

  // A settings/lazy form subtree cannot stop polling for the still-mounted route panel.
  await renderPanels(false)
  await advance(10000)
  expect(mocks.trigger).toHaveBeenCalledTimes(4)
})

it('shares the effective recipient with build and review, preserving custom input across collapse and wallet changes', async () => {
  mocks.trigger.mockResolvedValue({ code: 0, data: { routeSummary: { parsedAmountIn: amounts[0] } } })
  let form!: ReturnType<typeof useSingleChainSwapContext>
  const Form = () => {
    form = useSingleChainSwapContext()
    return null
  }
  const renderForm = (advanced = true) =>
    act(async () =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <SingleChainSwapProvider
              currencyIn={currencyIn}
              currencyOut={currencyOut}
              balanceIn={undefined}
              balanceOut={undefined}
              isDegenMode={advanced}
              slippage={50}
              transactionTimeout={1200}
            >
              <Form />
            </SingleChainSwapProvider>
          </MemoryRouter>
        </QueryClientProvider>,
      ),
    )
  await renderForm()
  await flush()
  expect(form.recipient).toBe('0xsender')
  await act(async () => form.toggleRecipient())
  await act(async () => form.onRecipientChange('0xcustom'))
  await act(async () => form.openReview(form.buildRoute))
  expect(form.review.phase).toBe('review')
  await act(async () => form.toggleRecipient())
  expect(form.recipient).toBe('0xcustom')
  expect(form.review.phase).toBe('review')
  mocks.account = '0xchanged'
  await renderForm()
  expect(form.recipient).toBe('0xcustom')
  expect(mocks.build).toHaveBeenLastCalledWith(expect.objectContaining({ recipient: '0xcustom' }))
  expect(form.review.phase).toBe('closed')
  await renderForm(false)
  expect(form.recipient).toBe('0xcustom')
  await renderForm()
  expect(form.recipient).toBe('0xcustom')
  mocks.wrapType = 1
  await renderForm()
  expect(form.recipient).toBe('0xchanged')
  mocks.wrapType = 0
  await renderForm()
  expect(form.recipient).toBe('0xcustom')
  await act(async () => form.onRecipientChange(''))
  expect(mocks.build).toHaveBeenLastCalledWith(expect.objectContaining({ recipient: '0xchanged' }))
  await act(async () => form.selectWalletRecipient())
  expect(form.recipient).toBe('0xchanged')
  expect(mocks.build).toHaveBeenLastCalledWith(expect.objectContaining({ recipient: '0xchanged' }))
})

it.each(['success', 'rejection', 'late success', 'late rejection'])(
  'invalidates on submit, stays paused, then refetches on dismissal (%s)',
  async outcome => {
    const late = outcome.startsWith('late')
    const rejected = outcome.endsWith('rejection')
    mocks.trigger.mockResolvedValue(firstRouteResponse)
    await renderSwap()
    const build = vi.fn(async () => builtRoute)
    await act(async () => swap.openReview(build))
    const onError = vi.fn()
    const wallet = deferred()
    const submit = vi.fn(async (onRequestSignature: () => void) => {
      // Check the boundary inside the submit callback, before the wallet is invoked.
      expect(queryClient.getQueryCache().getAll()[0].state.isInvalidated).toBe(true)
      expect(mocks.trigger).toHaveBeenCalledOnce()
      onRequestSignature()
      await wallet.promise
      if (rejected) throw new Error('User rejected')
      return '0xhash'
    })
    const fresh = deferred()
    mocks.trigger.mockReturnValueOnce(fresh.promise)
    let submitting!: Promise<void>
    await act(async () => {
      submitting = swap.confirmReview(submit, onError)
    })
    await flush()
    // Submit invalidates immediately, but the GET waits for dismissal.
    expect(queryClient.getQueryCache().getAll()[0].state.isInvalidated).toBe(true)
    await act(async () => swap.refresh.onRefresh())
    await advance(20000)
    expect(mocks.trigger).toHaveBeenCalledTimes(1)
    expect(swap.review.phase).toBe('signing')
    expect(swap.review.buildResult).toBe(builtRoute)
    expect(swap.routeSummary).toEqual(firstRoute)
    await act(async () => swap.confirmReview(submit, onError))
    expect(submit).toHaveBeenCalledOnce()
    expect(mocks.trigger).toHaveBeenCalledTimes(1)

    if (!late) {
      await act(async () => {
        wallet.resolve()
        await submitting
      })
      expect(swap.review.phase).toBe(rejected ? 'error' : 'submitted')
      expect(onError).toHaveBeenCalledTimes(rejected ? 1 : 0)
    }
    expect(swap.routeSummary).toEqual(firstRoute)
    await act(async () => {
      swap.dismissReview()
    })
    await flush()
    expect(mocks.trigger).toHaveBeenCalledTimes(2)
    expect(swap.routeSummary).toEqual(firstRoute)
    expect(swap.routeLoading).toBe(true)
    expect(swap.isGettingRoute).toBe(true)
    expect(build).toHaveBeenCalledOnce()
    expect(swap.review.phase).toBe('closed')

    const secondQuote = { parsedAmountIn: amounts[0], amountOut: '2' }
    const freshResponse = { code: 0, message: 'fresh', data: { routeSummary: secondQuote } }
    await resolve(fresh, freshResponse)
    expect(swap.routeSummary).toEqual(secondQuote)
    expect(swap.routeLoading).toBe(false)
    expect(queryClient.getQueryCache().getAll()[0].state.isInvalidated).toBe(false)
    await act(async () => swap.openReview(build))
    expect(build).toHaveBeenCalledTimes(2)
    if (late) {
      await act(async () => {
        wallet.resolve()
        await submitting
      })
      expect(swap.review.phase).toBe('review')
      expect(swap.review.txHash).toBeUndefined()
      expect(swap.review.error).toBeUndefined()
    }
    expect(queryClient.getQueryCache().getAll()[0].state.isInvalidated).toBe(false)
    expect(mocks.trigger).toHaveBeenCalledTimes(2)
  },
)

it('cancels pre-submit GETs and keeps the query invalidated when replacement fails', async () => {
  await render({ autoRefresh: true })
  const old = deferred()
  mocks.trigger.mockReturnValueOnce(old.promise)
  await advance(10000)
  await render({ autoRefresh: true, paused: true })
  await act(async () => state.invalidateQuote())
  expect(state.result.data).toEqual(response)
  expect(mocks.trigger).toHaveBeenCalledTimes(2)
  mocks.trigger.mockRejectedValueOnce(new Error('Replacement failed'))
  await render({ autoRefresh: true })
  expect(mocks.trigger).toHaveBeenCalledTimes(3)
  expect(queryClient.getQueryCache().getAll()[0].state.isInvalidated).toBe(true)
  expect(state.result.error).toEqual(new Error('Replacement failed'))
  await resolve(old, { code: 0, message: 'late pre-close response' })
  expect(state.result.data).toEqual(response)
  expect(state.result.error).toEqual(new Error('Replacement failed'))
  const fresh = deferred()
  mocks.trigger.mockReturnValueOnce(fresh.promise)
  await advance(10000)
  expect(state.isLoading).toBe(true)
  await resolve(fresh, { code: 0, message: 'replacement' })
  expect(state.result.data?.message).toBe('replacement')
})

it('preserves the cache and original expiry when review closes without Submit', async () => {
  mocks.trigger.mockResolvedValue(firstRouteResponse)
  await renderSwap()
  await advance(4000)
  await act(async () => swap.openReview(async () => builtRoute))
  await advance(2000)
  await act(async () => swap.dismissReview())
  await flush()
  expect(queryClient.getQueryCache().getAll()[0].state.isInvalidated).toBe(false)
  expect(swap.routeSummary).toEqual(firstRoute)
  expect(swap.routeLoading).toBe(false)
  expect(mocks.trigger).toHaveBeenCalledOnce()
  expect(swap.refresh.countdown).toBeGreaterThan(3900)
  expect(swap.refresh.countdown).toBeLessThanOrEqual(4000)
  await advance(4000)
  expect(mocks.trigger).toHaveBeenCalledTimes(2)
})

it.each(['success', 'failure'])(
  'keeps loading while offline after submit and resumes on reconnect (%s)',
  async outcome => {
    mocks.trigger.mockResolvedValue(firstRouteResponse)
    await renderSwap()
    await act(async () => swap.openReview(async () => builtRoute))
    await act(async () => swap.confirmReview(async () => '0xhash', vi.fn()))
    await act(async () => {
      onlineManager.setOnline(false)
      swap.dismissReview()
    })
    await flush()
    expect(queryClient.getQueryCache().getAll()[0].state.fetchStatus).toBe('paused')
    expect(swap.routeSummary).toEqual(firstRoute)
    expect(swap.isGettingRoute).toBe(true)
    expect(swap.refresh.isRefreshing).toBe(true)
    expect(swap.refresh.countdown).toBe(0)
    await act(async () => swap.refresh.onRefresh())
    await advance(20000)
    expect(swap.routeLoading).toBe(true)
    expect(mocks.trigger).toHaveBeenCalledOnce()

    const replacement = deferred()
    mocks.trigger.mockImplementationOnce(async () => {
      await replacement.promise
      if (outcome === 'failure') throw new Error('Replacement failed')
      return { code: 0, data: { routeSummary: { ...firstRoute, amountOut: '2' } } }
    })
    await act(async () => onlineManager.setOnline(true))
    await flush()
    expect(mocks.trigger).toHaveBeenCalledTimes(2)
    expect(swap.routeLoading).toBe(true)
    await resolve(replacement)
    expect(swap.routeLoading).toBe(false)
    if (outcome === 'success') {
      expect(swap.routeSummary).toEqual({ ...firstRoute, amountOut: '2' })
      expect(queryClient.getQueryCache().getAll()[0].state.isInvalidated).toBe(false)
    } else {
      // Retained query data is not an actionable route after a failed replacement.
      expect(swap.routeSummary).toBeUndefined()
      expect(queryClient.getQueryCache().getAll()[0].state.isInvalidated).toBe(true)
    }
  },
)

// @vitest-environment happy-dom
import { StrictMode, act } from 'react'
import { createRoot } from 'react-dom/client'
import type { getQuotes } from 'services/crossChain/quote/adapterQuotes'
import type { Quote } from 'services/crossChain/registry'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCrossChainQuote } from 'components/SwapForm/CrossChain/hooks/useCrossChainQuote'

const mocks = vi.hoisted(() => ({
  wallets: undefined as any,
  connection: {},
  checkSameAsset: vi.fn(),
  getQuotes: vi.fn(),
  tokenInUsd: 1,
  outputUsd: 100,
  slippage: 50,
  state: { crossChainSwap: { excludedSources: ['Relay'], quoteMode: 'direct' } },
}))
vi.mock('components/SwapWallets/SwapWalletContext', () => ({ useSwapWallets: () => mocks.wallets }))
vi.mock('@solana/wallet-adapter-react', () => ({
  useConnection: () => ({ connection: mocks.connection }),
  useWallet: () => ({}),
}))
vi.mock('components/Web3Provider/BitcoinProvider', () => ({ useBitcoinWallet: () => ({}) }))
vi.mock('hooks/useGatedWalletClient', () => ({ useGatedWalletClient: () => ({}) }))
vi.mock('hooks/useTracking', () => ({ default: () => ({ trackingHandler: vi.fn() }), TRACKING_EVENT_TYPE: {} }))
vi.mock('services/tokenCatalog', () => ({ useLazyCheckSameAssetQuery: () => [mocks.checkSameAsset] }))
vi.mock('state/hooks', () => ({
  useAppSelector: (select: (state: typeof mocks.state) => unknown) => select(mocks.state),
}))
vi.mock('state/user/hooks', () => ({ useUserSlippageTolerance: () => [mocks.slippage] }))
vi.mock('services/crossChain/factory', () => ({ registry: {} }))
vi.mock('services/crossChain/adapters/RelayAdapter/relaySolanaWallet', () => ({ adaptRelaySolanaWallet: vi.fn() }))
vi.mock('services/crossChain/quote/adapterQuotes', () => ({ getQuotes: mocks.getQuotes }))
vi.mock('services/crossChain/quote/getPairInfo', () => ({
  getPairInfo: async () => ({ category: 'stablePair', feeBps: 10, tokenInUsd: mocks.tokenInUsd, tokenOutUsd: 1 }),
}))

type Props = Parameters<typeof useCrossChainQuote>[0]
type QuoteRequest = Parameters<typeof getQuotes>[0]
const pair = {
  pairKey: '1:USDC-8453:USDC',
  fromChainId: 1,
  toChainId: 8453,
  currencyIn: { decimals: 6, symbol: 'USDC' },
  currencyOut: { decimals: 6, symbol: 'USDC', isNative: false, wrapped: { address: '0xout', decimals: 6 } },
  nearTokens: [],
} as unknown as Props['pair']

let state: ReturnType<typeof useCrossChainQuote>
let root: ReturnType<typeof createRoot>
const render = (amount: string, receiver = 'recipient', enabled = true) => {
  root.render(
    <Harness enabled={enabled} pair={pair} amount={amount} sender="sender" receiver={receiver} isReadOnly={false} />,
  )
}
const Harness = (props: Props) => {
  state = useCrossChainQuote(props)
  return null
}

const makeQuote = (request: QuoteRequest, provider = 'KyberCross', includeGas = !!request.params.gasDrop): Quote =>
  ({
    adapter: { getName: () => provider },
    isReadOnly: request.isReadOnly,
    quote: {
      quoteParams: request.params,
      quoteId: `${provider}-${request.params.gasDrop}`,
      quoteToken: `token-${request.params.gasDrop}`,
      gasDrop: includeGas ? { amount: '100', minAmount: '90', inputToken: '0xgas' } : undefined,
      priceImpact: 0,
      outputAmount: request.params.gasDrop ? 98n : 100n,
      outputUsd: mocks.outputUsd,
    },
  } as Quote)

const requests = () => mocks.getQuotes.mock.calls.map(([request]) => request as QuoteRequest)

const flushQuotes = () => act(async () => vi.advanceTimersByTimeAsync(500))
const enableGas = async () => {
  await act(async () => state.setGasDropEnabled(true))
  await flushQuotes()
}

describe('Gas Drop route selection', () => {
  it.each(['debounce', 'pending stream'])(
    'keeps confirmed Gas Drop through consecutive eligible edits during %s',
    async phase => {
      mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
      await act(async () => render('100'))
      await flushQuotes()
      await enableGas()
      mocks.getQuotes.mockImplementation(() => new Promise<void>(() => undefined))

      await act(async () => render('200'))
      await act(async () => vi.advanceTimersByTimeAsync(phase === 'debounce' ? 100 : 500))
      expect(state.gasDropEnabled).toBe(true)
      expect(state.selectedQuote).toBeNull()
      const pendingRequests = requests().slice(2)

      await act(async () => render('2000'))
      expect(state.gasDropEnabled).toBe(true)
      expect(state.selectedQuote).toBeNull()
      expect(pendingRequests.every(request => request.signal.aborted)).toBe(true)
      mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
      await flushQuotes()
      expect(state.selectedQuote?.quote.quoteParams).toMatchObject({ amount: '2000000000', gasDrop: true })
      expect(
        requests()
          .slice(-2)
          .map(request => [request.params.gasDrop, request.excludedSources]),
      ).toEqual([
        [false, ['Relay', 'KyberCross']],
        [true, ['Relay']],
      ])
    },
  )

  it('clears carried KyberCross evidence when the new stream finishes without that route', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('100'))
    await flushQuotes()
    await enableGas()
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request, 'Mayan')]))
    await act(async () => render('200'))
    await flushQuotes()
    expect(state.gasDropEnabled).toBe(true)

    await act(async () => render('2000'))
    expect(state.gasDropEnabled).toBe(false)
    await flushQuotes()
    expect(requests().at(-1)?.params.gasDrop).toBe(false)
  })

  it.each([
    { edit: 'amount', provider: 'KyberCross', includeGas: true, carry: true },
    { edit: 'slippage', provider: 'KyberCross', includeGas: true, carry: true },
    { edit: 'amount', provider: 'Mayan', includeGas: true, carry: false },
    { edit: 'slippage', provider: 'Mayan', includeGas: true, carry: false },
    { edit: 'amount', provider: 'KyberCross', includeGas: false, carry: false },
    { edit: 'slippage', provider: 'KyberCross', includeGas: false, carry: false },
  ])(
    'requires an existing KyberCross Gas Drop route on $edit edits: $provider/$includeGas',
    async ({ edit, provider, includeGas, carry }) => {
      mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
        request.onQuotes([
          makeQuote(request, request.params.gasDrop ? provider : 'KyberCross', request.params.gasDrop && includeGas),
        ])
        return request.params.gasDrop ? new Promise<void>(() => undefined) : Promise.resolve()
      })
      await act(async () => render('100'))
      await flushQuotes()
      await enableGas()
      expect(state.gasDropEnabled).toBe(true)

      if (edit === 'slippage') mocks.slippage = 100
      await act(async () => render(edit === 'amount' ? '50' : '100'))
      await flushQuotes()
      expect(state.gasDropEnabled).toBe(carry)
      expect(
        requests()
          .slice(2)
          .map(request => [request.params.gasDrop, request.excludedSources]),
      ).toEqual(
        carry
          ? [
              [false, ['Relay', 'KyberCross']],
              [true, ['Relay']],
            ]
          : [[false, ['Relay']]],
      )
    },
  )

  it('quotes Gas Drop directly after eligible amount and slippage edits', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('100'))
    await flushQuotes()
    await enableGas()
    const oldGas = requests()[1]
    await act(async () => render('50'))
    expect(state.selectedQuote).toBeNull()
    expect(oldGas.signal.aborted).toBe(true)
    await flushQuotes()
    mocks.slippage = 100
    await act(async () => render('50'))
    await flushQuotes()
    expect(requests().map(request => request.params.gasDrop)).toEqual([false, true, false, true, false, true])
    expect(requests()[2].excludedSources).toEqual(['Relay', 'KyberCross'])
    expect(requests()[4].excludedSources).toEqual(['Relay', 'KyberCross'])
    expect(state.selectedQuote?.quote.quoteParams).toMatchObject({ amount: '50000000', slippage: 100, gasDrop: true })
  })

  it.each(['amount', 'slippage'])(
    'loads alternatives on a Gas Drop %s edit and full ordinary quotes on disable',
    async edit => {
      mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => {
        const providers = request.params.gasDrop ? ['KyberCross'] : ['KyberCross', 'Mayan']
        request.onQuotes(
          providers
            .filter(provider => !request.excludedSources.includes(provider))
            .map(provider => makeQuote(request, provider)),
        )
      })
      await act(async () => render('100'))
      await flushQuotes()
      await enableGas()
      const amount = edit === 'amount' ? '50' : '100'
      if (edit === 'slippage') mocks.slippage = 100
      await act(async () => render(amount))
      await flushQuotes()

      expect(
        requests()
          .slice(2)
          .map(request => [request.params.gasDrop, request.excludedSources]),
      ).toEqual([
        [false, ['Relay', 'KyberCross']],
        [true, ['Relay']],
      ])
      expect(state.routeOptions.map(({ adapter, quote }) => [adapter.getName(), quote.quoteParams.gasDrop])).toEqual([
        ['KyberCross', true],
        ['Mayan', false],
      ])

      await act(async () => state.setGasDropEnabled(false))
      await flushQuotes()
      expect(requests()).toHaveLength(5)
      expect(requests()[4]).toMatchObject({ params: { gasDrop: false }, excludedSources: ['Relay'] })
      expect(state.routeOptions.map(({ adapter }) => adapter.getName())).toEqual(['KyberCross', 'Mayan'])
    },
  )

  it.each(['2.2', '2', '0', ''])('resets Gas Drop when amount %s no longer exceeds the threshold', async amount => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('100'))
    await flushQuotes()
    await enableGas()
    await act(async () => render(amount))
    expect(state.gasDropEnabled).toBe(false)
    await flushQuotes()
    expect(requests().slice(2)).toHaveLength(amount === '0' || amount === '' ? 0 : 1)
    expect(
      requests()
        .slice(2)
        .every(request => !request.excludedSources.includes('KyberCross')),
    ).toBe(true)
    await act(async () => render('100'))
    await flushQuotes()
    expect(state.gasDropEnabled).toBe(false)
    expect(
      requests()
        .slice(2)
        .every(request => !request.params.gasDrop),
    ).toBe(true)
  })

  it.each(['amount', 'slippage'])(
    'uses ordinary KyberCross output regardless of lower Gas Drop output on a %s edit',
    async edit => {
      mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
      await act(async () => render('100'))
      await flushQuotes()
      mocks.outputUsd = edit === 'amount' ? 5 : 2.2
      await enableGas()
      expect(state.gasDropEnabled).toBe(true)

      if (edit === 'slippage') mocks.slippage = 100
      await act(async () => render(edit === 'amount' ? '44' : '100'))
      await flushQuotes()
      expect(state.gasDropEnabled).toBe(true)
      expect(
        requests()
          .slice(2)
          .map(request => [request.params.gasDrop, request.excludedSources]),
      ).toEqual([
        [false, ['Relay', 'KyberCross']],
        [true, ['Relay']],
      ])
    },
  )

  it.each(['amount', 'slippage'])(
    'updates the estimate from non-KyberCross ordinary quotes after a %s edit',
    async edit => {
      mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => {
        const alternative = !request.params.gasDrop && request.excludedSources.includes('KyberCross')
        const quote = makeQuote(request, alternative ? 'Mayan' : 'KyberCross')
        quote.quote.outputUsd = alternative ? 3 : 100
        request.onQuotes([quote])
      })
      await act(async () => render('100'))
      await flushQuotes()
      await enableGas()

      const amount = edit === 'amount' ? '50' : '100'
      if (edit === 'slippage') mocks.slippage = 100
      await act(async () => render(amount))
      await flushQuotes()
      expect(state.gasDropEnabled).toBe(true)
      expect(
        requests()
          .slice(2)
          .map(request => [request.params.gasDrop, request.excludedSources]),
      ).toEqual([
        [false, ['Relay', 'KyberCross']],
        [true, ['Relay']],
      ])
      expect(state.routeOptions.some(({ adapter }) => adapter.getName() === 'Mayan')).toBe(true)

      // Latest ordinary quote is Mayan: $3 * 1/2 = $1.5, despite the Gas Drop output still being $100.
      await act(async () => render(String(Number(amount) / 2)))
      await flushQuotes()
      expect(state.gasDropEnabled).toBe(false)
      expect(requests()).toHaveLength(5)
      expect(requests()[4]).toMatchObject({ params: { gasDrop: false }, excludedSources: ['Relay'] })
    },
  )

  it('falls back to a new ordinary quote when carried Gas Drop is unavailable', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('100'))
    await flushQuotes()
    await enableGas()
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) =>
      request.onQuotes(request.params.gasDrop ? [] : [makeQuote(request)]),
    )
    await act(async () => render('50'))
    await flushQuotes()
    await flushQuotes()
    expect(requests().map(request => request.params.gasDrop)).toEqual([false, true, false, true, false])
    expect(requests().at(-1)?.excludedSources).toEqual(['Relay'])
    expect(state.selectedQuote?.quote.quoteParams).toMatchObject({ amount: '50000000', gasDrop: false })
  })

  it('hides ordinary providers as their Gas Drop routes arrive and restores them when disabled', async () => {
    mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
      if (request.params.gasDrop) return new Promise(() => undefined)
      request.onQuotes([makeQuote(request), makeQuote(request, 'Relay'), makeQuote(request, 'Mayan')])
      return Promise.resolve()
    })
    await act(async () => render('100'))
    await flushQuotes()
    const ordinary = state.quotes
    await enableGas()
    expect(state.routeOptions).toHaveLength(3)
    expect(state.routeOptions).toEqual(expect.arrayContaining(ordinary))

    const gas = requests()[1]
    const kyberGas = makeQuote(gas)
    await act(async () => gas.onQuotes([kyberGas]))
    expect(state.routeOptions).toHaveLength(3)
    expect(state.routeOptions[0]).toBe(kyberGas)
    expect(state.routeOptions).toEqual(expect.arrayContaining([kyberGas, ordinary[1], ordinary[2]]))

    const relayGas = makeQuote(gas, 'Relay')
    await act(async () => gas.onQuotes([kyberGas, relayGas]))
    expect(state.routeOptions).toHaveLength(3)
    expect(state.routeOptions.slice(0, 2)).toEqual(expect.arrayContaining([kyberGas, relayGas]))
    expect(state.routeOptions[2]).toBe(ordinary[2])

    await act(async () => state.setGasDropEnabled(false))
    expect(state.routeOptions).toEqual(ordinary)
  })

  it.each([false, true])(
    'retains both pools across mode switches (ordinary completed in background: %s)',
    async completed => {
      const finish: Array<() => void> = []
      mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
        request.onQuotes([makeQuote(request)])
        request.onQuoteReady()
        return new Promise<void>(resolve => finish.push(resolve))
      })
      await act(async () => render('100'))
      await flushQuotes()
      const ordinary = requests()[0]
      const first = state.selectedQuote as Quote
      await enableGas()
      const gas = requests()[1]
      const gasQuote = state.selectedQuote
      expect(ordinary.signal.aborted).toBe(false)
      const later = makeQuote(ordinary, 'Relay')
      await act(async () => {
        ordinary.onQuotes([first, later])
        if (completed) finish[0]()
      })
      expect(state.selectedQuote).toBe(gasQuote)
      expect(state.routeOptions).toContain(later)
      await act(async () => vi.advanceTimersByTimeAsync(10_000))
      await act(async () => state.selectRoute(later))
      expect(state.selectedQuote).toBe(later)
      expect(state.loading).toBe(false)
      expect(state.allLoading).toBe(!completed)
      expect(gas.signal.aborted).toBe(false)
      if (!completed) await act(async () => finish[0]())
      expect(state.refresh.countdown).toBe(completed ? 50_000 : 60_000)
      await act(async () => state.setGasDropEnabled(true))
      expect(state.selectedQuote).toBe(gasQuote)
      await act(async () => finish[1]())
      await act(async () => state.selectRoute(later))
      expect(requests()).toHaveLength(2)
      await act(async () => vi.advanceTimersByTimeAsync(completed ? 50_000 : 60_000))
      expect(requests().map(request => request.params.gasDrop)).toEqual([false, true, false])
    },
  )

  it('falls back to the ongoing ordinary stream without a replacement request', async () => {
    mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
      if (request.params.gasDrop) return Promise.resolve()
      request.onQuotes([makeQuote(request)])
      request.onQuoteReady()
      return new Promise(() => undefined)
    })
    await act(async () => render('100'))
    await flushQuotes()
    const ordinary = state.selectedQuote
    await enableGas()
    expect(state.gasDropEnabled).toBe(false)
    expect(state.selectedQuote).toBe(ordinary)
    expect(state.loading).toBe(false)
    expect(state.allLoading).toBe(true)
    await flushQuotes()
    expect(requests()).toHaveLength(2)
  })

  it.each(['input', 'unmount'])('cancels both pools on %s and ignores late results', async action => {
    mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
      request.onQuotes([makeQuote(request)])
      request.onQuoteReady()
      return new Promise(() => undefined)
    })
    await act(async () => render('100'))
    await flushQuotes()
    await enableGas()
    const previous = requests()
    if (action === 'input') await act(async () => render('200'))
    else await act(async () => root.unmount())
    expect(previous.every(request => request.signal.aborted)).toBe(true)
    await act(async () => previous.forEach(request => request.onQuotes([makeQuote(request)])))
    if (action === 'input') {
      expect(state.quotes).toEqual([])
      expect(state.routeOptions).toEqual([])
      await flushQuotes()
      expect(state.selectedQuote?.quote.quoteParams.amount).toBe('200000000')
    }
  })

  it.each([false, true])('expires 60 seconds after the response ends (Gas Drop: %s)', async gasDrop => {
    let finish!: () => void
    mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
      if (!!request.params.gasDrop === gasDrop) return new Promise<void>(resolve => (finish = resolve))
      request.onQuotes([makeQuote(request)])
      return Promise.resolve()
    })
    await act(async () => render('100'))
    expect(state.refresh.isRefreshing).toBe(false)
    await flushQuotes()
    if (gasDrop) await enableGas()
    expect(state.refresh.isRefreshing).toBe(true)
    const request = requests().at(-1) as QuoteRequest
    const requestCount = requests().length
    await act(async () => vi.advanceTimersByTimeAsync(10_000))
    await act(async () => {
      request.onQuotes([makeQuote(request)])
      request.onQuoteReady()
    })
    expect(state.loading).toBe(false)
    expect(state.refresh.isRefreshing).toBe(true)
    await act(async () => vi.advanceTimersByTimeAsync(5_000))
    await act(async () => finish())
    expect(state.refresh.isRefreshing).toBe(false)
    expect(state.refresh.countdown).toBe(60_000)
    await act(async () => vi.advanceTimersByTimeAsync(59_999))
    expect(requests()).toHaveLength(requestCount)
    await act(async () => vi.advanceTimersByTimeAsync(1))
    expect(requests()).toHaveLength(requestCount + (gasDrop ? 2 : 1))
  })

  it.each([false, true])('keeps streaming into the pool without changing review (Gas Drop: %s)', async gasDrop => {
    let finish!: () => void
    mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
      if (!!request.params.gasDrop === gasDrop) return new Promise<void>(resolve => (finish = resolve))
      request.onQuotes([makeQuote(request)])
      return Promise.resolve()
    })
    await act(async () => render('100'))
    await flushQuotes()
    if (gasDrop) await enableGas()
    const request = requests().at(-1) as QuoteRequest
    const requestCount = requests().length
    const first = makeQuote(request)
    await act(async () => {
      request.onQuotes([first])
      request.onQuoteReady()
    })
    await act(async () => state.openReview(first))
    const reviewed = state.reviewQuote
    expect(request.signal.aborted).toBe(false)

    const next = makeQuote(request)
    await act(async () => request.onQuotes([next, first]))
    expect(state.quotes).toEqual([next, first])
    expect(state.reviewQuote).toBe(reviewed)
    expect(state.reviewQuote?.quote).toBe(first.quote)
    await act(async () => state.refresh.onRefresh())
    expect(requests()).toHaveLength(requestCount)

    await act(async () => state.closeReview())
    expect(state.allLoading).toBe(true)
    expect(state.loading).toBe(false)
    const last = makeQuote(request)
    await act(async () => {
      request.onQuotes([last, next, first])
      finish()
    })
    expect(state.quotes).toEqual([last, next, first])
    expect(state.selectedQuote).toBe(last)
    expect(state.allLoading).toBe(false)
    expect(requests()).toHaveLength(requestCount)
    await act(async () => vi.advanceTimersByTimeAsync(60_000))
    expect(requests()).toHaveLength(requestCount + (gasDrop ? 2 : 1))
  })

  it.each([false, true])('does not refresh a stream completed during review (Gas Drop: %s)', async gasDrop => {
    let finish!: () => void
    mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
      if (!!request.params.gasDrop === gasDrop) return new Promise<void>(resolve => (finish = resolve))
      request.onQuotes([makeQuote(request)])
      return Promise.resolve()
    })
    await act(async () => render('100'))
    await flushQuotes()
    if (gasDrop) await enableGas()
    const request = requests().at(-1) as QuoteRequest
    const first = makeQuote(request)
    await act(async () => {
      request.onQuotes([first])
      request.onQuoteReady()
    })
    await act(async () => state.openReview(first))
    const reviewed = state.reviewQuote
    await act(async () => finish())
    const requestCount = requests().length
    await act(async () => vi.advanceTimersByTimeAsync(60_000))
    expect(requests()).toHaveLength(requestCount)
    expect(state.reviewQuote).toBe(reviewed)
    await act(async () => state.closeReview())
    expect(state.loading).toBe(true)
    await flushQuotes()
    expect(requests()).toHaveLength(requestCount + 1)
  })

  it.each(['empty', 'error'])(
    'consumes a completed %s Gas Drop prefetch without retrying on confirmation',
    async failure => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      try {
        mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => {
          if (!request.params.gasDrop) return request.onQuotes([makeQuote(request)])
          if (failure === 'error') throw new Error('No Gas Drop route')
          request.onQuotes([])
        })
        await act(async () => render('100'))
        await flushQuotes()
        const ordinary = state.selectedQuote
        await act(async () => state.prepareGasDrop())
        await enableGas()
        expect(requests().map(request => request.params.gasDrop)).toEqual([false, true])
        expect(state.gasDropEnabled).toBe(false)
        expect(state.gasDropUnsupported).toBe(true)
        expect(state.selectedQuote).toBe(ordinary)
      } finally {
        log.mockRestore()
      }
    },
  )

  it.each([false, true])('reuses a fresh quote when closing review (Gas Drop: %s)', async gasDrop => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('100'))
    await flushQuotes()
    if (gasDrop) await enableGas()
    const selected = state.selectedQuote as Quote
    const requestCount = requests().length
    await act(async () => state.openReview(selected))
    await act(async () => vi.advanceTimersByTimeAsync(59_999))
    expect(requests()).toHaveLength(requestCount)
    await act(async () => state.closeReview())
    expect(state.selectedQuote).toBe(selected)
    expect(state.loading).toBe(false)
    expect(state.allLoading).toBe(false)
    expect(state.refresh.countdown).toBe(1)
    expect(requests()).toHaveLength(requestCount)
    await act(async () => vi.advanceTimersByTimeAsync(1))
    expect(requests()).toHaveLength(requestCount + (gasDrop ? 2 : 1))
    expect(requests().at(-1)?.params.gasDrop).toBe(gasDrop)
  })

  it.each([false, true])(
    'invalidates all pools on submit but fetches only after closing review (Gas Drop: %s)',
    async gasDrop => {
      mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
      await act(async () => render('100'))
      await flushQuotes()
      await enableGas()
      // Fill all three caches, including the alternatives requested with a Gas Drop refresh.
      await act(async () => state.refresh.onRefresh())
      if (!gasDrop) {
        await act(async () => state.setGasDropEnabled(false))
        await flushQuotes()
      }
      const selected = state.selectedQuote as Quote
      await act(async () => state.openReview(selected))
      const oldRequests = requests()
      const cachedRequests = [
        ...new Map(
          oldRequests.map(request => [JSON.stringify([request.params.gasDrop, request.excludedSources]), request]),
        ).values(),
      ]
      expect(cachedRequests).toHaveLength(3)
      const completions = new Map<QuoteRequest, () => void>()
      mocks.getQuotes.mockImplementation(
        (request: QuoteRequest) => new Promise<void>(resolve => completions.set(request, resolve)),
      )

      const reviewed = state.reviewQuote
      await act(async () => state.invalidateQuotes())
      expect(state.reviewQuote).toBe(reviewed)
      await act(async () => state.refresh.onRefresh())
      // Stay inside every pool's original TTL: a new request must be caused by invalidation.
      await act(async () => vi.advanceTimersByTimeAsync(1_000))
      expect(requests()).toHaveLength(oldRequests.length)
      expect(state.selectedQuote).toBeNull()
      expect(state.routeOptions).toEqual([])
      expect(state.loading).toBe(true)
      expect(cachedRequests.every(request => request.signal.aborted)).toBe(true)
      await act(async () => state.closeReview())
      expect(state.reviewQuote).toBeNull()
      expect(state.loading).toBe(true)
      expect(state.selectedQuote).toBeNull()
      await flushQuotes()
      const replacements = requests().slice(oldRequests.length)
      expect(replacements.map(request => request.params.gasDrop)).toEqual(gasDrop ? [false, true] : [false])
      if (gasDrop) expect(replacements[0].excludedSources).toContain('KyberCross')
      const freshRequest = replacements.at(-1) as QuoteRequest
      expect(freshRequest.params.gasDrop).toBe(gasDrop)

      // The old CTA callback must not reopen review while its replacement loads.
      await act(async () => state.openReview(selected))
      expect(state.reviewQuote).toBeNull()
      expect(state.loading).toBe(true)
      const fresh = makeQuote(freshRequest)
      await act(async () => {
        for (const request of replacements) {
          request.onQuotes([request === freshRequest ? fresh : makeQuote(request, 'Across')])
          request.onQuoteReady()
          completions.get(request)?.()
        }
      })
      expect(state.selectedQuote).toBe(fresh)
      expect(state.loading).toBe(false)
      expect(state.allLoading).toBe(false)
      await act(async () => state.openReview(fresh))
      expect(state.reviewQuote?.quote).toBe(fresh.quote)
      await act(async () => state.closeReview())
      const count = requests().length
      await act(async () => state.setGasDropEnabled(!gasDrop))
      expect(state.selectedQuote).toBeNull()
      expect(state.loading).toBe(true)
      await flushQuotes()
      // The inactive pool was invalidated too, even though only the active mode reloaded on close.
      expect(requests()).toHaveLength(count + 1)
      expect(requests().at(-1)?.params.gasDrop).toBe(!gasDrop)
      expect(state.selectedQuote).toBeNull()
    },
  )

  it.each(['review open', 'replacement loading', 'replacement ready'])(
    'ignores invalidated stream results while %s',
    async phase => {
      let finishOld!: () => void
      mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
        request.onQuotes([makeQuote(request)])
        request.onQuoteReady()
        return new Promise<void>(resolve => (finishOld = resolve))
      })
      await act(async () => render('100'))
      await flushQuotes()
      const oldRequest = requests()[0]
      const selected = state.selectedQuote as Quote
      await act(async () => state.openReview(selected))
      mocks.getQuotes.mockImplementation(() => new Promise<void>(() => undefined))
      await act(async () => state.invalidateQuotes())
      let fresh: Quote | undefined
      if (phase !== 'review open') {
        await act(async () => state.closeReview())
        await flushQuotes()
        if (phase === 'replacement ready') {
          const request = requests().at(-1) as QuoteRequest
          const replacement = makeQuote(request)
          fresh = replacement
          await act(async () => {
            request.onQuotes([replacement])
            request.onQuoteReady()
          })
        }
      }
      await act(async () => {
        oldRequest.onQuotes([selected])
        oldRequest.onQuoteReady()
        finishOld()
      })
      expect(oldRequest.signal.aborted).toBe(true)
      expect(state.selectedQuote).toBe(fresh ?? null)
      expect(state.loading).toBe(!fresh)
      expect(state.allLoading).toBe(true)
      expect(state.reviewQuote?.quote).toBe(phase === 'review open' ? selected.quote : undefined)
      expect(requests()).toHaveLength(phase === 'review open' ? 1 : 2)
    },
  )

  it.each(['empty', 'error'])(
    'keeps invalidated quotes unavailable after an %s replacement, then recovers on refresh',
    async outcome => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      try {
        mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
        await act(async () => render('100'))
        await flushQuotes()
        const selected = state.selectedQuote as Quote
        await act(async () => state.openReview(selected))
        mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => {
          if (outcome === 'error') throw new Error('Quote unavailable')
          request.onQuotes([])
        })
        await act(async () => state.invalidateQuotes())
        await act(async () => state.closeReview())
        await flushQuotes()
        expect(state.selectedQuote).toBeNull()
        expect(state.reviewQuote).toBeNull()
        expect(state.loading).toBe(false)
        expect(state.allLoading).toBe(false)
        expect(state.routeOptions).toEqual([])
        await act(async () => state.openReview(selected))
        expect(state.reviewQuote).toBeNull()
        mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
        await act(async () => state.refresh.onRefresh())
        expect(requests()).toHaveLength(3)
        expect(state.selectedQuote).not.toBe(selected)
        expect(state.selectedQuote).not.toBeNull()
        expect(state.loading).toBe(false)
        await act(async () => state.openReview(state.selectedQuote as Quote))
        expect(state.reviewQuote?.quote).toBe(state.selectedQuote?.quote)
      } finally {
        log.mockRestore()
      }
    },
  )

  it.each([false, true])('reloads an expired quote when closing review (Gas Drop: %s)', async gasDrop => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('100'))
    await flushQuotes()
    if (gasDrop) await enableGas()
    const selected = state.selectedQuote as Quote
    const requestCount = requests().length
    await act(async () => state.openReview(selected))
    await act(async () => vi.advanceTimersByTimeAsync(60_000))
    expect(requests()).toHaveLength(requestCount)
    await act(async () => state.closeReview())
    expect(state.loading).toBe(true)
    await act(async () => state.openReview(selected))
    expect(state.reviewQuote).toBeNull()
    await flushQuotes()
    expect(requests()).toHaveLength(requestCount + 1)
    expect(requests().at(-1)?.params.gasDrop).toBe(gasDrop)
    expect(state.selectedQuote).not.toBe(selected)
    expect(state.loading).toBe(false)
  })

  it('reuses both modes across toggles without extending their original expiry', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('100'))
    await flushQuotes()
    const ordinary = state.selectedQuote
    await enableGas()
    const gas = state.selectedQuote
    await act(async () => vi.advanceTimersByTimeAsync(10_000))
    await act(async () => state.setGasDropEnabled(false))
    expect(state.selectedQuote).toBe(ordinary)
    expect(state.refresh.countdown).toBe(49_500)
    await act(async () => state.prepareGasDrop())
    await act(async () => state.setGasDropEnabled(true))
    expect(state.selectedQuote).toBe(gas)
    expect(state.loading).toBe(false)
    expect(state.refresh.countdown).toBe(50_000)
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
    await act(async () => vi.advanceTimersByTimeAsync(49_999))
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
    await act(async () => vi.advanceTimersByTimeAsync(1))
    expect(requests().map(request => request.params.gasDrop)).toEqual([false, true, false, true])
  })

  it.each(['remove', 'select'])(
    'fetches ordinary quotes again when switching with %s after they expire',
    async action => {
      mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
      await act(async () => render('100'))
      await flushQuotes()
      const ordinary = state.selectedQuote as Quote
      const createdAt = Date.now()
      await enableGas()
      // Model a suspended tab whose refresh timer has not run yet.
      vi.setSystemTime(createdAt + 60_000)
      await act(async () => (action === 'remove' ? state.setGasDropEnabled(false) : state.selectRoute(ordinary)))
      expect(state.selectedQuote).toBeNull()
      expect(state.loading).toBe(true)
      await flushQuotes()
      expect(requests().map(request => request.params.gasDrop)).toEqual([false, true, false])
      expect(state.selectedQuote).not.toBe(ordinary)
    },
  )

  it('reuses ordinary quotes just before they expire', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('100'))
    await flushQuotes()
    const ordinary = state.selectedQuote
    const createdAt = Date.now()
    await enableGas()
    vi.setSystemTime(createdAt + 59_999)
    await act(async () => state.setGasDropEnabled(false))
    expect(state.selectedQuote).toBe(ordinary)
    expect(state.refresh.countdown).toBe(1)
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
  })

  it('requests a new Gas Drop quote after its cached result expires', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('100'))
    await flushQuotes()
    await enableGas()
    const gas = state.selectedQuote
    const createdAt = Date.now()
    await act(async () => state.setGasDropEnabled(false))
    vi.setSystemTime(createdAt + 60_000)
    await act(async () => state.prepareGasDrop())
    await enableGas()
    expect(requests().map(request => request.params.gasDrop)).toEqual([false, true, true])
    expect(state.selectedQuote).not.toBe(gas)
  })

  it('reuses an unexpired pending Gas Drop request after cancelling and clicking again', async () => {
    mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
      if (request.params.gasDrop) return new Promise(() => undefined)
      request.onQuotes([makeQuote(request)])
      return Promise.resolve()
    })
    await act(async () => render('100'))
    await flushQuotes()
    await act(async () => state.prepareGasDrop())
    await act(async () => state.prepareGasDrop())
    await enableGas()
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
    const gas = requests()[1]
    await act(async () => {
      gas.onQuotes([makeQuote(gas)])
      gas.onQuoteReady()
    })
    expect(state.selectedQuote?.quote.quoteParams.gasDrop).toBe(true)
  })

  it('fetches ordinary quotes on Gas Drop failure if the previous ordinary result has expired', async () => {
    let finishGas!: () => void
    mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
      if (request.params.gasDrop) return new Promise<void>(resolve => (finishGas = resolve))
      request.onQuotes([makeQuote(request)])
      return Promise.resolve()
    })
    await act(async () => render('100'))
    await flushQuotes()
    const ordinary = state.selectedQuote
    const createdAt = Date.now()
    await enableGas()
    vi.setSystemTime(createdAt + 60_000)
    await act(async () => finishGas())
    expect(state.gasDropEnabled).toBe(false)
    expect(state.selectedQuote).toBeNull()
    await flushQuotes()
    expect(requests().map(request => request.params.gasDrop)).toEqual([false, true, false])
    expect(state.selectedQuote).not.toBe(ordinary)
  })

  it('reuses an ordinary route from a provider without Gas Drop when selected', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) =>
      request.onQuotes(
        request.params.gasDrop ? [makeQuote(request)] : [makeQuote(request), makeQuote(request, 'Relay')],
      ),
    )
    await act(async () => render('100'))
    await flushQuotes()
    const ordinary = state.quotes.find(quote => quote.adapter.getName() === 'Relay') as Quote
    await enableGas()
    expect(state.routeOptions).toHaveLength(2)
    expect(state.routeOptions).toContain(ordinary)
    expect(state.routeOptions[0]).toBe(state.selectedQuote)
    expect(state.selectedQuote?.quote.quoteParams.gasDrop).toBe(true)

    await act(async () => state.selectRoute(ordinary))
    expect(state.gasDropEnabled).toBe(false)
    expect(state.selectedQuote).toBe(ordinary)
    expect(state.loading).toBe(false)
    expect(state.allLoading).toBe(false)
    await flushQuotes()
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
    expect(state.selectedQuote).toBe(ordinary)
    expect(state.routeOptions).toEqual(state.quotes)
    await act(async () => state.openReview(ordinary))
    expect(state.reviewQuote?.quote).toBe(ordinary.quote)
  })

  it('ignores pending Gas Drop results after selecting an ordinary route and refreshes ordinary quotes', async () => {
    let finishGas!: () => void
    mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
      if (request.params.gasDrop) return new Promise<void>(resolve => (finishGas = resolve))
      request.onQuotes([makeQuote(request)])
      return Promise.resolve()
    })
    await act(async () => render('100'))
    await flushQuotes()
    const ordinary = state.selectedQuote as Quote
    await enableGas()
    const gas = requests()[1]
    await act(async () => state.selectRoute(ordinary))
    await act(async () => {
      gas.onQuotes([makeQuote(gas)])
      gas.onQuoteReady()
      finishGas()
    })
    expect(state.selectedQuote).toBe(ordinary)
    expect(state.gasDropEnabled).toBe(false)
    expect(state.refresh.countdown).toBe(59_500)
    await act(async () => vi.advanceTimersByTimeAsync(59_499))
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
    await act(async () => vi.advanceTimersByTimeAsync(1))
    expect(requests().map(request => request.params.gasDrop)).toEqual([false, true, false])
    expect(state.selectedQuote).not.toBe(ordinary)
  })

  it('discards the reused ordinary quote when the recipient changes', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('100'))
    await flushQuotes()
    const ordinary = state.selectedQuote as Quote
    await enableGas()
    await act(async () => state.selectRoute(ordinary))
    const openReview = state.openReview
    mocks.getQuotes.mockImplementation(() => new Promise(() => undefined))
    await act(async () => render('100', 'new-recipient'))
    expect(state.selectedQuote).toBeNull()
    expect(state.routeOptions).toEqual([])
    await act(async () => openReview(ordinary))
    expect(state.reviewQuote).toBeNull()
    await flushQuotes()
    const updated = requests().at(-1) as QuoteRequest
    await act(async () => updated.onQuotes([makeQuote(updated)]))
    expect(state.selectedQuote?.quote.quoteParams.recipient).toBe('new-recipient')
  })

  it.each([
    { provider: 'KyberCross', outputUsd: 2.2, available: false },
    { provider: 'KyberCross', outputUsd: 2.200001, available: true },
    { provider: 'KyberCross', outputUsd: 0, available: false },
    { provider: 'KyberCross', outputUsd: NaN, available: false },
    { provider: 'KyberCross', outputUsd: Infinity, available: false },
    { provider: 'Relay', outputUsd: 100, available: false },
  ])(
    'offers Gas Drop for $provider with outputUsd=$outputUsd: $available',
    async ({ provider, outputUsd, available }) => {
      mocks.outputUsd = outputUsd
      mocks.getQuotes.mockImplementation(async (request: QuoteRequest) =>
        request.onQuotes([makeQuote(request, provider)]),
      )
      await act(async () => render('100'))
      await flushQuotes()
      expect(requests().map(request => request.params.gasDrop)).toEqual([false])
      expect(state.gasDropAvailable).toBe(available)
    },
  )

  it('waits for an eligible KyberCross route even when another provider is selected', async () => {
    await act(async () => render('100'))
    await flushQuotes()
    const ordinary = requests()[0]
    expect(state.gasDropAvailable).toBe(false)
    const relay = makeQuote(ordinary, 'Relay')
    await act(async () => ordinary.onQuotes([relay]))
    expect(state.gasDropAvailable).toBe(false)
    await act(async () => ordinary.onQuotes([relay, makeQuote(ordinary)]))
    expect(state.selectedQuote).toBe(relay)
    expect(state.gasDropAvailable).toBe(true)
    await act(async () => ordinary.onQuotes([]))
    expect(state.gasDropAvailable).toBe(false)
  })

  it('requests Gas Drop on demand, clears the old quote and rejects stale review callbacks', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('100'))
    await flushQuotes()
    expect(state.gasDropAvailable).toBe(true)
    expect(state.gasDropEnabled).toBe(false)
    const ordinary = requests()[0]
    const oldQuote = state.selectedQuote as Quote
    const openOldReview = state.openReview

    mocks.getQuotes.mockImplementation(() => new Promise(() => undefined))
    await act(async () => state.setGasDropEnabled(true))
    expect(state.loading).toBe(true)
    expect(state.selectedQuote).toBeNull()
    expect(ordinary.signal.aborted).toBe(false)
    await act(async () => openOldReview(oldQuote))
    expect(state.reviewQuote).toBeNull()
    await flushQuotes()
    const gas = requests()[1]
    expect(gas.params).toEqual({ ...ordinary.params, gasDrop: true })
    await act(async () => {
      gas.onQuotes([makeQuote(gas)])
      gas.onQuoteReady()
    })
    expect(state.loading).toBe(false)
    expect(state.selectedQuote?.quote.quoteParams.gasDrop).toBe(true)
    await act(async () => state.openReview(state.selectedQuote as Quote))
    expect(state.reviewQuote?.quote.quoteParams.gasDrop).toBe(true)
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
  })

  it('starts Gas Drop before confirmation and reuses its completed result on OK', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('100'))
    await flushQuotes()
    const ordinary = state.selectedQuote
    await act(async () => state.prepareGasDrop())
    expect(requests().map(request => request.params.gasDrop)).toEqual([false, true])
    expect(state.gasDropEnabled).toBe(false)
    expect(state.selectedQuote).toBe(ordinary)
    expect(state.loading).toBe(false)
    await enableGas()
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
    expect(state.selectedQuote?.quote.quoteParams.gasDrop).toBe(true)
  })

  it('adopts the pending Gas Drop stream on OK without issuing another request', async () => {
    mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
      if (request.params.gasDrop) return new Promise(() => undefined)
      request.onQuotes([makeQuote(request)])
      return Promise.resolve()
    })
    await act(async () => render('100'))
    await flushQuotes()
    await act(async () => state.prepareGasDrop())
    const gas = requests()[1]
    await enableGas()
    expect(state.loading).toBe(true)
    expect(state.selectedQuote).toBeNull()
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
    await act(async () => {
      gas.onQuotes([makeQuote(gas)])
      gas.onQuoteReady()
    })
    expect(state.loading).toBe(false)
    expect(state.selectedQuote?.quote.quoteParams.gasDrop).toBe(true)
  })

  it('reuses a pending Gas Drop prefetch without expiring it before completion', async () => {
    let finish!: () => void
    mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
      if (request.params.gasDrop) return new Promise<void>(resolve => (finish = resolve))
      request.onQuotes([makeQuote(request)])
      return Promise.resolve()
    })
    await act(async () => render('100'))
    await flushQuotes()
    await act(async () => state.prepareGasDrop())
    const gas = requests()[1]
    // Keep the request pending beyond the quote validity period, without advancing auto refresh.
    vi.setSystemTime(Date.now() + 70_000)
    await act(async () => state.prepareGasDrop())
    expect(requests()).toHaveLength(2)
    await act(async () => {
      gas.onQuotes([makeQuote(gas)])
      finish()
    })
    await act(async () => vi.advanceTimersByTimeAsync(10_000))
    await act(async () => state.setGasDropEnabled(true))
    expect(state.refresh.countdown).toBe(50_000)
    expect(state.loading).toBe(false)
    expect(requests()).toHaveLength(2)
  })

  it.each([false, true])(
    'keeps the new input result when a previous Gas Drop request finishes (confirmed: %s)',
    async confirmed => {
      let finishGas!: () => void
      mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
        if (request.params.gasDrop)
          return new Promise<void>(resolve => {
            finishGas = resolve
          })
        request.onQuotes([makeQuote(request)])
        return Promise.resolve()
      })
      await act(async () => render('100'))
      await flushQuotes()
      await act(async () => state.prepareGasDrop())
      const gas = requests()[1]
      if (confirmed) await enableGas()
      mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
      await act(async () => render('200'))
      await act(async () => vi.advanceTimersByTimeAsync(500))
      const selected = state.selectedQuote
      expect(selected?.quote.quoteParams.amount).toBe('200000000')
      await act(async () => {
        gas.onQuotes([makeQuote(gas)])
        finishGas()
      })
      expect(gas.signal.aborted).toBe(true)
      expect(state.selectedQuote).toBe(selected)
      expect(state.gasDropAvailable).toBe(true)
      // The previous Gas Drop request had no route yet, so the new input uses ordinary mode.
      expect(state.gasDropEnabled).toBe(false)
      expect(
        requests()
          .slice(2)
          .map(request => request.params.gasDrop),
      ).toEqual([false])
      expect(state.gasDropUnsupported).toBe(false)
    },
  )

  it.each(['manual', 'periodic'])(
    'updates comparison routes and the estimate on each %s Gas Drop refresh',
    async mode => {
      let alternativeOutputUsd = 10
      mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => {
        if (request.params.gasDrop) return request.onQuotes([makeQuote(request)])
        const ordinary = makeQuote(request, 'Mayan')
        ordinary.quote.outputUsd = request.excludedSources.includes('KyberCross') ? alternativeOutputUsd : 100
        request.onQuotes(request.excludedSources.includes('KyberCross') ? [ordinary] : [makeQuote(request), ordinary])
      })
      await act(async () => render('100'))
      await flushQuotes()
      await enableGas()
      const initialOrdinary = state.routeOptions.find(({ adapter }) => adapter.getName() === 'Mayan')

      for (const output of [10, 3]) {
        alternativeOutputUsd = output
        const count = requests().length
        await act(async () => {
          if (mode === 'periodic') await vi.advanceTimersByTimeAsync(60_000)
          else {
            await vi.advanceTimersByTimeAsync(2_000)
            state.refresh.onRefresh()
          }
        })
        expect(
          requests()
            .slice(count)
            .map(request => [request.params.gasDrop, request.excludedSources]),
        ).toEqual([
          [false, ['Relay', 'KyberCross']],
          [true, ['Relay']],
        ])
        expect(state.routeOptions).not.toContain(initialOrdinary)
        expect(state.routeOptions.find(({ adapter }) => adapter.getName() === 'Mayan')?.quote.outputUsd).toBe(output)
      }

      const count = requests().length
      await act(async () => render('50'))
      await flushQuotes()
      // The refreshed ordinary estimate is $3 / 2, not the initial ordinary output of $100.
      expect(state.gasDropEnabled).toBe(false)
      expect(requests().slice(count)).toHaveLength(1)
      expect(requests()[count]).toMatchObject({ params: { gasDrop: false }, excludedSources: ['Relay'] })
    },
  )

  it('does not restore old comparison routes when refreshed alternatives are empty', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) =>
      request.onQuotes(
        request.params.gasDrop ? [makeQuote(request)] : [makeQuote(request), makeQuote(request, 'Mayan')],
      ),
    )
    await act(async () => render('100'))
    await flushQuotes()
    await enableGas()
    expect(state.routeOptions).toHaveLength(2)
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) =>
      request.onQuotes(request.params.gasDrop ? [makeQuote(request)] : []),
    )
    await act(async () => state.refresh.onRefresh())
    expect(state.routeOptions).toEqual(state.quotes)
    expect(state.gasDropEnabled).toBe(true)
  })

  it.each(['input', 'unmount'])('does not block Gas Drop on alternatives and cancels them on %s', async action => {
    let finishAlternatives!: () => void
    mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
      if (request.excludedSources.includes('KyberCross')) {
        return new Promise<void>(resolve => (finishAlternatives = resolve))
      }
      request.onQuotes([makeQuote(request)])
      return Promise.resolve()
    })
    await act(async () => render('100'))
    await flushQuotes()
    await enableGas()
    await act(async () => state.refresh.onRefresh())
    const alternatives = requests()[2]
    const current = requests()[3]
    expect(alternatives.excludedSources).toContain('KyberCross')
    expect(state.loading).toBe(false)
    expect(state.allLoading).toBe(false)
    expect(state.selectedQuote?.quote.quoteParams.gasDrop).toBe(true)

    if (action === 'input') await act(async () => render('200'))
    else await act(async () => root.unmount())
    expect(alternatives.signal.aborted).toBe(true)
    expect(current.signal.aborted).toBe(true)
    await act(async () => {
      alternatives.onQuotes([makeQuote(alternatives, 'Mayan')])
      finishAlternatives()
    })
    if (action === 'input') {
      expect(state.routeOptions).toEqual([])
      await flushQuotes()
      expect(state.selectedQuote?.quote.quoteParams.amount).toBe('200000000')
      expect(state.routeOptions.every(({ quote }) => quote.quoteParams.amount === '200000000')).toBe(true)
    }
  })

  it('prefers a newer full ordinary result over older alternatives after switching modes', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => {
      if (request.params.gasDrop) return request.onQuotes([makeQuote(request)])
      const ordinary = makeQuote(request, 'Mayan')
      ordinary.quote.outputUsd = request.excludedSources.includes('KyberCross') ? 3 : mocks.outputUsd
      request.onQuotes(request.excludedSources.includes('KyberCross') ? [ordinary] : [makeQuote(request), ordinary])
    })
    await act(async () => render('100'))
    await flushQuotes()
    await enableGas()
    await act(async () => state.refresh.onRefresh())
    expect(state.routeOptions.find(({ adapter }) => adapter.getName() === 'Mayan')?.quote.outputUsd).toBe(3)

    await act(async () => state.setGasDropEnabled(false))
    await flushQuotes()
    mocks.outputUsd = 80
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000)
      state.refresh.onRefresh()
    })
    const count = requests().length
    const fullQuote = state.routeOptions.find(({ adapter }) => adapter.getName() === 'Mayan')
    expect(fullQuote?.quote.outputUsd).toBe(80)
    await enableGas()
    expect(requests()).toHaveLength(count)
    expect(state.routeOptions).toContain(fullQuote)

    await act(async () => render('50'))
    await flushQuotes()
    // Use $80 / 2, not the older alternatives estimate of $3 / 2.
    expect(state.gasDropEnabled).toBe(true)
    expect(
      requests()
        .slice(count)
        .map(request => [request.params.gasDrop, request.excludedSources]),
    ).toEqual([
      [false, ['Relay', 'KyberCross']],
      [true, ['Relay']],
    ])
  })

  it('refreshes Gas Drop with alternatives and reuses fresh full ordinary quotes when disabled', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('100'))
    await flushQuotes()
    await enableGas()
    await act(async () => state.refresh.onRefresh())
    expect(requests().map(request => request.params.gasDrop)).toEqual([false, true, false, true])
    await act(async () => state.setGasDropEnabled(false))
    expect(state.loading).toBe(false)
    await flushQuotes()
    expect(requests().map(request => request.params.gasDrop)).toEqual([false, true, false, true])
    expect(state.selectedQuote?.quote.quoteParams.gasDrop).toBe(false)
  })

  it.each(['empty', 'no allocation', 'error'])(
    'marks Gas Drop unsupported and returns to ordinary mode on %s',
    async failure => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => {
        if (!request.params.gasDrop) return request.onQuotes([makeQuote(request)])
        if (failure === 'error') throw new Error('No Gas Drop route')
        request.onQuotes(failure === 'empty' ? [] : [makeQuote(request, 'KyberCross', false)])
      })
      await act(async () => render('100'))
      await flushQuotes()
      await enableGas()
      expect(state.gasDropEnabled).toBe(false)
      expect(state.gasDropAvailable).toBe(true)
      expect(state.gasDropUnsupported).toBe(true)
      await flushQuotes()
      expect(requests().map(request => request.params.gasDrop)).toEqual([false, true])
      expect(state.selectedQuote?.quote.quoteParams.gasDrop).toBe(false)
      expect(state.gasDropUnsupported).toBe(true)
      await act(async () => render('200'))
      expect(state.gasDropUnsupported).toBe(false)
      log.mockRestore()
    },
  )

  it('preserves mode on rerender, resets it on recipient changes, and ignores late responses', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('10', 'recipient-a'))
    await flushQuotes()
    await enableGas()
    const originalGas = requests()[1]
    const selected = state.selectedQuote
    await act(async () => render('10', 'recipient-a'))
    expect(state.selectedQuote).toBe(selected)
    expect(state.gasDropEnabled).toBe(true)
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
    await act(async () => render('10', 'recipient-b'))
    await flushQuotes()
    mocks.getQuotes.mockImplementation(() => new Promise(() => undefined))
    await act(async () => render('10', 'recipient-a'))
    expect(state.gasDropEnabled).toBe(false)
    expect(state.quotes).toEqual([])
    expect(state.routeOptions).toEqual([])
    expect(originalGas.signal.aborted).toBe(true)
    await act(async () => {
      originalGas.onQuotes([makeQuote(originalGas)])
      originalGas.onQuoteReady()
    })
    expect(state.quotes).toEqual([])
    await flushQuotes()
    const updated = requests().at(-1) as QuoteRequest
    await act(async () => updated.onQuotes([makeQuote(updated)]))
    expect(state.selectedQuote?.quote.quoteParams).toMatchObject({ recipient: 'recipient-a', gasDrop: false })
    expect(mocks.getQuotes).toHaveBeenCalledTimes(4)
  })

  it('updates eligibility from refreshed ordinary output values', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('10'))
    await flushQuotes()
    expect(state.gasDropAvailable).toBe(true)
    mocks.outputUsd = 2.2
    await act(async () => state.refresh.onRefresh())
    expect(state.gasDropAvailable).toBe(false)
    mocks.outputUsd = 2.3
    await act(async () => vi.advanceTimersByTimeAsync(60_000))
    expect(state.gasDropAvailable).toBe(true)
    expect(requests().map(request => request.params.gasDrop)).toEqual([false, false, false])
  })

  it('keeps Gas Drop enabled based on the ordinary route when input price or gas output drops', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    mocks.tokenInUsd = 0
    mocks.outputUsd = 2.3
    await act(async () => render('10'))
    await flushQuotes()
    expect(state.gasDropAvailable).toBe(true)
    mocks.outputUsd = 0.3
    await enableGas()
    await act(async () => state.refresh.onRefresh())
    expect(state.gasDropAvailable).toBe(true)
    expect(state.gasDropEnabled).toBe(true)
    expect(requests().map(request => request.params.gasDrop)).toEqual([false, true, false, true])
  })

  it('does not offer Gas Drop for native output', async () => {
    await act(async () =>
      root.render(
        <Harness
          pair={{ ...pair, pairKey: 'native-output', currencyOut: { ...pair.currencyOut, isNative: true } as any }}
          amount="100"
          sender="sender"
          receiver="recipient"
          isReadOnly={false}
        />,
      ),
    )
    await flushQuotes()
    expect(state.gasDropAvailable).toBe(false)
    expect(requests().map(request => request.params.gasDrop)).toEqual([false])
  })
})

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers()
  mocks.wallets = undefined
  mocks.tokenInUsd = 1
  mocks.outputUsd = 100
  mocks.slippage = 50
  mocks.getQuotes.mockReset().mockImplementation(() => new Promise(() => undefined))
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('unified quote session after aggregator integration', () => {
  it('debounces amount, token and recipient changes together using only the latest request', async () => {
    await act(async () => render('100'))
    await flushQuotes()
    const previous = requests()[0]
    await act(async () => render('200'))
    expect(previous.signal.aborted).toBe(true)
    await act(async () => vi.advanceTimersByTimeAsync(250))

    const nextPair = {
      ...pair,
      pairKey: '1:USDC-8453:DAI',
      currencyOut: { ...pair.currencyOut, symbol: 'DAI' } as Props['pair']['currencyOut'],
    }
    await act(async () =>
      root.render(<Harness pair={nextPair} amount="200" sender="sender" receiver="new-recipient" isReadOnly={false} />),
    )
    expect(state.selectedQuote).toBeNull()
    expect(state.loading).toBe(true)
    await act(async () => state.refresh.onRefresh())
    await act(async () => vi.advanceTimersByTimeAsync(499))
    expect(mocks.getQuotes).toHaveBeenCalledTimes(1)
    await act(async () => vi.advanceTimersByTimeAsync(1))
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
    expect(requests()[1].params).toMatchObject({
      amount: '200000000',
      toToken: { symbol: 'DAI' },
      recipient: 'new-recipient',
    })
  })

  it('cancels a pending request when the amount is cleared', async () => {
    await act(async () => render('100'))
    await act(async () => vi.advanceTimersByTimeAsync(250))
    await act(async () => render(''))
    await flushQuotes()
    expect(mocks.getQuotes).not.toHaveBeenCalled()
    expect(state.disable).toBe(true)
    expect(state.loading).toBe(false)
  })

  it('requests new quotes on manual and periodic refresh with unchanged inputs', async () => {
    mocks.getQuotes.mockResolvedValue(undefined)
    await act(async () => render('100'))
    await flushQuotes()
    expect(mocks.getQuotes).toHaveBeenCalledTimes(1)
    await act(async () => state.refresh.onRefresh())
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
    await act(async () => vi.advanceTimersByTimeAsync(59_999))
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
    await act(async () => vi.advanceTimersByTimeAsync(1))
    expect(mocks.getQuotes).toHaveBeenCalledTimes(3)
  })

  it('requests stream quotes with pair fees even when the legacy setting is direct', async () => {
    await act(async () => render('100'))
    await flushQuotes()
    expect(mocks.getQuotes).toHaveBeenCalledTimes(1)
    expect(mocks.getQuotes.mock.calls[0][0]).toMatchObject({
      quoteMode: 'stream',
      excludedSources: ['Relay'],
      params: { amount: '100000000', feeBps: 10, slippage: 50, sender: 'sender', recipient: 'recipient' },
    })
  })

  it('invalidates the reviewed quote when receiver changes and requests the exact new recipient', async () => {
    await act(async () => render('100', 'wallet-receiver'))
    await flushQuotes()
    const previous = mocks.getQuotes.mock.calls[0][0] as QuoteRequest
    await act(async () => render('100', 'pasted-receiver'))
    expect(previous.signal.aborted).toBe(true)
    expect(state.reviewQuote).toBeNull()
    await act(async () => previous.onQuotes([{ adapter: { getName: () => 'Relay' } } as Quote]))
    expect(state.quotes).toEqual([])
    await flushQuotes()
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
    expect(mocks.getQuotes.mock.calls.at(-1)?.[0].params).toMatchObject({
      sender: 'sender',
      recipient: 'pasted-receiver',
    })
  })

  it('aborts the old stream and ignores its late quotes when the input changes', async () => {
    await act(async () => render('100'))
    await flushQuotes()
    const previous = mocks.getQuotes.mock.calls[0][0] as QuoteRequest
    await act(async () => render('200'))
    expect(previous.signal.aborted).toBe(true)
    await act(async () => previous.onQuotes([{ adapter: { getName: () => 'Relay' } } as Quote]))
    expect(state.quotes).toEqual([])
    await act(async () => vi.advanceTimersByTimeAsync(499))
    expect(mocks.getQuotes).toHaveBeenCalledTimes(1)
    await act(async () => vi.advanceTimersByTimeAsync(1))
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
    expect(mocks.getQuotes.mock.calls[1][0].params.amount).toBe('200000000')
  })
})

it('takes Bitcoin public key from the input signing session after reversal', async () => {
  mocks.wallets = {
    inputAddress: 'btc-sender',
    inputConnection: { family: 'bitcoin', getPublicKey: () => 'ledger-key' },
  }
  await act(async () =>
    root.render(
      <Harness
        pair={{ ...pair, fromChainId: 'bitcoin' as any }}
        amount="1"
        sender="btc-sender"
        receiver="recipient"
        isReadOnly={false}
      />,
    ),
  )
  await flushQuotes()
  expect(mocks.getQuotes.mock.calls[0][0].params).toMatchObject({ sender: 'btc-sender', publicKey: 'ledger-key' })
})

it('stops requests and drops the old quote when the cross-chain engine is disabled', async () => {
  mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
    request.onQuotes([makeQuote(request)])
    return Promise.resolve()
  })
  await act(async () => render('100', 'recipient', false))
  await flushQuotes()
  expect(mocks.getQuotes).not.toHaveBeenCalled()
  await act(async () => render('100'))
  await flushQuotes()
  expect(state.selectedQuote).not.toBeNull()
  const selectedQuote = state.selectedQuote
  if (!selectedQuote) throw new Error('Expected an active quote')
  await act(async () => state.openReview(selectedQuote))
  expect(state.reviewQuote).not.toBeNull()
  const count = mocks.getQuotes.mock.calls.length
  await act(async () => render('100', 'recipient', false))
  await flushQuotes()
  expect(state.selectedQuote).toBeNull()
  expect(state.reviewQuote).toBeNull()
  expect(mocks.getQuotes).toHaveBeenCalledTimes(count)
})

it('starts quotes when token metadata resolves after an amount was entered in StrictMode', async () => {
  const renderPair = (resolved: boolean) =>
    root.render(
      <StrictMode>
        <Harness
          pair={resolved ? pair : { ...pair, currencyOut: undefined }}
          amount="100"
          sender="sender"
          receiver="recipient"
          isReadOnly={false}
        />
      </StrictMode>,
    )
  await act(async () => renderPair(false))
  await flushQuotes()
  expect(mocks.getQuotes).not.toHaveBeenCalled()
  await act(async () => renderPair(true))
  await flushQuotes()
  expect(mocks.getQuotes).toHaveBeenCalledOnce()
  expect(requests()[0].params.amount).toBe('100000000')
})

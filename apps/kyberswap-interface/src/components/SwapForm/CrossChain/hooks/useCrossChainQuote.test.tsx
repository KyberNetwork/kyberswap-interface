// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCrossChainQuote } from 'components/SwapForm/CrossChain/hooks/useCrossChainQuote'
import type { getQuotes } from 'pages/Swap/crossChain/quote/adapterQuotes'
import type { Quote } from 'pages/Swap/crossChain/registry'

const mocks = vi.hoisted(() => ({
  wallets: undefined as any,
  connection: {},
  checkSameAsset: vi.fn(),
  getQuotes: vi.fn(),
  tokenInUsd: 1,
  state: { crossChainSwap: { excludedSources: ['Relay'], quoteMode: 'direct' } },
}))
vi.mock('pages/Swap/SwapWalletContext', () => ({ useSwapWallets: () => mocks.wallets }))
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
vi.mock('state/user/hooks', () => ({ useUserSlippageTolerance: () => [50] }))
vi.mock('pages/Swap/crossChain/factory', () => ({ registry: {} }))
vi.mock('pages/Swap/crossChain/adapters/RelayAdapter/relaySolanaWallet', () => ({ adaptRelaySolanaWallet: vi.fn() }))
vi.mock('pages/Swap/crossChain/quote/adapterQuotes', () => ({ getQuotes: mocks.getQuotes }))
vi.mock('pages/Swap/crossChain/quote/getPairInfo', () => ({
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
const render = (amount: string, receiver = 'recipient') => {
  root.render(<Harness pair={pair} amount={amount} sender="sender" receiver={receiver} isReadOnly={false} />)
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
    },
  } as Quote)

const requests = () => mocks.getQuotes.mock.calls.map(([request]) => request as QuoteRequest)

const flushQuotes = () => act(async () => vi.advanceTimersByTimeAsync(800))
const enableGas = async () => {
  await act(async () => state.setGasDropEnabled(true))
  await flushQuotes()
}

describe('Gas Drop route selection', () => {
  it.each([
    { amount: '2.2', price: 1, available: false },
    { amount: '2.200001', price: 1, available: true },
    { amount: '10', price: 0.1, available: false },
    { amount: '100', price: 0, available: false },
  ])('only offers Gas Drop above $2.2: $amount tokens at $price USD', async ({ amount, price, available }) => {
    mocks.tokenInUsd = price
    await act(async () => render(amount))
    await flushQuotes()
    expect(requests().map(request => request.params.gasDrop)).toEqual([false])
    expect(state.gasDropAvailable).toBe(available)
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
    expect(ordinary.signal.aborted).toBe(true)
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

  it.each([false, true])(
    'ignores an older Gas Drop response after the newer result is selected (empty: %s)',
    async empty => {
      const finishGas: Array<() => void> = []
      mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
        if (request.params.gasDrop) return new Promise<void>(resolve => finishGas.push(resolve))
        request.onQuotes([makeQuote(request)])
        return Promise.resolve()
      })
      await act(async () => render('100'))
      await flushQuotes()
      await act(async () => state.prepareGasDrop())
      const oldGas = requests()[1]
      // Cancel only closes the popup. A new click starts a separate request.
      await act(async () => state.prepareGasDrop())
      const newGas = requests()[2]
      await enableGas()
      await act(async () => {
        newGas.onQuotes([makeQuote(newGas)])
        finishGas[1]()
      })
      const selected = state.selectedQuote
      await act(async () => {
        oldGas.onQuotes(empty ? [] : [makeQuote(oldGas)])
        finishGas[0]()
      })
      expect(oldGas.signal.aborted).toBe(false)
      expect(state.selectedQuote).toBe(selected)
      expect(state.gasDropEnabled).toBe(true)
      expect(state.gasDropUnsupported).toBe(false)
      expect(mocks.getQuotes).toHaveBeenCalledTimes(3)
    },
  )

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
      await act(async () => render('200'))
      await act(async () => vi.advanceTimersByTimeAsync(500))
      await act(async () => vi.advanceTimersByTimeAsync(300))
      const selected = state.selectedQuote
      expect(selected?.quote.quoteParams.amount).toBe('200000000')
      await act(async () => {
        gas.onQuotes([makeQuote(gas)])
        finishGas()
      })
      expect(gas.signal.aborted).toBe(false)
      expect(state.selectedQuote).toBe(selected)
      expect(state.gasDropAvailable).toBe(true)
      expect(state.gasDropEnabled).toBe(false)
      expect(state.gasDropUnsupported).toBe(false)
    },
  )

  it('requests only the selected mode on refresh and requests ordinary quotes when disabled', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('100'))
    await flushQuotes()
    await enableGas()
    await act(async () => state.refresh.onRefresh())
    expect(requests().map(request => request.params.gasDrop)).toEqual([false, true, true])
    await act(async () => state.setGasDropEnabled(false))
    expect(state.loading).toBe(true)
    expect(state.selectedQuote).toBeNull()
    await flushQuotes()
    expect(requests().map(request => request.params.gasDrop)).toEqual([false, true, true, false])
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
      expect(requests().map(request => request.params.gasDrop)).toEqual([false, true, false])
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
    await act(async () => render('10', 'recipient-a'))
    expect(state.gasDropEnabled).toBe(false)
    expect(state.quotes).toEqual([])
    expect(originalGas.signal.aborted).toBe(false)
    await act(async () => {
      originalGas.onQuotes([makeQuote(originalGas)])
      originalGas.onQuoteReady()
    })
    expect(state.quotes).toEqual([])
    await flushQuotes()
    expect(state.selectedQuote?.quote.quoteParams).toMatchObject({ recipient: 'recipient-a', gasDrop: false })
    expect(mocks.getQuotes).toHaveBeenCalledTimes(4)
  })

  it('returns to ordinary mode when the refreshed input value falls below the threshold', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('10'))
    await flushQuotes()
    await enableGas()
    mocks.tokenInUsd = 0.2
    await act(async () => state.refresh.onRefresh())
    await flushQuotes()
    expect(requests().map(request => request.params.gasDrop)).toEqual([false, true, false])
    expect(state.gasDropEnabled).toBe(false)
    expect(state.gasDropAvailable).toBe(false)
    expect(state.gasDropUnsupported).toBe(false)
    expect(state.selectedQuote?.quote.quoteParams.gasDrop).toBe(false)
    mocks.tokenInUsd = 1
    await act(async () => vi.advanceTimersByTimeAsync(60_000))
    expect(state.gasDropAvailable).toBe(true)
    expect(state.gasDropEnabled).toBe(false)
    expect(requests().map(request => request.params.gasDrop)).toEqual([false, true, false, false])
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
  mocks.getQuotes.mockReset().mockImplementation(() => new Promise(() => undefined))
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('unified quote session after aggregator integration', () => {
  it('requests new quotes on manual and periodic refresh with unchanged inputs', async () => {
    mocks.getQuotes.mockResolvedValue(undefined)
    await act(async () => render('100'))
    await act(async () => vi.advanceTimersByTimeAsync(800))
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
    await act(async () => vi.advanceTimersByTimeAsync(800))
    expect(mocks.getQuotes).toHaveBeenCalledTimes(1)
    expect(mocks.getQuotes.mock.calls[0][0]).toMatchObject({
      quoteMode: 'stream',
      excludedSources: ['Relay'],
      params: { amount: '100000000', feeBps: 10, slippage: 50, sender: 'sender', recipient: 'recipient' },
    })
  })

  it('invalidates the reviewed quote when receiver changes and requests the exact new recipient', async () => {
    await act(async () => render('100', 'wallet-receiver'))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    const previous = mocks.getQuotes.mock.calls[0][0] as QuoteRequest
    await act(async () => render('100', 'pasted-receiver'))
    expect(previous.signal.aborted).toBe(true)
    expect(state.reviewQuote).toBeNull()
    await act(async () => previous.onQuotes([{ adapter: { getName: () => 'Relay' } } as Quote]))
    expect(state.quotes).toEqual([])
    await act(async () => vi.advanceTimersByTimeAsync(800))
    expect(mocks.getQuotes.mock.calls.at(-1)?.[0].params).toMatchObject({
      sender: 'sender',
      recipient: 'pasted-receiver',
    })
  })

  it('aborts the old stream and ignores its late quotes when the input changes', async () => {
    await act(async () => render('100'))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    const previous = mocks.getQuotes.mock.calls[0][0] as QuoteRequest
    await act(async () => render('200'))
    expect(previous.signal.aborted).toBe(true)
    await act(async () => previous.onQuotes([{ adapter: { getName: () => 'Relay' } } as Quote]))
    expect(state.quotes).toEqual([])
    // Flush the debounced render before advancing the next request's startup delay.
    await act(async () => vi.advanceTimersByTimeAsync(500))
    await act(async () => vi.advanceTimersByTimeAsync(300))
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
  await act(async () => vi.advanceTimersByTimeAsync(800))
  expect(mocks.getQuotes.mock.calls[0][0].params).toMatchObject({ sender: 'btc-sender', publicKey: 'ledger-key' })
})

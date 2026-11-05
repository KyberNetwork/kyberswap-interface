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

describe('Gas Drop route selection', () => {
  it('preserves selection on rerender but starts fresh after recipient A -> B -> A', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('10', 'recipient-a'))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    const originalGas = requests()[1]
    await act(async () => state.setGasDropEnabled(true))
    const selected = state.selectedQuote

    await act(async () => render('10', 'recipient-a'))
    expect(state.gasDropEnabled).toBe(true)
    expect(state.selectedQuote).toBe(selected)
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)

    await act(async () => render('10', 'recipient-b'))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    await act(async () => render('10', 'recipient-a'))
    expect(state.gasDropEnabled).toBe(false)
    expect(state.quotes).toEqual([])
    await act(async () => {
      originalGas.onQuotes([makeQuote(originalGas)])
      originalGas.onQuoteReady()
    })
    expect(state.quotes).toEqual([])
    await act(async () => vi.advanceTimersByTimeAsync(800))
    expect(state.selectedQuote?.quote.quoteParams).toMatchObject({ recipient: 'recipient-a', gasDrop: false })
    expect(mocks.getQuotes).toHaveBeenCalledTimes(6)
  })

  it('drops the selected Gas Drop mode when refreshed input value falls to $2', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('10'))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    await act(async () => state.setGasDropEnabled(true))
    mocks.tokenInUsd = 0.2
    await act(async () => state.refresh.onRefresh())
    expect(mocks.getQuotes).toHaveBeenCalledTimes(3)
    expect(requests()[2].params).toMatchObject({ gasDrop: false, tokenInUsd: 0.2 })
    expect(state.gasDropEnabled).toBe(false)
    expect(state.gasDropAvailable).toBe(false)
    expect(state.selectedQuote?.quote.quoteParams.gasDrop).toBe(false)
  })

  it.each([
    { amount: '1.99', price: 1, modes: [false] },
    { amount: '2', price: 1, modes: [false] },
    { amount: '2.000001', price: 1, modes: [false, true] },
    { amount: '10', price: 0.1, modes: [false] },
    { amount: '1', price: 3, modes: [false, true] },
    { amount: '100', price: 0, modes: [false] },
  ])('requests Gas Drop only above $2: $amount tokens at $price USD', async ({ amount, price, modes }) => {
    mocks.tokenInUsd = price
    await act(async () => render(amount))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    expect(requests().map(request => request.params.gasDrop)).toEqual(modes)
  })

  it('loads both modes with the same request snapshot and switches cached routes without another API call', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('100'))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    const [ordinary, gas] = requests()
    expect(ordinary.params.gasDrop).toBe(false)
    expect(gas.params).toEqual({ ...ordinary.params, gasDrop: true })
    expect(gas.signal).toBe(ordinary.signal)
    expect(state.gasDropAvailable).toBe(true)
    expect(state.gasDropEnabled).toBe(false)
    expect(state.quotes.map(item => item.quote.quoteId)).toEqual(['KyberCross-false'])

    const openOldReview = state.openReview
    const oldQuote = state.selectedQuote as Quote
    await act(async () => state.setGasDropEnabled(true))
    expect(state.quotes.map(item => item.quote.quoteId)).toEqual(['KyberCross-true'])
    await act(async () => openOldReview(oldQuote))
    expect(state.reviewQuote).toBeNull()
    await act(async () => state.openReview(state.selectedQuote as Quote))
    expect(state.reviewQuote?.quote).toMatchObject({ quoteId: 'KyberCross-true', quoteToken: 'token-true' })
    expect(state.reviewQuote?.quote.quoteParams.gasDrop).toBe(true)
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
  })

  it('restores ordinary routes on toggle off, keeping providers with the same name separate', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('100'))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    const ordinary = state.selectedQuote
    await act(async () => state.setGasDropEnabled(true))
    expect(state.selectedQuote).not.toBe(ordinary)
    await act(async () => state.setGasDropEnabled(false))
    expect(state.selectedQuote).toBe(ordinary)
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
  })

  it('does not offer Gas Drop when its response has no allocation', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) =>
      request.onQuotes([makeQuote(request, 'Relay', false)]),
    )
    await act(async () => render('100'))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    expect(state.gasDropAvailable).toBe(false)
    expect(state.quotes).toHaveLength(1)
    expect(state.selectedQuote?.quote.quoteParams.gasDrop).toBe(false)
  })

  it('keeps ordinary routes usable while Gas Drop is pending and after it fails', async () => {
    let rejectGas!: (error: Error) => void
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
      if (request.params.gasDrop)
        return new Promise((_, reject) => {
          rejectGas = reject
        })
      request.onQuotes([makeQuote(request)])
      return Promise.resolve()
    })
    await act(async () => render('100'))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    expect(state.loading).toBe(false)
    expect(state.allLoading).toBe(true)
    expect(state.selectedQuote?.quote.quoteParams.gasDrop).toBe(false)
    await act(async () => rejectGas(new Error('No Gas Drop route')))
    expect(state.allLoading).toBe(false)
    expect(state.gasDropAvailable).toBe(false)
    expect(state.quotes).toHaveLength(1)
    log.mockRestore()
  })

  it('can select Gas Drop when the ordinary mode has no routes', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => {
      request.onQuotes(request.params.gasDrop ? [makeQuote(request)] : [])
    })
    await act(async () => render('100'))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    expect(state.selectedQuote).toBeNull()
    expect(state.gasDropAvailable).toBe(true)
    await act(async () => state.setGasDropEnabled(true))
    expect(state.selectedQuote?.quote.quoteParams.gasDrop).toBe(true)
  })

  it('clears both modes and ignores late Gas Drop responses when the recipient changes', async () => {
    await act(async () => render('100'))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    const [ordinary, gas] = requests()
    await act(async () => {
      ordinary.onQuotes([makeQuote(ordinary)])
      gas.onQuotes([makeQuote(gas)])
      state.setGasDropEnabled(true)
    })
    await act(async () => render('100', 'new-recipient'))
    expect(ordinary.signal.aborted).toBe(true)
    expect(gas.signal.aborted).toBe(true)
    await act(async () => gas.onQuotes([makeQuote(gas)]))
    expect(state.quotes).toEqual([])
    expect(state.gasDropAvailable).toBe(false)
    expect(state.gasDropEnabled).toBe(false)
  })

  it('only requests ordinary quotes for native output and invalidates the previous Gas Drop selection', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('100'))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    await act(async () => state.setGasDropEnabled(true))
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
    expect(state.gasDropAvailable).toBe(false)
    expect(state.gasDropEnabled).toBe(false)
    await act(async () => vi.advanceTimersByTimeAsync(800))
    expect(mocks.getQuotes).toHaveBeenCalledTimes(3)
    expect(requests()[2].params.gasDrop).toBe(false)
  })

  it('falls back only after the selected Gas Drop mode finishes without routes on refresh', async () => {
    mocks.getQuotes.mockImplementation(async (request: QuoteRequest) => request.onQuotes([makeQuote(request)]))
    await act(async () => render('100'))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    await act(async () => state.setGasDropEnabled(true))
    let finishGas!: () => void
    mocks.getQuotes.mockImplementation((request: QuoteRequest) => {
      if (request.params.gasDrop)
        return new Promise<void>(resolve => {
          finishGas = resolve
        })
      request.onQuotes([makeQuote(request)])
      return Promise.resolve()
    })
    await act(async () => state.refresh.onRefresh())
    expect(state.gasDropEnabled).toBe(true)
    expect(state.selectedQuote).toBeNull()
    await act(async () => finishGas())
    expect(state.gasDropAvailable).toBe(false)
    expect(state.gasDropEnabled).toBe(false)
    expect(state.selectedQuote?.quote.quoteParams.gasDrop).toBe(false)
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
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
    await act(async () => state.refresh.onRefresh())
    expect(mocks.getQuotes).toHaveBeenCalledTimes(4)
    await act(async () => vi.advanceTimersByTimeAsync(59_999))
    expect(mocks.getQuotes).toHaveBeenCalledTimes(4)
    await act(async () => vi.advanceTimersByTimeAsync(1))
    expect(mocks.getQuotes).toHaveBeenCalledTimes(6)
  })

  it('requests stream quotes with pair fees even when the legacy setting is direct', async () => {
    await act(async () => render('100'))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    expect(mocks.getQuotes).toHaveBeenCalledTimes(2)
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
    expect(mocks.getQuotes).toHaveBeenCalledTimes(4)
    expect(mocks.getQuotes.mock.calls[2][0].params.amount).toBe('200000000')
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

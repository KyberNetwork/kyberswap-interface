// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useKyberCrossQuote } from 'pages/KyberCross/hooks/useKyberCrossQuote'
import type { getFallbackQuotes } from 'pages/Swap/crossChain/quote/adapterQuotes'
import type { Quote } from 'pages/Swap/crossChain/registry'

const mocks = vi.hoisted(() => ({
  connection: {},
  unavailable: vi.fn(),
  checkSameAsset: vi.fn(),
  getFallbackQuotes: vi.fn(),
  state: { crossChainSwap: { excludedSources: ['Relay'], kyberCrossExcludedSources: ['Across'] } },
}))
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
vi.mock('pages/Swap/crossChain/quote/adapterQuotes', () => ({ getFallbackQuotes: mocks.getFallbackQuotes }))
vi.mock('pages/Swap/crossChain/quote/getPairInfo', () => ({
  getPairInfo: async () => ({ category: 'stablePair', feeBps: 10, tokenInUsd: 1, tokenOutUsd: 1 }),
}))

type Props = Parameters<typeof useKyberCrossQuote>[0]
type QuoteRequest = Parameters<typeof getFallbackQuotes>[0]
const pair = {
  pairKey: '1:USDC-8453:USDC',
  fromChainId: 1,
  toChainId: 8453,
  currencyIn: { decimals: 6, symbol: 'USDC' },
  currencyOut: { decimals: 6, symbol: 'USDC' },
  nearTokens: [],
} as unknown as Props['pair']

let state: ReturnType<typeof useKyberCrossQuote>
let root: ReturnType<typeof createRoot>
const render = (amount: string, gasDropEnabled = false) => {
  root.render(
    <Harness
      pair={pair}
      amount={amount}
      sender="sender"
      receiver="recipient"
      isReadOnly={false}
      gasDropEnabled={gasDropEnabled}
      onGasDropUnavailable={mocks.unavailable}
    />,
  )
}
function Harness(props: Props) {
  state = useKyberCrossQuote(props)
  return null
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers()
  mocks.unavailable.mockReset()
  mocks.getFallbackQuotes.mockReset().mockImplementation(() => new Promise(() => undefined))
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('KyberCross derivative quote session', () => {
  it('uses only direct routing and its own bridge filter with explicit Gas Drop params', async () => {
    await act(async () => render('100', true))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    expect(mocks.getFallbackQuotes.mock.calls[0][0]).toMatchObject({
      quoteMode: 'direct',
      excludedSources: ['Across'],
      params: { amount: '100000000', gasDrop: true, sender: 'sender', recipient: 'recipient' },
    })
    expect(mocks.state.crossChainSwap.excludedSources).toEqual(['Relay'])
  })

  it('selects and reviews a non-first route from the same provider', async () => {
    await act(async () => render('100'))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    const request = mocks.getFallbackQuotes.mock.calls[0][0] as QuoteRequest
    const first = {
      id: 'first',
      adapter: { getName: () => 'KyberCross' },
      quote: { quoteParams: request.params, priceImpact: 0 },
    } as Quote
    const second = { ...first, id: 'second' }
    await act(async () => {
      request.onQuotes([first, second])
      request.onQuoteReady()
    })
    await act(async () => state.setSelectedQuoteId('second'))
    expect(state.selectedQuote).toBe(second)
    await act(async () => state.openReview(second))
    expect(state.reviewQuote?.id).toBe('second')
    expect(request.signal.aborted).toBe(true)
  })

  it('invalidates Gas Drop quotes immediately and ignores their late recovery callbacks', async () => {
    await act(async () => render('100', true))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    const previous = mocks.getFallbackQuotes.mock.calls[0][0] as QuoteRequest
    await act(async () => render('100', false))
    expect(previous.signal.aborted).toBe(true)
    await act(async () => previous.onQuotes([]))
    expect(mocks.unavailable).not.toHaveBeenCalled()
    expect(state.quotes).toEqual([])
  })

  it('reports a missing Gas Drop route without making the ordinary quote executable', async () => {
    await act(async () => render('100', true))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    const request = mocks.getFallbackQuotes.mock.calls[0][0] as QuoteRequest
    await act(async () => request.onQuotes([{ adapter: { getName: () => 'KyberCross' }, quote: {} } as Quote]))
    expect(state.quotes).toEqual([])
    expect(mocks.unavailable).toHaveBeenCalledOnce()
  })
})

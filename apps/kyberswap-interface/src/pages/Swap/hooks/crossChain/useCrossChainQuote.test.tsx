// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { getQuotes } from 'pages/CrossChainSwap/quote/adapterQuotes'
import type { Quote } from 'pages/CrossChainSwap/registry'
import { useCrossChainQuote } from 'pages/Swap/hooks/crossChain/useCrossChainQuote'

const mocks = vi.hoisted(() => ({
  connection: {},
  checkSameAsset: vi.fn(),
  getQuotes: vi.fn(),
  state: { crossChainSwap: { excludedSources: ['Relay'], quoteMode: 'direct' } },
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
vi.mock('pages/CrossChainSwap/factory', () => ({ registry: {} }))
vi.mock('pages/CrossChainSwap/adapters/RelayAdapter/relaySolanaWallet', () => ({ adaptRelaySolanaWallet: vi.fn() }))
vi.mock('pages/CrossChainSwap/quote/adapterQuotes', () => ({ getQuotes: mocks.getQuotes }))
vi.mock('pages/CrossChainSwap/quote/getPairInfo', () => ({
  getPairInfo: async () => ({ category: 'stablePair', feeBps: 10, tokenInUsd: 1, tokenOutUsd: 1 }),
}))

type Props = Parameters<typeof useCrossChainQuote>[0]
type QuoteRequest = Parameters<typeof getQuotes>[0]
const pair = {
  pairKey: '1:USDC-8453:USDC',
  fromChainId: 1,
  toChainId: 8453,
  currencyIn: { decimals: 6, symbol: 'USDC' },
  currencyOut: { decimals: 6, symbol: 'USDC' },
  nearTokens: [],
} as unknown as Props['pair']

let state: ReturnType<typeof useCrossChainQuote>
let root: ReturnType<typeof createRoot>
const render = (amount: string) => {
  root.render(<Harness pair={pair} amount={amount} sender="sender" receiver="recipient" isReadOnly={false} />)
}
function Harness(props: Props) {
  state = useCrossChainQuote(props)
  return null
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers()
  mocks.getQuotes.mockReset().mockImplementation(() => new Promise(() => undefined))
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('unified quote session after aggregator integration', () => {
  it('requests stream quotes with pair fees even when the legacy setting is direct', async () => {
    await act(async () => render('100'))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    expect(mocks.getQuotes).toHaveBeenCalledOnce()
    expect(mocks.getQuotes.mock.calls[0][0]).toMatchObject({
      quoteMode: 'stream',
      excludedSources: ['Relay'],
      params: { amount: '100000000', feeBps: 10, slippage: 50, sender: 'sender', recipient: 'recipient' },
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

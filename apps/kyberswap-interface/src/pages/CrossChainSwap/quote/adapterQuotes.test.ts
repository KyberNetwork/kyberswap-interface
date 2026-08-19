import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Currency, NormalizedQuote, QuoteParams, SwapProvider } from 'pages/CrossChainSwap/adapters'
import { CrossChainSwapFactory } from 'pages/CrossChainSwap/factory'
import { getFallbackQuotes } from 'pages/CrossChainSwap/quote/adapterQuotes'
import { CrossChainSwapAdapterRegistry } from 'pages/CrossChainSwap/registry'

const fromToken = { decimals: 18 } as Currency
const toToken = { decimals: 6 } as Currency
const params: QuoteParams = {
  feeBps: 10,
  fromChain: 1,
  toChain: 137,
  fromToken,
  toToken,
  amount: '1000000000000000000',
  slippage: 50,
  tokenInUsd: 1,
  tokenOutUsd: 1,
  sender: '0x1111111111111111111111111111111111111111',
  recipient: '0x2222222222222222222222222222222222222222',
}

const normalizedQuote: NormalizedQuote = {
  quoteParams: params,
  outputAmount: 1_000_000n,
  formattedOutputAmount: '1',
  inputUsd: 1,
  outputUsd: 1,
  rate: 1,
  timeEstimate: 60,
  priceImpact: 0,
  gasFeeUsd: 0,
  contractAddress: '0x3333333333333333333333333333333333333333',
  rawQuote: {},
  protocolFee: 0,
  platformFeePercent: 0.1,
}

const createAdapter = (getQuote: SwapProvider['getQuote'], name = 'KyberCross'): SwapProvider => ({
  getName: () => name,
  getIcon: () => '',
  getSupportedChains: () => [params.fromChain, params.toChain],
  getSupportedTokens: () => [],
  getQuote,
  executeSwap: vi.fn(),
  getTransactionStatus: vi.fn(),
  canSupport: () => true,
})

const runFallbackQuotes = (adapter: SwapProvider, signal: AbortSignal) => {
  vi.spyOn(CrossChainSwapFactory, 'getClientQuoteAdapters').mockReturnValue([adapter])
  vi.spyOn(CrossChainSwapFactory, 'getSelectableSources').mockReturnValue([adapter])

  const onQuotes = vi.fn()
  const onQuoteReady = vi.fn()
  const promise = getFallbackQuotes({
    params,
    category: 'commonPair',
    currencyIn: fromToken,
    currencyOut: toToken,
    excludedSources: [],
    registry: new CrossChainSwapAdapterRegistry(),
    signal,
    isReadOnly: false,
    onQuotes,
    onQuoteReady,
  })

  return { promise, onQuotes, onQuoteReady }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('getFallbackQuotes', () => {
  it('accepts any adapter quote that resolves before the common ten-second timeout', async () => {
    vi.useFakeTimers()
    const adapter = createAdapter(
      vi.fn(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve(normalizedQuote), 9_500)
          }),
      ),
      'Relay',
    )
    const controller = new AbortController()
    const { promise, onQuotes, onQuoteReady } = runFallbackQuotes(adapter, controller.signal)

    await vi.advanceTimersByTimeAsync(9_000)
    expect(onQuotes).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(500)
    await promise

    expect(onQuotes).toHaveBeenCalledWith([{ adapter, quote: normalizedQuote, isReadOnly: false }])
    expect(onQuoteReady).toHaveBeenCalledOnce()
  })

  it('times out and aborts any adapter quote after ten seconds', async () => {
    vi.useFakeTimers()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    let requestSignal: AbortSignal | undefined
    const getQuote = vi.fn((_params: QuoteParams, signal?: AbortSignal) => {
      requestSignal = signal
      return new Promise<NormalizedQuote>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
      })
    })
    const adapter = createAdapter(getQuote, 'Relay')
    const controller = new AbortController()
    const { promise, onQuotes, onQuoteReady } = runFallbackQuotes(adapter, controller.signal)
    const timeoutExpectation = expect(promise).rejects.toThrow('No valid quotes found')

    await vi.advanceTimersByTimeAsync(10_000)

    await timeoutExpectation
    expect(requestSignal?.aborted).toBe(true)
    expect(console.error).toHaveBeenCalledWith(
      'Failed to get quote from Relay:',
      expect.objectContaining({ message: 'Timeout' }),
    )
    expect(onQuotes).not.toHaveBeenCalled()
    expect(onQuoteReady).not.toHaveBeenCalled()
  })

  it('forwards cancellation to the adapter and never commits the stale quote', async () => {
    let requestSignal: AbortSignal | undefined
    const getQuote = vi.fn((_params: QuoteParams, signal?: AbortSignal) => {
      requestSignal = signal
      return new Promise<NormalizedQuote>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
      })
    })
    const adapter = createAdapter(getQuote)
    const controller = new AbortController()
    const { promise, onQuotes, onQuoteReady } = runFallbackQuotes(adapter, controller.signal)

    controller.abort()

    await expect(promise).rejects.toThrow('Cancelled')
    expect(getQuote).toHaveBeenCalledWith(expect.any(Object), expect.anything())
    expect(requestSignal?.aborted).toBe(true)
    expect(onQuotes).not.toHaveBeenCalled()
    expect(onQuoteReady).not.toHaveBeenCalled()
  })
})

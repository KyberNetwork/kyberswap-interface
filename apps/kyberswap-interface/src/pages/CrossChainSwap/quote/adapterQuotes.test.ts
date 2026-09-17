import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Currency, QuoteParams, SwapProvider } from 'pages/CrossChainSwap/adapters/types'
import { getQuotes } from 'pages/CrossChainSwap/quote/adapterQuotes'
import { CrossChainSwapAdapterRegistry } from 'pages/CrossChainSwap/registry'

vi.mock('constants/env', async importOriginal => ({
  ...(await importOriginal<typeof import('constants/env')>()),
  CROSSCHAIN_AGGREGATOR_API: 'https://aggregator.test',
}))

const fromToken = { decimals: 18, symbol: 'ETH' } as Currency
const toToken = { decimals: 6, symbol: 'USDC' } as Currency
const baseParams: QuoteParams = {
  feeBps: 10,
  fromChain: 1,
  toChain: 137,
  fromToken,
  toToken,
  amount: '1000000000000000000',
  slippage: 50,
  tokenInUsd: 2_000,
  tokenOutUsd: 1,
  sender: '0x1111111111111111111111111111111111111111',
  recipient: '0x2222222222222222222222222222222222222222',
}

const encoder = new TextEncoder()

const createReader = (...reads: Array<ReadableStreamReadResult<Uint8Array> | Error>) => ({
  read: vi.fn(async () => {
    const next = reads.shift()
    if (next instanceof Error) throw next
    return next ?? { done: true, value: undefined }
  }),
  cancel: vi.fn(),
})

const createResponse = (reader: ReturnType<typeof createReader>, ok = true, status = 200) =>
  ({ ok, status, body: { getReader: () => reader } } as unknown as Response)

const createAdapter = (getQuote: SwapProvider['getQuote'], name = 'Symbiosis'): SwapProvider => ({
  getName: () => name,
  getIcon: () => '',
  getSupportedChains: () => [1, 137],
  getSupportedTokens: () => [],
  getQuote,
  executeSwap: vi.fn(),
  getTransactionStatus: vi.fn(),
  canSupport: () => true,
})

const setup = (params: QuoteParams = baseParams, adapterName = 'Symbiosis') => {
  const getQuote = vi.fn()
  const adapter = createAdapter(getQuote, adapterName)
  const registry = new CrossChainSwapAdapterRegistry()
  registry.registerAdapter(adapter)
  const onQuotes = vi.fn()
  const onQuoteReady = vi.fn()

  const run = () =>
    getQuotes({
      params,
      category: 'commonPair',
      currencyIn: fromToken,
      currencyOut: toToken,
      excludedSources: [],
      registry,
      signal: new AbortController().signal,
      isReadOnly: false,
      onQuotes,
      onQuoteReady,
    })

  return { adapter, getQuote, onQuotes, onQuoteReady, run }
}

const quoteEvent = () =>
  `event: quote\ndata: ${JSON.stringify({
    provider: 'Symbiosis',
    outputAmount: '1000000',
    formattedOutputAmount: '1',
    inputUsd: 2_000,
    outputUsd: 1,
    rate: 1,
    timeEstimate: 60,
    priceImpact: 0,
    gasFeeUsd: 0,
    contractAddress: '0x3333333333333333333333333333333333333333',
    rawQuote: {},
    protocolFee: 0,
    platformFeePercent: 0.1,
    quoteParams: {},
  })}\n\n`

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getQuotes', () => {
  it('does not call a local adapter when the aggregator returns no quotes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(createResponse(createReader()))
    const { getQuote, onQuotes, run } = setup()

    await expect(run()).rejects.toThrow('No valid quotes found for the requested swap')

    expect(getQuote).not.toHaveBeenCalled()
    expect(onQuotes).not.toHaveBeenCalled()
  })

  it.each([
    ['an HTTP failure', () => Promise.resolve(createResponse(createReader(), false, 503)), 'HTTP error! status: 503'],
    ['a network failure', () => Promise.reject(new Error('network unavailable')), 'network unavailable'],
  ])('does not call a local adapter after %s', async (_name, fetchResult, expectedError) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(globalThis, 'fetch').mockImplementation(fetchResult)
    const { getQuote, run } = setup()

    await expect(run()).rejects.toThrow(expectedError)

    expect(getQuote).not.toHaveBeenCalled()
  })

  it('emits a valid streamed quote without calling the matching adapter getQuote', async () => {
    const reader = createReader({ done: false, value: encoder.encode(quoteEvent()) }, { done: true, value: undefined })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(createResponse(reader))
    const { adapter, getQuote, onQuotes, run } = setup()

    await run()

    expect(onQuotes).toHaveBeenCalledWith([
      expect.objectContaining({
        adapter,
        isReadOnly: false,
        quote: expect.objectContaining({ outputAmount: 1_000_000n }),
      }),
    ])
    expect(getQuote).not.toHaveBeenCalled()
  })

  it('does not fall back locally when the stream fails after emitting a quote', async () => {
    const reader = createReader({ done: false, value: encoder.encode(quoteEvent()) }, new Error('stream interrupted'))
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(createResponse(reader))
    const { getQuote, onQuotes, run } = setup()

    await expect(run()).rejects.toThrow('stream interrupted')

    expect(onQuotes).toHaveBeenCalledOnce()
    expect(getQuote).not.toHaveBeenCalled()
  })

  it('keeps using KyberSwap directly for a same-chain EVM quote', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(createResponse(createReader()))
    const params = { ...baseParams, toChain: baseParams.fromChain }
    const { adapter, getQuote, onQuotes, onQuoteReady, run } = setup(params, 'KyberSwap')
    const quote = { outputAmount: 1_000_000n }
    getQuote.mockResolvedValue(quote)

    await run()

    expect(fetch).not.toHaveBeenCalled()
    expect(getQuote).toHaveBeenCalledOnce()
    expect(getQuote).toHaveBeenCalledWith(params)
    expect(onQuotes).toHaveBeenCalledWith([{ adapter, quote, isReadOnly: false }])
    expect(onQuoteReady).toHaveBeenCalledOnce()
  })
})

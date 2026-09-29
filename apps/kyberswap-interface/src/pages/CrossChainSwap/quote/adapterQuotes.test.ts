import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import type { WalletClient } from 'viem'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Currency, NormalizedQuote, QuoteParams, SwapProvider } from 'pages/CrossChainSwap/adapters'
import { KyberCrossAdapter } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter'
import { type RoutePlan, kyberCrossApi } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/api'
import * as kyberCrossExecution from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/service'
import { CrossChainSwapFactory } from 'pages/CrossChainSwap/factory'
import { getFallbackQuotes, getQuotes } from 'pages/CrossChainSwap/quote/adapterQuotes'
import { CrossChainSwapAdapterRegistry, type Quote, getQuoteId } from 'pages/CrossChainSwap/registry'

vi.mock('@lifi/sdk', async importOriginal => ({
  ...(await importOriginal<typeof import('@lifi/sdk')>()),
  createConfig: vi.fn(),
}))

vi.mock('constants/env', async importOriginal => ({
  ...(await importOriginal<typeof import('constants/env')>()),
  CROSSCHAIN_AGGREGATOR_API: 'https://aggregator.test',
}))

const quoteMode = vi.hoisted(() => ({ streaming: true }))

vi.mock('pages/CrossChainSwap/utils', async importOriginal => ({
  ...(await importOriginal<typeof import('pages/CrossChainSwap/utils')>()),
  get ENABLE_CROSS_CHAIN_STREAM_API() {
    return quoteMode.streaming
  },
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

const normalizedQuote: NormalizedQuote = {
  quoteParams: baseParams,
  outputAmount: 1_000_000n,
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
}

const createAdapter = (getQuote: SwapProvider['getQuote'], name = 'KyberCross'): SwapProvider => ({
  getName: () => name,
  getIcon: () => '',
  getSupportedChains: () => [baseParams.fromChain, baseParams.toChain],
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
  quoteMode.streaming = true
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('getQuotes', () => {
  it('uses local adapters when streaming is disabled', async () => {
    quoteMode.streaming = false
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(createResponse(createReader()))
    const { adapter, getQuote, onQuotes, run } = setup(baseParams, 'KyberCross')
    vi.spyOn(CrossChainSwapFactory, 'getClientQuoteAdapters').mockReturnValue([adapter])
    getQuote.mockResolvedValue(normalizedQuote)

    await run()

    expect(fetch).not.toHaveBeenCalled()
    expect(getQuote).toHaveBeenCalledOnce()
    expect(onQuotes).toHaveBeenCalledWith([{ adapter, quote: normalizedQuote, isReadOnly: false }])
  })

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
    expect(getQuote).toHaveBeenCalledWith(params, expect.any(AbortSignal))
    expect(onQuotes).toHaveBeenCalledWith([{ adapter, quote, isReadOnly: false }])
    expect(onQuoteReady).toHaveBeenCalledOnce()
  })
})

const runFallbackQuotes = (adapter: SwapProvider, signal: AbortSignal) => {
  vi.spyOn(CrossChainSwapFactory, 'getClientQuoteAdapters').mockReturnValue([adapter])
  vi.spyOn(CrossChainSwapFactory, 'getSelectableSources').mockReturnValue([adapter])

  const onQuotes = vi.fn()
  const onQuoteReady = vi.fn()
  const promise = getFallbackQuotes({
    params: baseParams,
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

describe('CrossChainSwapFactory', () => {
  it.each([
    ['ccip', 'CCIP'],
    ['cctp_v2', 'CCTP V2'],
    ['cctp_v2_fast', 'CCTP V2 Fast'],
  ])('resolves source-only KyberCross provider %s', (providerId, expectedName) => {
    expect(CrossChainSwapFactory.getKyberCrossBridgeSource(providerId)?.getName()).toBe(expectedName)
  })
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

  it('allows KyberCross quotes up to the sixty-second timeout', async () => {
    vi.useFakeTimers()
    const adapter = createAdapter(
      vi.fn(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve(normalizedQuote), 59_500)
          }),
      ),
    )
    const controller = new AbortController()
    const { promise, onQuotes, onQuoteReady } = runFallbackQuotes(adapter, controller.signal)

    await vi.advanceTimersByTimeAsync(59_000)
    expect(onQuotes).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(500)
    await promise

    expect(onQuotes).toHaveBeenCalledWith([{ adapter, quote: normalizedQuote, isReadOnly: false }])
    expect(onQuoteReady).toHaveBeenCalledOnce()
  })

  it('times out and aborts KyberCross quotes after sixty seconds', async () => {
    vi.useFakeTimers()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
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
    const timeoutExpectation = expect(promise).rejects.toThrow('No valid quotes found')

    await vi.advanceTimersByTimeAsync(59_999)
    expect(requestSignal?.aborted).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await timeoutExpectation

    expect(requestSignal?.aborted).toBe(true)
    expect(console.error).toHaveBeenCalledWith(
      'Failed to get quote from KyberCross:',
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

describe('KyberCross route options', () => {
  const address = '0x1111111111111111111111111111111111111111'
  const params: QuoteParams = {
    ...baseParams,
    fromChain: ChainId.MAINNET,
    toChain: ChainId.BASE,
    fromToken: new Token(ChainId.MAINNET, address, 6, 'USDC'),
    toToken: new Token(ChainId.BASE, address, 6, 'USDC'),
    amount: '100000000',
    tokenInUsd: 1,
    tokenOutUsd: 1,
  }
  const createRoute = (id: string, output: string, time: number): RoutePlan => ({
    id,
    expires_at: '2026-09-28T00:00:00Z',
    flow_type: 'bridge_only',
    request: {
      from_chain: 'ethereum',
      from_token: address,
      from_token_decimals: 6,
      from_address: address,
      to_chain: 'base',
      to_token: address,
      to_token_decimals: 6,
      to_address: address,
      amount: params.amount,
      slippage_bps: 50,
    },
    expected_output_amount: output,
    min_output_amount: output,
    bridge: {
      provider: 'relay',
      lane_id: id,
      from_token: address,
      to_token: address,
      input_amount: params.amount,
      expected_output_amount: output,
      min_output_amount: output,
      expected_fill_time_sec: time,
      metadata: { execution_mode: 'deposit_address', deposit_address: address },
    },
  })

  it('shows every route and builds the chosen non-first route, including routes from the same bridge', async () => {
    quoteMode.streaming = false
    const routes = [createRoute('first', '98000000', 20), createRoute('second', '99000000', 40)]
    const apiQuote = vi.spyOn(kyberCrossApi, 'getQuote').mockResolvedValue({
      success: true,
      request_id: 'request',
      data: { route_plans: routes, ks_allowance_hub_address: address },
    })
    const adapter = new KyberCrossAdapter()
    const registry = new CrossChainSwapAdapterRegistry()
    registry.registerAdapter(adapter)
    vi.spyOn(CrossChainSwapFactory, 'getClientQuoteAdapters').mockReturnValue([adapter])
    vi.spyOn(CrossChainSwapFactory, 'getSelectableSources').mockReturnValue([adapter])
    const onQuotes = vi.fn<[Quote[]], void>()

    await getQuotes({
      params,
      registry,
      category: 'stablePair',
      currencyIn: params.fromToken,
      currencyOut: params.toToken,
      excludedSources: [],
      signal: new AbortController().signal,
      isReadOnly: true,
      onQuotes,
      onQuoteReady: vi.fn(),
    })

    expect(apiQuote).toHaveBeenCalledOnce()
    expect(apiQuote).toHaveBeenCalledWith(
      expect.objectContaining({ all_route_plans: true, partner_fee_bps: 0 }),
      expect.anything(),
    )
    const quotes = onQuotes.mock.calls[0][0]
    expect(quotes.map(getQuoteId)).toEqual(['KyberCross:second', 'KyberCross:first'])
    expect(quotes.map(q => q.isReadOnly)).toEqual([true, true])
    expect(
      quotes.map(q => [q.quote.formattedOutputAmount, q.quote.outputUsd, q.quote.priceImpact, q.quote.timeEstimate]),
    ).toEqual([
      ['99', 99, 1, 40],
      ['98', 98, 2, 20],
    ])
    expect(quotes[0].quote.rawQuote.data.route_plans).toEqual([routes[1]])
    expect(quotes[1].quote.rawQuote.data.route_plans).toEqual([routes[0]])

    const build = vi.spyOn(kyberCrossApi, 'build').mockResolvedValue({
      success: true,
      request_id: 'build',
      data: { tx: { to: address, data: '0x1234', value: '0' } },
    })
    const txHash = `0x${'1'.repeat(64)}` as const
    vi.spyOn(kyberCrossExecution, 'executeKyberCross').mockResolvedValue(txHash)
    const selected = quotes.find(q => getQuoteId(q) === 'KyberCross:second')
    if (!selected) throw new Error('Selected route missing')

    const result = await adapter.executeSwap({ ...selected, isReadOnly: false }, {} as WalletClient)

    expect(build).toHaveBeenCalledWith(routes[1])
    expect(result).toMatchObject({ routeId: 'second', outputAmount: '99000000', bridgeProvider: 'relay' })
    expect(routes).toHaveLength(2)
  })

  it('rejects an empty route list', async () => {
    vi.spyOn(kyberCrossApi, 'getQuote').mockResolvedValue({
      success: true,
      request_id: 'empty',
      data: { route_plans: [], ks_allowance_hub_address: address },
    })
    await expect(new KyberCrossAdapter().getQuote(params)).rejects.toThrow('No KyberCross route plans found')
  })
})

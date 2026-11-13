import { KyberCrossAdapter } from 'services/crossChain/adapters/KyberCrossAdapter'
import { KyberCross } from 'services/crossChain/adapters/KyberCrossAdapter/constants'
import { QuoteParams, QuoteProvider } from 'services/crossChain/adapters/types'
import { CrossChainSwapFactory } from 'services/crossChain/factory'
import { getSourceFilters, streamQuotes } from 'services/crossChain/quote/streamQuotes'
import { PairCategory, sortQuotesByNetOutput } from 'services/crossChain/quote/utils'
import { CrossChainSwapAdapterRegistry, Quote } from 'services/crossChain/registry'

import type { CrossChainQuoteMode } from 'state/crossChainSwap'
import { Currency, NOT_SUPPORTED_CHAINS_PRICE_SERVICE, isEvmChain } from 'types/crossChain'

const DEFAULT_QUOTE_TIMEOUT_MS = 10_000
const KYBERCROSS_QUOTE_TIMEOUT_MS = 60_000

type QuoteRunnerParams = {
  quoteMode: CrossChainQuoteMode
  params: QuoteParams
  category: PairCategory
  currencyIn: Currency
  currencyOut: Currency
  excludedSources: string[]
  registry: CrossChainSwapAdapterRegistry
  signal: AbortSignal
  isReadOnly: boolean
  onQuotes: (quotes: Quote[]) => void
  onQuoteReady: () => void
}

const getAdapterQuote = async (adapter: QuoteProvider, params: QuoteParams, signal: AbortSignal) => {
  if (signal.aborted) throw new Error('Cancelled')

  const quoteTimeoutMs = adapter.getName() === KyberCross ? KYBERCROSS_QUOTE_TIMEOUT_MS : DEFAULT_QUOTE_TIMEOUT_MS
  const requestController = new AbortController()
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let handleAbort: (() => void) | undefined

  const cancellationPromise = new Promise<never>((_, reject) => {
    handleAbort = () => {
      reject(new Error('Cancelled'))
      requestController.abort()
    }
    signal.addEventListener('abort', handleAbort, { once: true })

    timeoutId = setTimeout(() => {
      reject(new Error('Timeout'))
      requestController.abort()
    }, quoteTimeoutMs)
  })

  try {
    return await Promise.race([adapter.getQuote(params, requestController.signal), cancellationPromise])
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
    if (handleAbort) signal.removeEventListener('abort', handleAbort)
  }
}

export const isSameChainEvmSwap = (params: QuoteParams) =>
  params.fromChain === params.toChain &&
  isEvmChain(params.fromChain) &&
  !NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.fromChain) &&
  !NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.toChain)

export const getSameChainQuote = async ({
  params,
  category,
  currencyIn,
  currencyOut,
  registry,
  signal,
  isReadOnly,
  onQuotes,
  onQuoteReady,
}: QuoteRunnerParams) => {
  const kyberswapAdapter = registry.getQuoteAdapter('KyberSwap')
  const isKyberSwapSupported = kyberswapAdapter?.canSupport(category, currencyIn, currencyOut) ?? true

  if (kyberswapAdapter && isKyberSwapSupported) {
    try {
      console.log('Using KyberSwap adapter for same-chain swap')
      if (signal.aborted) throw new Error('Cancelled')

      const quote = await getAdapterQuote(kyberswapAdapter, params, signal)
      if (signal.aborted) throw new Error('Cancelled')

      onQuotes([{ adapter: kyberswapAdapter, quote, isReadOnly }])
      onQuoteReady()
      return
    } catch (error) {
      if ((error as Error).message === 'Cancelled' || signal.aborted) throw new Error('Cancelled')
      console.error('Failed to get quote from KyberSwap:', error)
      throw new Error('No valid quotes found for the requested swap')
    }
  }

  if (!isKyberSwapSupported) throw new Error('KyberSwap does not support this token pair category.')
  throw new Error('KyberSwap adapter not available')
}

export const getDirectQuotes = async ({
  quoteMode,
  params,
  category,
  currencyIn,
  currencyOut,
  excludedSources,
  signal,
  isReadOnly,
  onQuotes,
  onQuoteReady,
}: QuoteRunnerParams) => {
  const directQuotes: Quote[] = []
  const clientQuoteAdapters = CrossChainSwapFactory.getDirectQuoteAdapters()
  let clientAdapters = clientQuoteAdapters.filter(adapter => !excludedSources.includes(adapter.getName()))
  if (clientAdapters.length === 0) clientAdapters = clientQuoteAdapters

  const adapters = clientAdapters.filter(
    adapter =>
      adapter.getName() !== 'KyberSwap' &&
      (!params.gasDrop || adapter.getName() === KyberCross) &&
      adapter.getSupportedChains().includes(params.fromChain) &&
      adapter.getSupportedChains().includes(params.toChain),
  )

  const { selectableSources, includedSourceNames, excludedSourceNames } = getSourceFilters(
    quoteMode,
    excludedSources,
    category,
    currencyIn,
    currencyOut,
  )
  const isExcludedAllSources = selectableSources.every(source => excludedSources.includes(source.getName()))
  const quoteParams = isExcludedAllSources
    ? params
    : { ...params, includedSources: includedSourceNames, excludedSources: excludedSourceNames }

  await Promise.all(
    adapters.map(async adapter => {
      try {
        if (signal.aborted) throw new Error('Cancelled')
        if (!adapter.canSupport(category, currencyIn, currencyOut)) return

        const quote = await getAdapterQuote(adapter, quoteParams, signal)
        if (signal.aborted) throw new Error('Cancelled')

        const routeQuotes =
          adapter instanceof KyberCrossAdapter
            ? adapter.getRouteQuotes(quote, isReadOnly)
            : [{ adapter, quote, isReadOnly }]
        directQuotes.push(...routeQuotes)
        onQuotes(sortQuotesByNetOutput(directQuotes))
        onQuoteReady()
      } catch (error) {
        if ((error as Error).message === 'Cancelled' || signal.aborted) throw new Error('Cancelled')
        console.error(`Failed to get quote from ${adapter.getName()}:`, error)
      }
    }),
  )

  if (directQuotes.length === 0) throw new Error('No valid quotes found for the requested swap')
}

export const getQuotes = async (options: QuoteRunnerParams) => {
  if (isSameChainEvmSwap(options.params)) {
    await getSameChainQuote(options)
    return
  }

  if (options.quoteMode === 'direct') {
    await getDirectQuotes(options)
    return
  }

  try {
    await streamQuotes({ ...options, onSoftTimeout: options.onQuoteReady })
    return
  } catch (error) {
    if ((error as Error).message === 'Cancelled' || options.signal.aborted) throw new Error('Cancelled')
    console.error('Failed to get quotes from streaming API:', error)
    throw error
  }
}

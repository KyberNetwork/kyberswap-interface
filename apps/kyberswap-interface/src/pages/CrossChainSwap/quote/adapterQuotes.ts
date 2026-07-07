import {
  Currency,
  NOT_SUPPORTED_CHAINS_PRICE_SERVICE,
  NearQuoteParams,
  QuoteParams,
  SwapProvider,
} from 'pages/CrossChainSwap/adapters'
import { isEvmChain } from 'pages/CrossChainSwap/adapters/types'
import { CrossChainSwapFactory } from 'pages/CrossChainSwap/factory'
import { getSourceFilters, streamQuotes } from 'pages/CrossChainSwap/quote/streamQuotes'
import { PairCategory, createTimeoutPromise, sortQuotesByNetOutput } from 'pages/CrossChainSwap/quote/utils'
import { CrossChainSwapAdapterRegistry, Quote } from 'pages/CrossChainSwap/registry'

type QuoteRunnerParams = {
  params: QuoteParams | NearQuoteParams
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

export const isSameChainEvmSwap = (params: QuoteParams | NearQuoteParams) =>
  params.fromChain === params.toChain &&
  isEvmChain(params.fromChain) &&
  !NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.fromChain) &&
  !NOT_SUPPORTED_CHAINS_PRICE_SERVICE.includes(params.toChain)

export const getSameChainQuote = async ({
  params,
  category,
  currencyIn,
  currencyOut,
  excludedSources,
  registry,
  signal,
  isReadOnly,
  onQuotes,
  onQuoteReady,
}: QuoteRunnerParams) => {
  const kyberswapAdapter = registry.getAdapter('KyberSwap')
  const isKyberSwapExcluded =
    excludedSources.includes('KyberSwap') && excludedSources.length < registry.getAllAdapters().length
  const isKyberSwapSupported = kyberswapAdapter?.canSupport(category, currencyIn, currencyOut) ?? true

  if (kyberswapAdapter && !isKyberSwapExcluded && isKyberSwapSupported) {
    try {
      console.log('Using KyberSwap adapter for same-chain swap')
      if (signal.aborted) throw new Error('Cancelled')

      const quote = await Promise.race([kyberswapAdapter.getQuote(params), createTimeoutPromise(9_000)])
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

  if (isKyberSwapExcluded) throw new Error('KyberSwap is excluded. Please enable it for same-chain swaps.')
  if (!isKyberSwapSupported) throw new Error('KyberSwap does not support this token pair category.')
  throw new Error('KyberSwap adapter not available')
}

export const getFallbackQuotes = async ({
  params,
  category,
  currencyIn,
  currencyOut,
  excludedSources,
  registry,
  signal,
  isReadOnly,
  onQuotes,
  onQuoteReady,
}: QuoteRunnerParams) => {
  console.log('Falling back to client-side adapter getQuote...')

  const fallbackQuotes: Quote[] = []
  const clientQuoteAdapters = CrossChainSwapFactory.getClientQuoteAdapters()
  let clientAdapters = clientQuoteAdapters.filter(adapter => !excludedSources.includes(adapter.getName()))
  if (clientAdapters.length === 0) clientAdapters = clientQuoteAdapters

  const adapters = clientAdapters.filter(
    adapter =>
      adapter.getName() !== 'KyberSwap' &&
      adapter.getSupportedChains().includes(params.fromChain) &&
      adapter.getSupportedChains().includes(params.toChain),
  ) as SwapProvider[]

  await Promise.all(
    adapters.map(async adapter => {
      try {
        if (signal.aborted) throw new Error('Cancelled')
        if (!adapter.canSupport(category, currencyIn, currencyOut)) return

        const { selectableSources, includedSourceNames, excludedSourceNames } = getSourceFilters(
          registry,
          excludedSources,
          category,
          currencyIn,
          currencyOut,
        )
        const isExcludedAllSources = selectableSources.every(source => excludedSources.includes(source.getName()))
        const quoteParams = isExcludedAllSources
          ? params
          : { ...params, includedSources: includedSourceNames, excludedSources: excludedSourceNames }

        const quote = await Promise.race([adapter.getQuote(quoteParams), createTimeoutPromise(9_000)])
        if (signal.aborted) throw new Error('Cancelled')

        fallbackQuotes.push({ adapter, quote, isReadOnly })
        onQuotes(sortQuotesByNetOutput(fallbackQuotes))
        onQuoteReady()
      } catch (error) {
        if ((error as Error).message === 'Cancelled' || signal.aborted) throw new Error('Cancelled')
        console.error(`Failed to get quote from ${adapter.getName()}:`, error)
      }
    }),
  )

  if (fallbackQuotes.length === 0) throw new Error('No valid quotes found for the requested swap')
}

export const getQuotes = async (options: QuoteRunnerParams) => {
  if (isSameChainEvmSwap(options.params)) {
    await getSameChainQuote(options)
    return
  }

  try {
    await streamQuotes({ ...options, onSoftTimeout: options.onQuoteReady })
    return
  } catch (error) {
    if ((error as Error).message === 'Cancelled' || options.signal.aborted) throw new Error('Cancelled')
    console.error('Failed to get quotes from streaming API:', error)
  }

  await getFallbackQuotes(options)
}

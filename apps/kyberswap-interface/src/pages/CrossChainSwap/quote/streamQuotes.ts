import { CROSSCHAIN_AGGREGATOR_API } from 'constants/env'
import { Currency, NearQuoteParams, QuoteParams } from 'pages/CrossChainSwap/adapters'
import { PairCategory, getCurrencyAddress, sortQuotesByNetOutput } from 'pages/CrossChainSwap/quote/utils'
import { CrossChainSwapAdapterRegistry, Quote } from 'pages/CrossChainSwap/registry'

const SSE_EVENT = {
  INIT: 'init',
  QUOTE: 'quote',
  PROVIDER_ERROR: 'provider_error',
  COMPLETE: 'complete',
  ERROR: 'error',
} as const

const SOFT_TIMEOUT_MS = 4000

type StreamQuotesParams = {
  params: QuoteParams | NearQuoteParams
  category: PairCategory
  currencyIn: Currency
  currencyOut: Currency
  excludedSources: string[]
  registry: CrossChainSwapAdapterRegistry
  signal: AbortSignal
  isReadOnly: boolean
  onQuotes: (quotes: Quote[]) => void
  onSoftTimeout: () => void
}

const getSourceFilters = (
  registry: CrossChainSwapAdapterRegistry,
  excludedSources: string[],
  category: PairCategory,
  currencyIn: Currency,
  currencyOut: Currency,
) => {
  const allAdapters = registry.getAllAdapters()
  const supportedAdapters = allAdapters.filter(adapter => adapter.canSupport(category, currencyIn, currencyOut))
  const includedSourceNames = supportedAdapters
    .filter(adapter => !excludedSources.includes(adapter.getName()))
    .map(adapter => adapter.getName())
  const excludedSourceNames = allAdapters
    .filter(
      adapter => excludedSources.includes(adapter.getName()) || !adapter.canSupport(category, currencyIn, currencyOut),
    )
    .map(adapter => adapter.getName())

  return { allAdapters, includedSourceNames, excludedSourceNames }
}

const getStreamingUrl = ({
  params,
  category,
  currencyIn,
  currencyOut,
  excludedSources,
  registry,
}: Pick<StreamQuotesParams, 'params' | 'category' | 'currencyIn' | 'currencyOut' | 'excludedSources' | 'registry'>) => {
  const queryParams = new URLSearchParams({
    fromChain: params.fromChain.toString(),
    fromToken: getCurrencyAddress(params.fromToken),
    fromTokenDecimals: params.fromToken.decimals.toString(),
    fromAddress: params.sender,
    fromAmount: params.amount,
    toChain: params.toChain.toString(),
    toToken: getCurrencyAddress(params.toToken),
    toTokenDecimals: params.toToken.decimals.toString(),
    toAddress: params.recipient,
    fee: params.feeBps.toString(),
    integrator: 'kyberswap',
    stream: 'true',
    slippage: params.slippage.toString(),
    ...(params.tokenInUsd > 0 ? { fromTokenUsd: params.tokenInUsd.toString() } : {}),
    ...(params.tokenOutUsd > 0 ? { toTokenUsd: params.tokenOutUsd.toString() } : {}),
  })

  const { allAdapters, includedSourceNames, excludedSourceNames } = getSourceFilters(
    registry,
    excludedSources,
    category,
    currencyIn,
    currencyOut,
  )
  if (includedSourceNames.length > 0 && includedSourceNames.length < allAdapters.length) {
    queryParams.append('includedSources', includedSourceNames.join(','))
  }
  if (excludedSourceNames.length > 0) {
    queryParams.append('excludedSources', excludedSourceNames.join(','))
  }

  return `${CROSSCHAIN_AGGREGATOR_API}/api/v1/quotes?${queryParams.toString()}`
}

export const streamQuotes = async ({
  params,
  category,
  currencyIn,
  currencyOut,
  excludedSources,
  registry,
  signal,
  isReadOnly,
  onQuotes,
  onSoftTimeout,
}: StreamQuotesParams) => {
  if (signal.aborted) throw new Error('Cancelled')

  const quotes: Quote[] = []
  const softTimeoutTimer = setTimeout(() => {
    if (signal.aborted) return

    if (quotes.length > 0) {
      console.log(
        `[Soft Timeout] ${SOFT_TIMEOUT_MS}ms reached with ${quotes.length} quote(s). Enabling swap button while continuing to collect quotes.`,
      )
      onSoftTimeout()
    } else {
      console.log(`[Soft Timeout] ${SOFT_TIMEOUT_MS}ms reached but no quotes available yet.`)
    }
  }, SOFT_TIMEOUT_MS)

  try {
    const response = await fetch(
      getStreamingUrl({ params, category, currencyIn, currencyOut, excludedSources, registry }),
      { signal },
    )
    if (!response.ok) {
      console.error('Streaming API error response status:', response.status)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body reader available')

    const decoder = new TextDecoder()
    let buffer = ''
    let currentEvent = ''

    while (true) {
      if (signal.aborted) {
        reader.cancel()
        throw new Error('Cancelled')
      }

      const { done, value } = await reader.read()
      if (signal.aborted) throw new Error('Cancelled')
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line) continue

        if (line.startsWith('event:')) {
          currentEvent = line.startsWith('event: ') ? line.slice(7).trim() : line.slice(6).trim()
          continue
        }
        if (!line.startsWith('data:')) continue

        try {
          const jsonStr = line.startsWith('data: ') ? line.slice(6) : line.slice(5)
          const data = JSON.parse(jsonStr)

          if (currentEvent === SSE_EVENT.INIT) {
            console.log('SSE connection initialized. Request ID:', data.requestID)
            continue
          }
          if (currentEvent === SSE_EVENT.COMPLETE) {
            console.log(`All quotes received from streaming API. Total quotes: ${quotes.length}`)
            continue
          }
          if (currentEvent === SSE_EVENT.PROVIDER_ERROR) {
            console.error('Provider error from streaming API:', data)
            continue
          }
          if (currentEvent === SSE_EVENT.ERROR) {
            console.error('Error from streaming API:', data)
            continue
          }
          if (currentEvent !== SSE_EVENT.QUOTE) {
            console.log('Skipping non-quote event:', currentEvent)
            continue
          }

          const adapter = registry.getAdapter(data.provider)
          if (
            adapter &&
            excludedSources.includes(adapter.getName()) &&
            excludedSources.length < registry.getAllAdapters().length
          ) {
            console.log('Skipping excluded source:', adapter.getName())
            continue
          }
          if (adapter && !adapter.canSupport(category, currencyIn, currencyOut)) {
            console.log('Skipping unsupported category for source:', adapter.getName(), category)
            continue
          }
          if (!adapter) {
            console.warn(`Adapter not found in registry: ${data.provider}`)
            console.log(
              'Available adapters:',
              registry.getAllAdapters().map(item => item.getName()),
            )
            continue
          }

          console.log(`Received quote from ${adapter.getName()} with output amount: ${data.outputAmount}`)
          quotes.push({
            adapter,
            isReadOnly,
            quote: {
              quoteParams: {
                ...data.quoteParams,
                fromChain: params.fromChain,
                toChain: params.toChain,
                fromToken: params.fromToken,
                toToken: params.toToken,
                publicKey: params.publicKey,
                walletClient: params.walletClient,
                sender: params.sender,
                recipient: params.recipient,
              },
              outputAmount: BigInt(data.outputAmount),
              formattedOutputAmount: data.formattedOutputAmount,
              inputUsd: data.inputUsd,
              outputUsd: data.outputUsd,
              rate: data.rate,
              timeEstimate: data.timeEstimate,
              priceImpact: data.priceImpact,
              gasFeeUsd: data.gasFeeUsd,
              contractAddress: data.contractAddress,
              rawQuote: data.rawQuote,
              protocolFee: data.protocolFee,
              protocolFeeString: data.protocolFeeString,
              platformFeePercent: data.platformFeePercent,
            },
          })
          onQuotes(sortQuotesByNetOutput(quotes))
        } catch (error) {
          console.error('Failed to parse SSE data:', error)
          console.error('Problematic line:', line)
          console.error('Line length:', line.length)
        }
      }
    }
  } finally {
    clearTimeout(softTimeoutTimer)
  }

  if (quotes.length === 0) throw new Error('No valid quotes found for the requested swap')
}

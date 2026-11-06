import { useMemo, useState } from 'react'
import { registry } from 'services/crossChain/factory'
import { getPairInfo } from 'services/crossChain/quote/getPairInfo'
import { isEvmCurrency, sortQuotesByNetOutput } from 'services/crossChain/quote/utils'
import { Quote } from 'services/crossChain/registry'
import { useLazyCheckSameAssetQuery } from 'services/tokenCatalog'

import { getQuoteWarning } from 'components/SwapForm/CrossChain/hooks/getQuoteWarning'
import {
  QUOTE_EXPIRY_TIME,
  getQuotesForMode,
  selectGasDropQuotes,
  selectOrdinaryQuotes,
} from 'components/SwapForm/CrossChain/hooks/getQuotesForMode'
import {
  CrossChainQuoteInput,
  useCrossChainQuoteRequest,
} from 'components/SwapForm/CrossChain/hooks/useCrossChainQuoteRequest'
import { useQuotePool } from 'components/SwapForm/CrossChain/hooks/useQuotePool'
import { QuoteLoadContext, useQuoteSession } from 'components/SwapForm/CrossChain/hooks/useQuoteSession'
import { useAppSelector } from 'state/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { isEvmChain } from 'types/crossChain'
import { isNativeAsset } from 'utils/nativeErc20'

const EMPTY_SOURCES: string[] = []
const GAS_DROP_MIN_OUTPUT_USD = 2.2
const providerKey = (quote: Quote) => quote.adapter.getName()

/** Unified Swap always requests aggregator quotes; branch flags and settings cannot change this. */
export const useCrossChainQuote = (input: CrossChainQuoteInput) => {
  const base = useCrossChainQuoteRequest(input)
  const excludedSources = useAppSelector(state => state.crossChainSwap.excludedSources) || EMPTY_SOURCES
  const selectionRequest = useMemo(() => ({ ...base, excludedSources }), [base, excludedSources])
  const { currencyOut, fromChainId, toChainId } = input.pair
  const gasDropSupported = fromChainId !== toChainId && isEvmCurrency(currencyOut) && !isNativeAsset(currencyOut)
  const [slippage] = useUserSlippageTolerance()
  const [checkSameAsset] = useLazyCheckSameAssetQuery()

  const loadQuoteMode = async ({ signal, publish }: QuoteLoadContext, gasDrop: boolean) => {
    const params = selectionRequest.params
    if (!params) return

    const pairInfo = await getPairInfo({
      gasDrop,
      currencyIn: params.fromToken,
      currencyOut: params.toToken,
      fromChainId: params.fromChain,
      toChainId: params.toChain,
      checkSameAsset: params => checkSameAsset(params, true),
      signal,
    })

    if (!pairInfo || signal.aborted) return

    publish({ category: pairInfo.category })

    await getQuotesForMode({
      params: {
        ...params,
        gasDrop,
        feeBps: pairInfo.feeBps,
        tokenInUsd: pairInfo.tokenInUsd,
        tokenOutUsd: pairInfo.tokenOutUsd,
        gasDropTokenUsd: pairInfo.gasDropTokenUsd,
      },
      category: pairInfo.category,
      currencyIn: params.fromToken,
      currencyOut: params.toToken,
      excludedSources,
      registry,
      signal,
      isReadOnly: selectionRequest.isReadOnly,
      onQuotes: quotes => publish({ quotes }),
      onQuoteReady: () => publish({ loading: false }),
    })
  }

  const ordinaryPool = useQuotePool(selectionRequest, context => loadQuoteMode(context, false))
  const gasDropPool = useQuotePool(selectionRequest, context => loadQuoteMode(context, true))
  const ordinaryQuotes = ordinaryPool.snapshot?.quotes ?? []
  const gasDropAvailable =
    gasDropSupported &&
    ordinaryQuotes.some(
      ({ adapter, quote }) =>
        adapter.getName() === 'KyberCross' &&
        Number.isFinite(quote.outputUsd) &&
        quote.outputUsd > GAS_DROP_MIN_OUTPUT_USD,
    )
  const [gasDropSelection, setGasDropSelection] = useState({ request: selectionRequest, enabled: false })
  const gasDropEnabled = gasDropAvailable && gasDropSelection.request === selectionRequest && gasDropSelection.enabled
  if (gasDropSelection.request === selectionRequest && gasDropSelection.enabled && !gasDropAvailable) {
    setGasDropSelection({ request: selectionRequest, enabled: false })
  }
  const request = useMemo(() => ({ ...selectionRequest, gasDrop: gasDropEnabled }), [selectionRequest, gasDropEnabled])

  const [unsupportedRequest, setUnsupportedRequest] = useState<typeof selectionRequest | null>(null)

  const activePool = gasDropEnabled ? gasDropPool : ordinaryPool
  const loadQuotes = async (context: QuoteLoadContext) => {
    const hasQuotes = await activePool.load(context)
    if (gasDropEnabled && !context.signal.aborted && !hasQuotes) {
      setUnsupportedRequest(selectionRequest)
      setGasDropSelection({ request: selectionRequest, enabled: false })
    }
  }

  const session = useQuoteSession({
    request,
    loadQuotes,
    refreshSeconds: QUOTE_EXPIRY_TIME / 1000,
    getQuoteKey: providerKey,
    selectQuotes: gasDropEnabled ? selectGasDropQuotes : selectOrdinaryQuotes,
    initialSnapshot: activePool.reusableSnapshot,
  })
  const warning = getQuoteWarning({
    selectedQuote: session.selectedQuote,
    category: session.category,
    isEvmPair: isEvmChain(input.pair.fromChainId) && isEvmChain(input.pair.toChainId),
    slippage,
  })

  return {
    ...session,
    routeOptions: gasDropEnabled
      ? [...sortQuotesByNetOutput(session.quotes), ...sortQuotesByNetOutput(ordinaryQuotes)]
      : session.quotes,
    amountInWei: request.params?.amount,
    slippage,
    warning,
    gasDropAvailable,
    gasDropUnsupported: unsupportedRequest === selectionRequest,
    gasDropEnabled,
    prepareGasDrop: gasDropPool.prepare,
    setGasDropEnabled: (enabled: boolean) => setGasDropSelection({ request: selectionRequest, enabled }),
    selectRoute: (quote: Quote) => {
      session.setSelectedKey(providerKey(quote))
      setGasDropSelection({
        request: selectionRequest,
        enabled: !!quote.quote.quoteParams.gasDrop,
      })
    },
  }
}

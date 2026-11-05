import { useMemo, useState } from 'react'
import { useLazyCheckSameAssetQuery } from 'services/tokenCatalog'
import { formatUnits } from 'viem'

import { getQuoteWarning } from 'components/SwapForm/CrossChain/hooks/getQuoteWarning'
import {
  CrossChainQuoteInput,
  useCrossChainQuoteRequest,
} from 'components/SwapForm/CrossChain/hooks/useCrossChainQuoteRequest'
import { useGasDropPrefetch } from 'components/SwapForm/CrossChain/hooks/useGasDropPrefetch'
import { QuoteLoadContext, useQuoteSession } from 'components/SwapForm/CrossChain/hooks/useQuoteSession'
import { registry } from 'pages/Swap/crossChain/factory'
import { getPairInfo } from 'pages/Swap/crossChain/quote/getPairInfo'
import {
  getQuotesForMode,
  selectGasDropQuotes,
  selectOrdinaryQuotes,
} from 'pages/Swap/crossChain/quote/getQuotesForMode'
import { isEvmCurrency } from 'pages/Swap/crossChain/quote/utils'
import { Quote } from 'pages/Swap/crossChain/registry'
import { useAppSelector } from 'state/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { isEvmChain } from 'types/crossChain'
import { isNativeAsset } from 'utils/nativeErc20'

const EMPTY_SOURCES: string[] = []
const providerKey = (quote: Quote) => quote.adapter.getName()

/** Unified Swap always requests aggregator quotes; branch flags and settings cannot change this. */
export const useCrossChainQuote = (input: CrossChainQuoteInput) => {
  const base = useCrossChainQuoteRequest(input)
  const excludedSources = useAppSelector(state => state.crossChainSwap.excludedSources) || EMPTY_SOURCES
  const selectionRequest = useMemo(() => ({ ...base, excludedSources }), [base, excludedSources])
  const { currencyOut, fromChainId, toChainId } = input.pair
  const gasDropSupported = fromChainId !== toChainId && isEvmCurrency(currencyOut) && !isNativeAsset(currencyOut)
  // Only the route mode resets with this request; keep the form and its focus mounted.
  const [eligibility, setEligibility] = useState({ request: selectionRequest, available: false })
  const gasDropAvailable = gasDropSupported && eligibility.request === selectionRequest && eligibility.available
  const [gasDropSelection, setGasDropSelection] = useState({ request: selectionRequest, enabled: false })
  const gasDropEnabled = gasDropAvailable && gasDropSelection.request === selectionRequest && gasDropSelection.enabled
  if (gasDropSelection.request === selectionRequest && gasDropSelection.enabled && !gasDropAvailable) {
    setGasDropSelection({ request: selectionRequest, enabled: false })
  }
  const request = useMemo(() => ({ ...selectionRequest, gasDrop: gasDropEnabled }), [selectionRequest, gasDropEnabled])

  const [unsupportedRequest, setUnsupportedRequest] = useState<typeof selectionRequest | null>(null)

  const [slippage] = useUserSlippageTolerance()
  const [checkSameAsset] = useLazyCheckSameAssetQuery()

  const loadQuoteMode = async ({ signal, publish }: QuoteLoadContext, gasDrop: boolean) => {
    const params = selectionRequest.params
    if (!params) return { available: false, hasQuotes: false }

    const pairInfo = await getPairInfo({
      currencyIn: params.fromToken,
      currencyOut: params.toToken,
      fromChainId: params.fromChain,
      toChainId: params.toChain,
      checkSameAsset: params => checkSameAsset(params, true),
      signal,
    })

    if (!pairInfo || signal.aborted) return { available: false, hasQuotes: false }

    const inputUsd = Number(formatUnits(BigInt(params.amount), params.fromToken.decimals)) * pairInfo.tokenInUsd
    const available = gasDropSupported && Number.isFinite(inputUsd) && inputUsd > 2.2
    if (!gasDrop) setEligibility({ request: selectionRequest, available })
    if (gasDrop && !available) return { available, hasQuotes: false }

    publish({ category: pairInfo.category })

    let hasQuotes = false
    await getQuotesForMode({
      params: {
        ...params,
        gasDrop,
        feeBps: pairInfo.feeBps,
        tokenInUsd: pairInfo.tokenInUsd,
        tokenOutUsd: pairInfo.tokenOutUsd,
      },
      category: pairInfo.category,
      currencyIn: params.fromToken,
      currencyOut: params.toToken,
      excludedSources,
      registry,
      signal,
      isReadOnly: request.isReadOnly,
      onQuotes: quotes => {
        hasQuotes = quotes.length > 0
        publish({ quotes })
      },
      onQuoteReady: () => publish({ loading: false }),
    })
    return { available, hasQuotes }
  }

  const gasDropPrefetch = useGasDropPrefetch(selectionRequest, context => loadQuoteMode(context, true))
  const loadQuotes = async (context: QuoteLoadContext) => {
    const result = gasDropEnabled ? await gasDropPrefetch.load(context) : await loadQuoteMode(context, false)
    if (gasDropEnabled && !context.signal.aborted) {
      setEligibility({ request: selectionRequest, available: result.available })
      if (!result.hasQuotes) {
        if (result.available) setUnsupportedRequest(selectionRequest)
        setGasDropSelection({ request: selectionRequest, enabled: false })
      }
    }
  }

  const session = useQuoteSession({
    request,
    loadQuotes,
    refreshSeconds: 60,
    getQuoteKey: providerKey,
    selectQuotes: gasDropEnabled ? selectGasDropQuotes : selectOrdinaryQuotes,
  })
  const warning = getQuoteWarning({
    selectedQuote: session.selectedQuote,
    category: session.category,
    isEvmPair: isEvmChain(input.pair.fromChainId) && isEvmChain(input.pair.toChainId),
    slippage,
  })

  return {
    ...session,
    amountInWei: request.params?.amount,
    slippage,
    warning,
    gasDropAvailable,
    gasDropUnsupported: unsupportedRequest === selectionRequest,
    gasDropEnabled,
    prepareGasDrop: gasDropPrefetch.prepare,
    setGasDropEnabled: (enabled: boolean) => setGasDropSelection({ request: selectionRequest, enabled }),
    setSelectedAdapter: session.setSelectedKey,
  }
}

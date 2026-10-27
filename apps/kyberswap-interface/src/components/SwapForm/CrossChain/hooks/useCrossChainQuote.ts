import { useMemo } from 'react'
import { useLazyCheckSameAssetQuery } from 'services/tokenCatalog'

import { getQuoteWarning } from 'components/SwapForm/CrossChain/hooks/getQuoteWarning'
import {
  CrossChainQuoteInput,
  useCrossChainQuoteRequest,
} from 'components/SwapForm/CrossChain/hooks/useCrossChainQuoteRequest'
import { QuoteLoadContext, useQuoteSession } from 'components/SwapForm/CrossChain/hooks/useQuoteSession'
import { isEvmChain } from 'pages/Swap/crossChain/adapters/types'
import { registry } from 'pages/Swap/crossChain/factory'
import { getQuotes } from 'pages/Swap/crossChain/quote/adapterQuotes'
import { getPairInfo } from 'pages/Swap/crossChain/quote/getPairInfo'
import { Quote } from 'pages/Swap/crossChain/registry'
import { useAppSelector } from 'state/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'

const EMPTY_SOURCES: string[] = []
const providerKey = (quote: Quote) => quote.adapter.getName()

/** Unified Swap always requests aggregator quotes; branch flags and settings cannot change this. */
export const useCrossChainQuote = (input: CrossChainQuoteInput) => {
  const base = useCrossChainQuoteRequest(input)
  const excludedSources = useAppSelector(state => state.crossChainSwap.excludedSources) || EMPTY_SOURCES
  const request = useMemo(() => ({ ...base, excludedSources }), [base, excludedSources])

  const [slippage] = useUserSlippageTolerance()
  const [checkSameAsset] = useLazyCheckSameAssetQuery()

  const loadQuotes = async ({ signal, publish }: QuoteLoadContext) => {
    const params = request.params
    if (!params) return

    const pairInfo = await getPairInfo({
      currencyIn: params.fromToken,
      currencyOut: params.toToken,
      fromChainId: params.fromChain,
      toChainId: params.toChain,
      checkSameAsset: params => checkSameAsset(params, true),
      signal,
    })

    if (!pairInfo || signal.aborted) return

    publish({ category: pairInfo.category })

    await getQuotes({
      quoteMode: 'stream',
      params: {
        ...params,
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
      onQuotes: quotes => publish({ quotes }),
      onQuoteReady: () => publish({ loading: false }),
    })
  }

  const session = useQuoteSession({ request, loadQuotes, refreshSeconds: 10, getQuoteKey: providerKey })
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
    setSelectedAdapter: session.setSelectedKey,
  }
}

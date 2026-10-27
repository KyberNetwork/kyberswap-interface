import { t } from '@lingui/macro'
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
import { getFallbackQuotes } from 'pages/Swap/crossChain/quote/adapterQuotes'
import { getPairInfo } from 'pages/Swap/crossChain/quote/getPairInfo'
import { getQuoteId } from 'pages/Swap/crossChain/registry'
import { useAppSelector } from 'state/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'

const EMPTY_SOURCES: string[] = []
type Props = CrossChainQuoteInput & {
  gasDropEnabled: boolean
  onGasDropUnavailable: (message: string) => void
}

/** Only the derivative owns direct routing, bridge filters and Gas Drop quote recovery. */
export const useKyberCrossQuote = ({ gasDropEnabled, onGasDropUnavailable, ...input }: Props) => {
  const base = useCrossChainQuoteRequest(input)
  const excludedSources = useAppSelector(state => state.crossChainSwap.kyberCrossExcludedSources) || EMPTY_SOURCES
  const request = useMemo(
    () => ({
      ...base,
      excludedSources,
      params: base.params ? { ...base.params, gasDrop: gasDropEnabled } : null,
    }),
    [base, excludedSources, gasDropEnabled],
  )
  const [slippage] = useUserSlippageTolerance()
  const [checkSameAsset] = useLazyCheckSameAssetQuery()
  const loadQuotes = async ({ signal, publish }: QuoteLoadContext) => {
    const params = request.params
    if (!params) return
    try {
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
      await getFallbackQuotes({
        quoteMode: 'direct',
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
        onQuotes: quotes => {
          if (signal.aborted) return
          const available = params.gasDrop ? quotes.filter(item => item.quote.gasDrop) : quotes
          publish({ quotes: available })
          if (params.gasDrop && !available.length)
            onGasDropUnavailable(t`Gas Drop is no longer available for this route`)
        },
        onQuoteReady: () => publish({ loading: false }),
      })
    } catch (error) {
      if (!signal.aborted && params.gasDrop)
        onGasDropUnavailable(t`Unable to get a Gas Drop quote. Please try again or adjust your amount or route.`)
      throw error
    }
  }
  const session = useQuoteSession({ request, loadQuotes, refreshSeconds: 60, getQuoteKey: getQuoteId })
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
    setSelectedQuoteId: session.setSelectedKey,
  }
}

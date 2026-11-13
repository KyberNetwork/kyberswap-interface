import { useMemo, useState } from 'react'
import { KyberCross } from 'services/crossChain/adapters/KyberCrossAdapter/constants'
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

/**
 * Owns Unified Swap's quote policy: Gas Drop eligibility, mode changes and Route Options.
 *
 * Three input-scoped pools keep full ordinary, Gas Drop and ordinary-without-KyberCross
 * results separate. The session owns selection/review and schedules refreshes; pools own
 * transport and cache. All requests use the aggregator, regardless of legacy mode settings.
 *
 * Initial Gas Drop availability requires an eligible ordinary KyberCross route. Carrying
 * it across amount/slippage edits additionally requires an existing KyberCross Gas Drop
 * route and a sufficient estimate from ordinary quotes of any provider. Those references
 * inform whether to request new quotes; they are never adopted as executable new-input quotes.
 * See ../Quote/README.md for decisions, source precedence and lifecycle contracts.
 */
export const useCrossChainQuote = (input: CrossChainQuoteInput) => {
  const base = useCrossChainQuoteRequest(input)
  const excludedSources = useAppSelector(state => state.crossChainSwap.excludedSources) || EMPTY_SOURCES
  const selectionRequest = useMemo(() => ({ ...base, excludedSources }), [base, excludedSources])
  const { currencyOut, fromChainId, toChainId } = input.pair
  const gasDropSupported = fromChainId !== toChainId && isEvmCurrency(currencyOut) && !isNativeAsset(currencyOut)
  const [slippage] = useUserSlippageTolerance()
  const [checkSameAsset] = useLazyCheckSameAssetQuery()

  const loadQuoteMode = async (
    { signal, publish }: QuoteLoadContext,
    gasDrop: boolean,
    sourcesToExclude = excludedSources,
  ) => {
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
      excludedSources: sourcesToExclude,
      registry,
      signal,
      isReadOnly: selectionRequest.isReadOnly,
      onQuotes: quotes => publish({ quotes }),
      onQuoteReady: () => publish({ loading: false }),
    })
  }

  /** Full provider comparison and the executable pool when Gas Drop is off. */
  const ordinaryPool = useQuotePool(selectionRequest, context => loadQuoteMode(context, false))
  /** Executable pool when Gas Drop is on; preparation may start before confirmation. */
  const gasDropPool = useQuotePool(selectionRequest, context => loadQuoteMode(context, true))
  /** Comparison/estimate only. Must never substitute for a full ordinary request on disable. */
  const alternativePool = useQuotePool(selectionRequest, context =>
    loadQuoteMode(context, false, [...new Set([...excludedSources, KyberCross])]),
  )
  const ordinaryQuotes = ordinaryPool.snapshot?.quotes ?? []
  const alternatives = alternativePool.snapshot
  // Pools share the same TTL, so completion deadlines also order settled results.
  // Prefer refreshing alternatives, including an empty response, over the previous full result.
  // A newer full ordinary result takes over after switching modes.
  const useAlternatives =
    alternatives && (alternatives.allLoading || (alternatives.expiresAt ?? 0) > (ordinaryPool.snapshot?.expiresAt ?? 0))
  const routeOrdinaryQuotes = useAlternatives ? alternatives.quotes : ordinaryQuotes
  const estimateQuote = sortQuotesByNetOutput(
    routeOrdinaryQuotes.filter(({ quote }) => Number.isFinite(quote.outputUsd) && quote.outputUsd >= 0),
  )[0]
  const eligibleOrdinaryQuote = ordinaryQuotes.find(
    ({ adapter, quote }) =>
      adapter.getName() === KyberCross && Number.isFinite(quote.outputUsd) && quote.outputUsd > GAS_DROP_MIN_OUTPUT_USD,
  )
  /** Mode plus pre-edit evidence; references survive pool invalidation only for the carry decision. */
  const [gasDropSelection, setGasDropSelection] = useState({
    request: selectionRequest,
    enabled: false,
    eligibilityQuote: undefined as Quote | undefined,
    hasKyberCrossGasDrop: false,
  })
  // An empty pending pool is not evidence that the previously confirmed route is unavailable.
  const hasKyberCrossGasDrop =
    !!gasDropPool.snapshot?.quotes.some(
      ({ adapter, quote }) => adapter.getName() === KyberCross && quote.quoteParams.gasDrop && quote.gasDrop,
    ) ||
    ((!gasDropPool.snapshot || gasDropPool.snapshot.allLoading) &&
      gasDropSelection.enabled &&
      gasDropSelection.hasKyberCrossGasDrop)
  const previousParams = gasDropSelection.request.params
  const params = selectionRequest.params
  const eligibilityQuote = gasDropSelection.eligibilityQuote
  /**
   * Only amount/slippage edits may carry Gas Drop. Scale the saved ordinary output USD
   * by the input ratio (1 for slippage-only edits); exactly $2.2 is insufficient.
   * Ordinary alternatives need not be KyberCross, but the prior Gas Drop pool must
   * contain a real KyberCross allocation. Pair/address/source changes reset the mode.
   */
  const canCarryGasDrop =
    gasDropSelection.enabled &&
    gasDropSelection.hasKyberCrossGasDrop &&
    gasDropSupported &&
    params &&
    previousParams &&
    gasDropSelection.request.pairKey === selectionRequest.pairKey &&
    gasDropSelection.request.isReadOnly === selectionRequest.isReadOnly &&
    gasDropSelection.request.excludedSources === selectionRequest.excludedSources &&
    Object.entries(previousParams).every(
      ([key, value]) => key === 'amount' || key === 'slippage' || params[key as keyof typeof params] === value,
    ) &&
    eligibilityQuote &&
    Number.isFinite(eligibilityQuote.quote.outputUsd) &&
    (Number(params.amount) / Number(eligibilityQuote.quote.quoteParams.amount)) * eligibilityQuote.quote.outputUsd >
      GAS_DROP_MIN_OUTPUT_USD
  if (gasDropSelection.request !== selectionRequest) {
    setGasDropSelection({
      request: selectionRequest,
      enabled: !!canCarryGasDrop,
      eligibilityQuote,
      hasKyberCrossGasDrop: !!canCarryGasDrop,
    })
  }
  const gasDropAvailable =
    gasDropSupported &&
    (!!eligibleOrdinaryQuote ||
      (!ordinaryPool.snapshot &&
        (gasDropSelection.request === selectionRequest ? gasDropSelection.enabled : !!canCarryGasDrop)))
  const gasDropEnabled = gasDropAvailable && gasDropSelection.request === selectionRequest && gasDropSelection.enabled
  if (gasDropSelection.request === selectionRequest && gasDropSelection.enabled && !gasDropAvailable) {
    setGasDropSelection({ request: selectionRequest, enabled: false, eligibilityQuote, hasKyberCrossGasDrop })
  } else if (
    gasDropEnabled &&
    ((estimateQuote && estimateQuote !== eligibilityQuote) ||
      hasKyberCrossGasDrop !== gasDropSelection.hasKyberCrossGasDrop)
  ) {
    // Ordinary alternatives can exclude KyberCross. Keep their latest output for the next input edit.
    setGasDropSelection({
      ...gasDropSelection,
      eligibilityQuote: estimateQuote ?? eligibilityQuote,
      hasKyberCrossGasDrop,
    })
  }
  const request = useMemo(() => ({ ...selectionRequest, gasDrop: gasDropEnabled }), [selectionRequest, gasDropEnabled])

  const [unsupportedRequest, setUnsupportedRequest] = useState<typeof selectionRequest | null>(null)

  const activePool = gasDropEnabled ? gasDropPool : ordinaryPool
  /**
   * Runs the active mode and, when needed, comparison alternatives in parallel.
   * Alternatives never block Gas Drop readiness or publish into the active session.
   * An unusable Gas Drop response changes mode so the session adopts/loads the full
   * ordinary pool, rather than executing an alternatives-only result.
   */
  const loadQuotes = async (context: QuoteLoadContext) => {
    // Refresh the comparison routes with Gas Drop, without also requesting ordinary KyberCross.
    // The initial mode switch can still reuse the full ordinary quotes already loaded.
    if (gasDropEnabled && (context.forceRefresh || !ordinaryPool.snapshot)) {
      void alternativePool.load({ ...context, publish: () => undefined })
    }
    const hasQuotes = await activePool.load(context)
    if (gasDropEnabled && !context.signal.aborted && !hasQuotes) {
      setUnsupportedRequest(selectionRequest)
      setGasDropSelection({ request: selectionRequest, enabled: false, eligibilityQuote, hasKyberCrossGasDrop: false })
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

  const gasDropProviders = new Set(session.quotes.map(providerKey))

  return {
    ...session,
    refreshAfterSubmit: () => {
      ordinaryPool.invalidate()
      gasDropPool.invalidate()
      alternativePool.invalidate()
      session.refreshAfterSubmit()
    },
    routeOptions: gasDropEnabled
      ? [
          ...sortQuotesByNetOutput(session.quotes),
          ...sortQuotesByNetOutput(routeOrdinaryQuotes.filter(quote => !gasDropProviders.has(providerKey(quote)))),
        ]
      : session.quotes,
    amountInWei: request.params?.amount,
    slippage,
    warning,
    gasDropAvailable,
    gasDropUnsupported: unsupportedRequest === selectionRequest,
    gasDropEnabled,
    prepareGasDrop: gasDropPool.prepare,
    setGasDropEnabled: (enabled: boolean) =>
      setGasDropSelection({
        request: selectionRequest,
        enabled,
        eligibilityQuote: estimateQuote ?? eligibilityQuote,
        hasKyberCrossGasDrop,
      }),
    selectRoute: (quote: Quote) => {
      session.setSelectedKey(providerKey(quote))
      setGasDropSelection({
        request: selectionRequest,
        enabled: !!quote.quote.quoteParams.gasDrop,
        eligibilityQuote: estimateQuote ?? eligibilityQuote,
        hasKyberCrossGasDrop,
      })
    },
  }
}

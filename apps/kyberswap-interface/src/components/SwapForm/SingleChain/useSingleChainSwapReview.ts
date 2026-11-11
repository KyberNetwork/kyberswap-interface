import { Currency } from '@kyberswap/ks-sdk-core'
import { useCallback, useLayoutEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { calculatePriceImpact } from 'services/route/utils'

import { getFeeInfoForMixPanel, getSwapConfirmedTracking } from 'components/SwapForm/SingleChain/swapTracking'
import useSingleChainSwapExecution from 'components/SwapForm/SingleChain/useSingleChainSwapExecution'
import { usePriceImpactDegenMode } from 'components/SwapForm/SwapActionButton/usePriceImpactDegenMode'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import type { BuildReview, SubmitReview, SwapReviewState } from 'components/SwapForm/hooks/useSwapReviewSession'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { Field, permitError } from 'state/swap/actions'
import { useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import { DetailedRouteSummary } from 'types/route'
import { minimumAmountAfterSlippage } from 'utils/currencyAmount'

type SingleChainSwapReviewParams = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  routeSummary: DetailedRouteSummary | undefined
  review: SwapReviewState
  isPermitSwap?: boolean
  buildRoute: BuildReview
  openReviewSession: (build: BuildReview) => Promise<void>
  rebuildReviewSession: (build: BuildReview) => Promise<void>
  confirmReviewSession: (submit: SubmitReview, onError: (message: string) => void) => Promise<void>
  dismissReviewSession: () => void
}

/** Connects the review session to execution; UI consumers only open, confirm or dismiss it. */
export const useSingleChainSwapReview = ({
  currencyIn,
  currencyOut,
  routeSummary,
  review,
  isPermitSwap,
  buildRoute,
  openReviewSession,
  rebuildReviewSession,
  confirmReviewSession,
  dismissReviewSession,
}: SingleChainSwapReviewParams) => {
  const { chainId, account, networkInfo } = useActiveWeb3React()
  const { displayTypedValue } = useSwapFormContext()
  const dispatch = useDispatch()
  const { trackingHandler } = useTracking({
    [Field.INPUT]: currencyIn,
    [Field.OUTPUT]: currencyOut,
  })
  const [slippage] = useUserSlippageTolerance()
  const [transactionTimeout] = useUserTransactionTTL()
  const swapCallback = useSingleChainSwapExecution(isPermitSwap)

  const { priceImpactAction, requiresDegenMode, requestDegenMode } = usePriceImpactDegenMode(routeSummary?.priceImpact)
  const { buildResult, error } = review
  const requireDegenModeForBuild = useCallback(
    (result: typeof buildResult) => {
      if (!result?.data) return false
      return requiresDegenMode(
        calculatePriceImpact(Number(result.data.amountInUsd || 0), Number(result.data.amountOutUsd || 0)),
      )
    },
    [requiresDegenMode],
  )
  const returnToDegenSettings = useCallback(() => {
    dismissReviewSession()
    requestDegenMode()
  }, [dismissReviewSession, requestDegenMode])

  const buildReviewedRoute = useCallback<BuildReview>(
    async signal => {
      const result = await buildRoute(signal)
      if (!signal.aborted && requireDegenModeForBuild(result)) returnToDegenSettings()
      return result
    },
    [buildRoute, requireDegenModeForBuild, returnToDegenSettings],
  )

  const previousSlippage = useRef(slippage)
  useLayoutEffect(() => {
    const changed = previousSlippage.current !== slippage
    previousSlippage.current = slippage
    if (changed) void rebuildReviewSession(buildReviewedRoute)
  }, [slippage, rebuildReviewSession, buildReviewedRoute])

  const getTokenAddress = (currency: Currency | undefined) =>
    currency?.isNative ? 'NATIVE' : currency?.wrapped?.address

  const getRouteDexes = () => [...new Set(routeSummary?.route?.flat().map(r => r.exchange) || [])]

  const trackingSwapInit = () => {
    const minReceived = routeSummary?.parsedAmountOut
      ? minimumAmountAfterSlippage(routeSummary.parsedAmountOut, slippage)?.toSignificant(6)
      : undefined

    trackingHandler(TRACKING_EVENT_TYPE.SWAP_INITIATED, {
      gasUsd: routeSummary?.gasUsd,
      inputAmount: routeSummary?.parsedAmountIn,
      priceImpact: routeSummary?.priceImpact,
      feeInfo: getFeeInfoForMixPanel(routeSummary),
      from_token_address: getTokenAddress(currencyIn),
      to_token_address: getTokenAddress(currencyOut),
      pair: `${currencyIn?.symbol}/${currencyOut?.symbol}`,
      amount_in_usd: routeSummary?.amountInUsd,
      amount_out_estimated: routeSummary?.parsedAmountOut?.toSignificant(6),
      amount_out_usd: routeSummary?.amountOutUsd,
      minimum_received: minReceived,
      rate: routeSummary?.executionPrice?.toSignificant(6),
      transaction_time_limit: transactionTimeout / 60,
      gas_token: networkInfo.nativeToken.symbol,
      trade_route_dexes: getRouteDexes(),
      trade_route_steps: routeSummary?.route?.length,
      route_split: (routeSummary?.route?.length || 0) > 1,
      chain: networkInfo.name,
      volume: routeSummary?.amountInUsd ? Number(routeSummary.amountInUsd) : undefined,
    })
  }

  const openReview = () => {
    if (review.phase !== 'closed') return
    if (requiresDegenMode(routeSummary?.priceImpact)) {
      requestDegenMode()
      return
    }
    void openReviewSession(async signal => {
      trackingHandler(TRACKING_EVENT_TYPE.SWAP_REVIEW_OPENED, {
        from_token: currencyIn?.symbol,
        from_token_address: getTokenAddress(currencyIn),
        to_token: currencyOut?.symbol,
        to_token_address: getTokenAddress(currencyOut),
        amount_in: routeSummary?.parsedAmountIn?.toSignificant(6),
        amount_in_usd: routeSummary?.amountInUsd ? Number(routeSummary.amountInUsd) : undefined,
        amount_out: routeSummary?.parsedAmountOut?.toSignificant(6),
        amount_out_usd: routeSummary?.amountOutUsd ? Number(routeSummary.amountOutUsd) : undefined,
        rate: routeSummary?.executionPrice
          ? `1 ${currencyIn?.symbol} = ${routeSummary.executionPrice.toSignificant(6)} ${currencyOut?.symbol}`
          : undefined,
        minimum_received: routeSummary?.parsedAmountOut
          ? minimumAmountAfterSlippage(routeSummary.parsedAmountOut, slippage)?.toSignificant(6)
          : undefined,
        price_impact: routeSummary?.priceImpact
          ? routeSummary.priceImpact > 0.01
            ? `${routeSummary.priceImpact.toFixed(2)}%`
            : '<0.01%'
          : undefined,
        max_slippage: slippage ? slippage / 100 : 0,
        trade_route_dexes: getRouteDexes(),
        chain: networkInfo.name,
      })

      trackingSwapInit()

      return buildReviewedRoute(signal)
    })
  }

  // Submit only the payload/router built for this review; the displayed quote may already have refreshed.
  const handleSubmit: SubmitReview = onRequestSignature => {
    if (!buildResult?.data?.data || !buildResult.data.routerAddress) throw new Error('Missing built route')

    trackingHandler(TRACKING_EVENT_TYPE.SWAP_CONFIRMED, getSwapConfirmedTracking(buildResult.data, routeSummary))
    return swapCallback(buildResult.data.routerAddress, buildResult.data.data, onRequestSignature)
  }

  const handleError = (error: string) => {
    const currencyIn = routeSummary?.parsedAmountIn?.currency
    const currencyOut = routeSummary?.parsedAmountOut?.currency
    const isUserRejected = error.toLowerCase().includes('user rejected') || error.toLowerCase().includes('user denied')

    trackingHandler(TRACKING_EVENT_TYPE.SWAP_FAILED, {
      from_token: currencyIn?.symbol,
      to_token: currencyOut?.symbol,
      pair: currencyIn?.symbol && currencyOut?.symbol ? `${currencyIn.symbol}/${currencyOut.symbol}` : undefined,
      amount_in: displayTypedValue || routeSummary?.parsedAmountIn?.toSignificant(6),
      amount_in_usd: routeSummary?.amountInUsd ? Number(routeSummary.amountInUsd) : undefined,
      error_type: isUserRejected ? 'user_rejected' : 'tx_failed',
      error_message: error,
      max_slippage: routeSummary?.priceImpact,
      chain: networkInfo.name,
    })
  }

  const handleErrorDismiss = () => {
    if (
      ((buildResult?.error && buildResult.error.toLowerCase().includes('permit')) ||
        (error && error.toLowerCase().includes('permit'))) &&
      routeSummary &&
      account
    ) {
      dispatch(permitError({ chainId, address: routeSummary.parsedAmountIn.currency.wrapped.address, account }))
    }

    dismissReviewSession()
  }

  const confirmSwap = () => {
    if (review.phase !== 'review' || !buildResult?.data?.data || !buildResult.data.routerAddress) return

    if (requireDegenModeForBuild(buildResult)) {
      returnToDegenSettings()
      return
    }
    void confirmReviewSession(handleSubmit, handleError)
  }

  return {
    priceImpactAction,
    openReview,
    confirmSwap,
    dismissReview: dismissReviewSession,
    dismissReviewError: handleErrorDismiss,
  }
}

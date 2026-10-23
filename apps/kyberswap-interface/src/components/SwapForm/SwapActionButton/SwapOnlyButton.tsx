import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'

import SwapButtonWithPriceImpact from 'components/SwapForm/SwapActionButton/SwapButtonWithPriceImpact'
import { getFeeInfoForMixPanel, getSwapConfirmedTracking } from 'components/SwapForm/SwapActionButton/swapTracking'
import SwapModal from 'components/SwapForm/SwapModal'
import type { BuildReview, SubmitReview, SwapReviewState } from 'components/SwapForm/hooks/useSwapReviewSession'
import { useActiveWeb3React } from 'hooks'
import useSwapCallbackV3 from 'hooks/useSwapCallbackV3'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { Field } from 'state/swap/actions'
import { useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import { DetailedRouteSummary } from 'types/route'
import { minimumAmountAfterSlippage } from 'utils/currencyAmount'

type SwapOnlyButtonProps = {
  showButton: boolean
  routeSummary: DetailedRouteSummary | undefined
  isGettingRoute: boolean
  isApproved?: boolean

  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  balanceIn: CurrencyAmount<Currency> | undefined
  balanceOut: CurrencyAmount<Currency> | undefined
  parsedAmount: CurrencyAmount<Currency> | undefined
  isPermitSwap?: boolean

  review: SwapReviewState
  onOpenReview: (build: BuildReview) => Promise<void>
  onConfirmReview: (submit: SubmitReview, onError: (message: string) => void) => Promise<void>
  onDismissReview: () => void
  buildRoute: BuildReview
}

const SwapOnlyButton = ({
  showButton,
  routeSummary,
  isGettingRoute,
  isApproved,

  currencyIn,
  currencyOut,
  balanceIn,
  balanceOut,
  parsedAmount,
  isPermitSwap,

  review,
  onOpenReview,
  onConfirmReview,
  onDismissReview,
  buildRoute,
}: SwapOnlyButtonProps) => {
  const isProcessingSwap = review.phase !== 'closed'
  const { trackingHandler } = useTracking({
    [Field.INPUT]: currencyIn,
    [Field.OUTPUT]: currencyOut,
  })
  const { networkInfo } = useActiveWeb3React()
  const [slippage] = useUserSlippageTolerance()
  const [transactionTimeout] = useUserTransactionTTL()
  const { buildResult } = review
  const isBuildingRoute = review.phase === 'building'
  const { priceImpact } = routeSummary || {}

  const swapCallback = useSwapCallbackV3(isPermitSwap)
  const userHasSpecifiedInputOutput = Boolean(currencyIn && currencyOut && parsedAmount)
  const showLoading = isGettingRoute || isBuildingRoute || ((!balanceIn || !balanceOut) && userHasSpecifiedInputOutput)

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

  const handleClickSwapButton = () => {
    void onOpenReview(signal => {
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

      return buildRoute(signal)
    })
  }

  const handleSubmit: SubmitReview = onRequestSignature => {
    if (!buildResult?.data?.data || !buildResult.data.routerAddress) throw new Error('Missing built route')

    trackingHandler(TRACKING_EVENT_TYPE.SWAP_CONFIRMED, getSwapConfirmedTracking(buildResult.data, routeSummary))
    return swapCallback(buildResult.data.routerAddress, buildResult.data.data, onRequestSignature)
  }

  return (
    <>
      {showButton && (
        <SwapButtonWithPriceImpact
          isProcessingSwap={isProcessingSwap}
          route={routeSummary}
          onClick={handleClickSwapButton}
          isApproved={!!isApproved}
          showLoading={showLoading}
          priceImpact={priceImpact}
          showNoteGetRoute={!routeSummary}
        />
      )}
      <SwapModal
        isOpen={isProcessingSwap}
        tokenAddToMetaMask={currencyOut}
        review={review}
        onDismiss={onDismissReview}
        onConfirm={onConfirmReview}
        swapCallback={buildResult?.data?.data && buildResult.data.routerAddress ? handleSubmit : undefined}
      />
    </>
  )
}

export default SwapOnlyButton

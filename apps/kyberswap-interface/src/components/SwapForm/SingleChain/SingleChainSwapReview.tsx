import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'

import { useSingleChainSwapReview } from 'components/SwapForm/SingleChain/useSingleChainSwapReview'
import SwapButtonWithPriceImpact from 'components/SwapForm/SwapActionButton/SwapButtonWithPriceImpact'
import SingleChainSwapModal from 'components/SwapForm/SwapModal'
import type { BuildReview, SubmitReview, SwapReviewState } from 'components/SwapForm/hooks/useSwapReviewSession'
import { DetailedRouteSummary } from 'types/route'

type SingleChainSwapReviewProps = {
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
  openReviewSession: (build: BuildReview) => Promise<void>
  confirmReviewSession: (submit: SubmitReview, onError: (message: string) => void) => Promise<void>
  dismissReviewSession: () => void
  buildRoute: BuildReview
}

const SingleChainSwapReview = ({
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
  openReviewSession,
  confirmReviewSession,
  dismissReviewSession,
  buildRoute,
}: SingleChainSwapReviewProps) => {
  const { openReview, confirmSwap, dismissReview, dismissReviewError } = useSingleChainSwapReview({
    currencyIn,
    currencyOut,
    routeSummary,
    review,
    isPermitSwap,
    buildRoute,
    openReviewSession,
    confirmReviewSession,
    dismissReviewSession,
  })

  const isProcessingSwap = review.phase !== 'closed'
  const isBuildingRoute = review.phase === 'building'
  const { priceImpact } = routeSummary || {}
  const userHasSpecifiedInputOutput = Boolean(currencyIn && currencyOut && parsedAmount)
  const showLoading = isGettingRoute || isBuildingRoute || ((!balanceIn || !balanceOut) && userHasSpecifiedInputOutput)

  return (
    <>
      {showButton && (
        <SwapButtonWithPriceImpact
          isProcessingSwap={isProcessingSwap}
          hasRoute={!!routeSummary}
          onClick={openReview}
          isApproved={!!isApproved}
          showLoading={showLoading}
          priceImpact={priceImpact}
        />
      )}
      <SingleChainSwapModal
        isOpen={isProcessingSwap}
        tokenAddToMetaMask={currencyOut}
        review={review}
        onConfirm={confirmSwap}
        onDismiss={dismissReview}
        onDismissError={dismissReviewError}
      />
    </>
  )
}

export default SingleChainSwapReview

import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import InfoHelper from 'components/InfoHelper'
import { Stack } from 'components/Stack'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import ConfirmOutputChangeModal from 'components/SwapForm/SwapModal/ConfirmOutputChangeModal'
import SwapDetails from 'components/SwapForm/SwapModal/SwapDetails'
import SwapReviewActions from 'components/SwapForm/SwapModal/SwapReviewActions'
import { SwapReviewHeader } from 'components/SwapForm/SwapModal/SwapReviewLayout'
import SwapReviewSummary from 'components/SwapForm/SwapModal/SwapReviewSummary'
import { SHOW_CONFIRM_MODAL_AFTER_CLICK_SWAP_THRESHOLD } from 'components/SwapForm/SwapModal/reviewData'
import { useSwapReviewData } from 'components/SwapForm/SwapModal/useSwapReviewData'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useDefaultSlippageByPair } from 'state/swap/hooks'
import { useDegenModeManager, useSlippageSettingByPage } from 'state/user/hooks'

type SwapReviewContentProps = {
  buildResult: BuildRouteResult | undefined
  isBuildingRoute: boolean
  buildError: string | undefined
  onDismiss?: () => void
  onConfirm?: () => void
}

const SwapReviewContent = ({
  buildResult,
  isBuildingRoute,
  buildError,
  onDismiss,
  onConfirm,
}: SwapReviewContentProps) => {
  const { slippage, isAdvancedMode } = useSwapFormContext()
  const review = useSwapReviewData(buildResult)
  const {
    parsedAmountOut,
    parsedAmountOutFromBuild,
    outputChangePercent,
    formattedOutputChangePercent,
    dynamicSuggestedSlippage,
    honeypot,
  } = review
  const [hasAcceptedNewAmount, setHasAcceptedNewAmount] = useState(false)
  const [showAreYouSureModal, setShowAreYouSureModal] = useState(false)
  const [retry, setRetry] = useState(0)
  const [showInverted, setShowInverted] = useState(false)
  const [isDegenMode] = useDegenModeManager()
  const { setRawSlippage } = useSlippageSettingByPage()
  const defaultSlippage = useDefaultSlippageByPair()
  const [searchParams, setSearchParams] = useSearchParams()
  const { trackingHandler } = useTracking()

  const canUseSuggestedSlippage = retry < 1 && slippage !== dynamicSuggestedSlippage

  const handleOpenSlippage = () => {
    searchParams.set('action', 'open-slippage-panel')
    setSearchParams(searchParams)
    onDismiss?.()
  }

  const handleSuggestedSlippage = () => {
    if (canUseSuggestedSlippage && dynamicSuggestedSlippage) {
      setRetry(prev => prev + 1)
      setRawSlippage(dynamicSuggestedSlippage)
    } else {
      handleOpenSlippage()
    }
  }

  const handleBuildErrorDismiss = () => {
    if (honeypot?.isFOT) {
      searchParams.set('tab', 'settings')
      setSearchParams(searchParams)
    }
    onDismiss?.()
  }

  const handleAcceptConfirmedAmount = () => {
    setHasAcceptedNewAmount(true)
    setShowAreYouSureModal(false)
  }

  const handleClickAcceptNewAmount = () => {
    trackingHandler(TRACKING_EVENT_TYPE.ACCEPT_NEW_AMOUNT)
    if (outputChangePercent > SHOW_CONFIRM_MODAL_AFTER_CLICK_SWAP_THRESHOLD) {
      setHasAcceptedNewAmount(true)
      return
    }

    setShowAreYouSureModal(true)
  }

  if (buildError && dynamicSuggestedSlippage) {
    return (
      <TransactionErrorContent
        onDismiss={() => onDismiss?.()}
        confirmAction={handleSuggestedSlippage}
        confirmText={canUseSuggestedSlippage ? t`Use Suggested Slippage` : t`Set Custom Slippage`}
        message={
          canUseSuggestedSlippage
            ? buildError
            : t`This route may currently be too volatile to execute. Try to custom your own slippage to continue.`
        }
        confirmBtnStyle={{ flex: 2 }}
        dismissBtnStyle={{ flex: 1 }}
        suggestionMessage={
          canUseSuggestedSlippage && (
            <div className="text-base text-text">
              <Trans>New Suggested Slippage:</Trans> {(dynamicSuggestedSlippage * 100) / 10_000}%{' '}
              <InfoHelper
                text={
                  <Trans>
                    This suggestion is based on your trade&apos;s estimated slippage and token pair volatility, with a
                    cap applied.
                  </Trans>
                }
              />{' '}
            </div>
          )
        }
      />
    )
  }

  return (
    <>
      <ConfirmOutputChangeModal
        show={showAreYouSureModal}
        onDismiss={() => setShowAreYouSureModal(false)}
        onAccept={handleAcceptConfirmedAmount}
        parsedAmountOut={parsedAmountOut}
        parsedAmountOutFromBuild={parsedAmountOutFromBuild}
        formattedOutputChangePercent={formattedOutputChangePercent}
      />

      <Stack className="w-full gap-4 p-4 sm:p-5">
        <SwapReviewHeader
          title={<Trans>Confirm Swap Details</Trans>}
          subtitle={<Trans>Please review the details of your swap</Trans>}
          onDismiss={onDismiss}
        />

        <SwapReviewSummary
          review={review}
          isBuildingRoute={isBuildingRoute}
          hasAcceptedNewAmount={hasAcceptedNewAmount}
          showInverted={showInverted}
          onInvertRate={() => setShowInverted(value => !value)}
        />

        <SwapDetails {...review.details} isLoading={isBuildingRoute} />

        <SwapReviewActions
          review={review}
          slippage={slippage}
          defaultSlippage={defaultSlippage}
          isAdvancedMode={isAdvancedMode}
          isDegenMode={isDegenMode}
          isBuildingRoute={isBuildingRoute}
          buildError={buildError}
          hasAcceptedNewAmount={hasAcceptedNewAmount}
          onDismiss={onDismiss}
          onConfirm={onConfirm}
          onUseDefaultSlippage={() => setRawSlippage(defaultSlippage)}
          onOpenSlippage={handleOpenSlippage}
          onDismissBuildError={handleBuildErrorDismiss}
          onAcceptNewAmount={handleClickAcceptNewAmount}
        />
      </Stack>
    </>
  )
}

export default SwapReviewContent

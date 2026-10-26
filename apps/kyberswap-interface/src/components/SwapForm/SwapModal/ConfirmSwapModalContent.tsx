import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import InfoHelper from 'components/InfoHelper'
import { HStack, Stack } from 'components/Stack'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import SwapDetails from 'components/SwapForm/SwapModal/SwapDetails'
import SwapModalAreYouSure from 'components/SwapForm/SwapModal/SwapModalAreYouSure'
import SwapReviewAmounts from 'components/SwapForm/SwapModal/SwapReviewAmounts'
import SwapReviewWarnings from 'components/SwapForm/SwapModal/SwapReviewWarnings'
import { SHOW_CONFIRM_MODAL_AFTER_CLICK_SWAP_THRESHOLD } from 'components/SwapForm/SwapModal/reviewData'
import { useSwapReviewData } from 'components/SwapForm/SwapModal/useSwapReviewData'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useDefaultSlippageByPair } from 'state/swap/hooks'
import { useDegenModeManager, useSlippageSettingByPage } from 'state/user/hooks'
import { CloseIcon } from 'theme/components'

type Props = {
  buildResult: BuildRouteResult | undefined
  isBuildingRoute: boolean
  errorWhileBuildRoute: string | undefined
  onDismiss: () => void
  onSwap: () => void
}

const ConfirmSwapModalContent = ({ buildResult, isBuildingRoute, errorWhileBuildRoute, onDismiss, onSwap }: Props) => {
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
  const defaultSlp = useDefaultSlippageByPair()
  const [searchParams, setSearchParams] = useSearchParams()
  const { trackingHandler } = useTracking()

  const canUseSuggestedSlippage = retry < 1 && slippage !== dynamicSuggestedSlippage

  const handleOpenSlippage = () => {
    searchParams.set('action', 'open-slippage-panel')
    setSearchParams(searchParams)
    onDismiss()
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
    onDismiss()
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

  if (errorWhileBuildRoute && dynamicSuggestedSlippage) {
    return (
      <TransactionErrorContent
        onDismiss={onDismiss}
        confirmAction={handleSuggestedSlippage}
        confirmText={canUseSuggestedSlippage ? t`Use Suggested Slippage` : t`Set Custom Slippage`}
        message={
          canUseSuggestedSlippage
            ? errorWhileBuildRoute
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
      <SwapModalAreYouSure
        show={showAreYouSureModal}
        onDismiss={() => setShowAreYouSureModal(false)}
        onAccept={handleAcceptConfirmedAmount}
        parsedAmountOut={parsedAmountOut}
        parsedAmountOutFromBuild={parsedAmountOutFromBuild}
        formattedOutputChangePercent={formattedOutputChangePercent}
      />

      <Stack className="w-full gap-4 p-5">
        <Stack className="gap-3">
          <Stack className="gap-1">
            <HStack className="w-full items-center justify-between">
              <span className="text-xl font-medium">
                <Trans>Confirm Swap Details</Trans>
              </span>
              <CloseIcon onClick={onDismiss} />
            </HStack>

            <div className="text-xs text-subText">
              <Trans>Please review the details of your swap:</Trans>
            </div>
          </Stack>

          <SwapReviewAmounts
            review={review}
            isBuildingRoute={isBuildingRoute}
            hasAcceptedNewAmount={hasAcceptedNewAmount}
            showInverted={showInverted}
            onInvertRate={() => setShowInverted(value => !value)}
          />
        </Stack>

        <SwapDetails {...review.details} isLoading={isBuildingRoute} />

        <SwapReviewWarnings
          review={review}
          slippage={slippage}
          defaultSlp={defaultSlp}
          isAdvancedMode={isAdvancedMode}
          isDegenMode={isDegenMode}
          isBuildingRoute={isBuildingRoute}
          errorWhileBuildRoute={errorWhileBuildRoute}
          hasAcceptedNewAmount={hasAcceptedNewAmount}
          onDismiss={onDismiss}
          onSwap={onSwap}
          onUseDefaultSlippage={() => setRawSlippage(defaultSlp)}
          onOpenSlippage={handleOpenSlippage}
          onBuildErrorDismiss={handleBuildErrorDismiss}
          onAcceptNewAmount={handleClickAcceptNewAmount}
        />
      </Stack>
    </>
  )
}

export default ConfirmSwapModalContent

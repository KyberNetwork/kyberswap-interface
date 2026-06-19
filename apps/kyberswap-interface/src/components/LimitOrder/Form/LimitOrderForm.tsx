import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { ReactNode, memo, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ButtonLight, ButtonPrimary, ButtonWarning } from 'components/Button'
import DateTimePicker from 'components/DateTimePicker'
import LimitOrderExpirySection from 'components/LimitOrder/Form/LimitOrderExpirySection'
import LimitOrderRateSection, { useGetDeltaRateLimitOrder } from 'components/LimitOrder/Form/LimitOrderRateSection'
import LimitOrderTokenSection from 'components/LimitOrder/Form/LimitOrderTokenSection'
import MarketPrice from 'components/LimitOrder/Form/MarketPrice'
import ConfirmOrderModal from 'components/LimitOrder/Modals/ConfirmOrderModal'
import ProcessingOrderModal from 'components/LimitOrder/Modals/ProcessingOrderModal'
import { useCreateLimitOrder } from 'components/LimitOrder/hooks/useCreateLimitOrder'
import { useLimitOrderExecution } from 'components/LimitOrder/hooks/useLimitOrderExecution'
import { useLimitOrderFormState } from 'components/LimitOrder/hooks/useLimitOrderFormState'
import { useProcessingOrder } from 'components/LimitOrder/hooks/useProcessingOrder'
import { LimitOrderTab } from 'components/LimitOrder/types'
import { NetworkSelector } from 'components/NetworkSelector'
import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import usePageLocation from 'hooks/usePageLocation'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import ErrorWarningPanel from 'pages/Bridge/ErrorWarning'
import { useWalletModalToggle } from 'state/application/hooks'
import { useLimitState } from 'state/limit/hooks'
import { currencyId } from 'utils/currencyId'

type LimitOrderFormProps = {
  currencyIn?: Currency
  currencyOut?: Currency
}

const useLimitOrderCurrencies = ({ currencyIn, currencyOut }: LimitOrderFormProps) => {
  const limitState = useLimitState()
  return {
    currencyIn: currencyIn || limitState.currencyIn,
    currencyOut: currencyOut || limitState.currencyOut,
  }
}

const ReviewButton = ({
  disabled,
  hasWarning,
  onClick,
  children,
}: {
  disabled: boolean
  hasWarning: boolean
  onClick: () => void
  children: ReactNode
}) => {
  if (hasWarning && !disabled) {
    return <ButtonWarning onClick={onClick}>{children}</ButtonWarning>
  }

  return (
    <ButtonPrimary id="review-order-button" onClick={onClick} disabled={disabled}>
      {children}
    </ButtonPrimary>
  )
}

const LimitOrderForm = ({ currencyIn: currencyInProp, currencyOut: currencyOutProp }: LimitOrderFormProps) => {
  const toggleWalletModal = useWalletModalToggle()
  const { changeNetwork } = useChangeNetwork()
  const { account } = useActiveWeb3React()
  const { isEmbeddedSwap } = usePageLocation()
  const navigate = useNavigate()

  const [showReview, setShowReview] = useState(false)

  const { currencyIn, currencyOut } = useLimitOrderCurrencies({
    currencyIn: currencyInProp,
    currencyOut: currencyOutProp,
  })

  const form = useLimitOrderFormState({
    currencyIn,
    currencyOut,
    useUrlParams: isEmbeddedSwap,
  })

  const deltaRate = useGetDeltaRateLimitOrder({ marketPrice: form.tradeInfo, rateInfo: form.rateInfo })

  const order = {
    currencyIn,
    currencyOut,
    chainId: form.chainId,
    networkName: form.networkInfo.name,
    inputAmount: form.inputAmount,
    outputAmount: form.outputAmount,
    displayRate: form.displayRate,
    expiredAt: form.expiredAt,
    displayTime: form.displayTime,
    rateInfo: form.rateInfo,
    tradeInfo: form.tradeInfo,
    deltaRate,
  }

  const execution = useLimitOrderExecution({
    order,
    onCloseReview: () => setShowReview(false),
    onOpenReview: () => setShowReview(true),
    onSetInput: form.onSetInput,
    onResetForm: form.onResetForm,
    switchToWeth: form.switchToWeth,
  })

  const { balance, estimateUSD, review, processing: executionProcessing, tracking, validation } = execution

  const createOrder = useCreateLimitOrder({
    order,
    searchParams: form.searchParams,
    estimateUSD,
    onError: execution.handleError,
    onSuccess: execution.resetForm,
  })

  const processing = useProcessingOrder({
    ...executionProcessing,
    onCreateOrder: createOrder.submitCreateOrderWithTracking,
    onError: execution.handleError,
    onStart: review.closeReview,
  })

  const viewCreatedOrder = useCallback(() => {
    const currencyPair =
      currencyIn && currencyOut
        ? `/${currencyId(currencyIn, form.chainId)}-to-${currencyId(currencyOut, form.chainId)}`
        : ''
    const search = new URLSearchParams({ tab: LimitOrderTab.MY_ORDER }).toString()

    navigate(`${APP_PATHS.LIMIT}/${form.networkInfo.route}${currencyPair}?${search}`)
  }, [currencyIn, currencyOut, form.chainId, form.networkInfo.route, navigate])

  const validationError = validation.inputError || validation.outputError
  const disableReviewButton = validation.isNotFillAllInput || !!validationError || balance.insufficientBalance
  const shouldWarnReview = validation.warningMessage.length > 0
  const reviewButtonContent = (
    <span className="font-medium">
      {validationError ? (
        validationError
      ) : balance.insufficientBalance && balance.insufficientBalanceText ? (
        balance.insufficientBalanceText
      ) : (
        <Trans>Review Order</Trans>
      )}
    </span>
  )

  return (
    <>
      <Stack className="gap-4">
        {isEmbeddedSwap && <NetworkSelector chainId={form.chainId} />}
        <Stack className="gap-3">
          <LimitOrderTokenSection
            chainId={form.chainId}
            tokens={{
              currencyIn,
              currencyOut,
              inputAmount: form.inputAmount,
              outputAmount: form.outputAmount,
            }}
            estimateUsd={estimateUSD}
            events={{
              onInputAmountChange: form.onSetInput,
              onOutputAmountChange: form.onSetOutput,
              onMaxInput: balance.handleMaxInput,
              onInputTokenSelect: form.handleInputSelect,
              onOutputTokenSelect: form.handleOutputSelect,
              onRotate: form.handleRotateClick,
              onInputFocus: tracking.trackingTouchInput,
              onTokenSelectorOpen: tracking.trackingTouchSelectToken,
            }}
          />

          <LimitOrderRateSection
            tokens={{ currencyIn, currencyOut }}
            rate={{
              displayRate: form.displayRate,
              rateInfo: form.rateInfo,
              tradeInfo: form.tradeInfo,
            }}
            events={{
              onRateChange: form.onChangeRate,
              onSetMarketRate: form.setPriceRateMarket,
              onRateInputFocus: tracking.trackingTouchInput,
              onRateInputBlur: tracking.trackingPriceSetOnBlur,
            }}
          />
        </Stack>

        <Stack className="gap-6">
          <Stack className="gap-4">
            <LimitOrderExpirySection
              expiry={{
                expire: form.expire,
                expanded: form.expanded,
                customDateExpire: form.customDateExpire,
                displayTime: form.displayTime,
              }}
              events={{
                onToggleExpanded: () => form.setExpanded(expanded => !expanded),
                onOpenDatePicker: form.toggleDatePicker,
                onExpireChange: form.onChangeExpire,
              }}
            />

            <HStack className="items-center">
              <span className="text-sm text-subText">{t`Market Price is`}&nbsp;</span>
              <MarketPrice
                price={form.tradeInfo}
                loading={form.loadingTrade}
                symbolIn={currencyIn?.symbol}
                symbolOut={currencyOut?.symbol}
              />
            </HStack>

            {validation.warningMessage.length > 0 && (
              <Stack className="gap-3">
                {validation.warningMessage.map((mess, i) => (
                  <ErrorWarningPanel type="warn" key={i} title={mess} />
                ))}
              </Stack>
            )}
          </Stack>

          {form.chainId !== form.walletChainId ? (
            <ButtonLight onClick={() => changeNetwork(form.chainId)}>
              <Trans>Switch to {NETWORKS_INFO[form.chainId].name}</Trans>
            </ButtonLight>
          ) : !account ? (
            <ButtonLight onClick={toggleWalletModal}>
              <Trans>Connect</Trans>
            </ButtonLight>
          ) : (
            <ReviewButton disabled={disableReviewButton} hasWarning={shouldWarnReview} onClick={review.openReview}>
              {reviewButtonContent}
            </ReviewButton>
          )}
        </Stack>
      </Stack>

      <ConfirmOrderModal
        order={order}
        review={{
          isOpen: showReview,
          onDismiss: review.closeReview,
          onSubmit: processing.start,
        }}
        warningMessage={validation.warningMessage}
      />

      <DateTimePicker
        defaultDate={form.customDateExpire}
        expire={form.expire}
        isOpen={form.showDatePicker}
        onDismiss={form.toggleDatePicker}
        onSetDate={form.onChangeExpire}
      />

      <ProcessingOrderModal
        chainId={form.chainId}
        currencyIn={currencyIn}
        processing={processing}
        onViewOrder={viewCreatedOrder}
      />
    </>
  )
}

export default memo(LimitOrderForm)

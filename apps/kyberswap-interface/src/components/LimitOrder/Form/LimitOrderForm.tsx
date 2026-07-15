import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode, memo, useEffect, useRef, useState } from 'react'

import { ButtonLight, ButtonPrimary, ButtonWarning } from 'components/Button'
import DateTimePicker from 'components/DateTimePicker'
import CreateOrderFlow from 'components/LimitOrder/CreateOrder/CreateOrderFlow'
import { useCreateLimitOrder } from 'components/LimitOrder/CreateOrder/useCreateLimitOrder'
import LimitOrderExpirySection from 'components/LimitOrder/Form/LimitOrderExpirySection'
import LimitOrderRateSection, { useGetDeltaRateLimitOrder } from 'components/LimitOrder/Form/LimitOrderRateSection'
import {
  LimitOrderInputTokenPanel,
  LimitOrderOutputTokenPanel,
  type LimitOrderTokenPanelProps,
} from 'components/LimitOrder/Form/LimitOrderTokenSection'
import MarketPrice from 'components/LimitOrder/Form/MarketPrice'
import { useLimitOrderFormState } from 'components/LimitOrder/Form/useLimitOrderFormState'
import { NetworkSelector } from 'components/NetworkSelector'
import { HStack, Stack } from 'components/Stack'
import ReverseTokenSelectionButton from 'components/SwapForm/ReverseTokenSelectionButton'
import { useActiveWeb3React } from 'hooks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import usePageLocation from 'hooks/usePageLocation'
import { restrictedTokenMessage, useIsTokenRestricted } from 'hooks/useRestrictedTokens'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import ErrorWarning from 'pages/Bridge/ErrorWarning'
import { useWalletModalToggle } from 'state/application/hooks'
import { useLimitState } from 'state/limit/hooks'

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
  const { trackingHandler, isTrackingReady } = useTracking()

  const [showReview, setShowReview] = useState(false)
  const trackedPageViewed = useRef(false)

  useEffect(() => {
    if (!isTrackingReady || trackedPageViewed.current) return

    trackedPageViewed.current = true
    trackingHandler(TRACKING_EVENT_TYPE.LO_PAGE_VIEWED)
  }, [isTrackingReady, trackingHandler])

  const { currencyIn, currencyOut } = useLimitOrderCurrencies({
    currencyIn: currencyInProp,
    currencyOut: currencyOutProp,
  })

  const isTokenRestricted = useIsTokenRestricted()
  const restrictedCurrency = isTokenRestricted(currencyIn)
    ? currencyIn
    : isTokenRestricted(currencyOut)
    ? currencyOut
    : undefined

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

  const createOrder = useCreateLimitOrder({
    order,
    searchParams: form.searchParams,
    onCloseReview: () => setShowReview(false),
    onOpenReview: () => setShowReview(true),
    onSetInput: form.onSetInput,
    onResetForm: form.onResetForm,
  })

  const { balance, estimateUSD, review, tracking, validation } = createOrder

  const validationError = validation.inputError || validation.outputError
  const disableReviewButton =
    !!restrictedCurrency ||
    validation.isNotFillAllInput ||
    !!validationError ||
    balance.insufficientBalance ||
    validation.shouldDisableAction

  const reviewButtonContent = (
    <span className="font-medium">
      {restrictedCurrency ? (
        restrictedTokenMessage(restrictedCurrency.symbol)
      ) : validationError ? (
        validationError
      ) : balance.insufficientBalance && balance.insufficientBalanceText ? (
        balance.insufficientBalanceText
      ) : (
        <Trans>Review Order</Trans>
      )}
    </span>
  )

  const tokenSectionProps: LimitOrderTokenPanelProps = {
    chainId: form.chainId,
    tokens: {
      currencyIn,
      currencyOut,
      inputAmount: form.inputAmount,
      outputAmount: form.outputAmount,
    },
    estimateUsd: estimateUSD,
    events: {
      onInputAmountChange: form.onSetInput,
      onOutputAmountChange: form.onSetOutput,
      onMaxInput: balance.handleMaxInput,
      onInputTokenSelect: form.handleInputSelect,
      onOutputTokenSelect: form.handleOutputSelect,
      onInputFocus: tracking.trackingTouchInput,
      onTokenSelectorOpen: tracking.trackingTouchSelectToken,
    },
  }

  return (
    <>
      <Stack className="gap-4">
        {isEmbeddedSwap && <NetworkSelector chainId={form.chainId} />}
        <Stack className="gap-3">
          <LimitOrderInputTokenPanel {...tokenSectionProps} />

          <LimitOrderRateSection
            tokens={{ currencyIn, currencyOut }}
            rate={{
              displayRate: form.displayRate,
              rateInfo: form.rateInfo,
              tradeInfo: form.tradeInfo,
            }}
            events={{
              onRateChange: form.onChangeRate,
              onInvertedRateChange: form.onChangeInvertedRate,
              onRatePresetClick: tracking.trackingRatePresetClick,
              onSetMarketRate: () => {
                tracking.trackingMarketRateClick()
                form.setPriceRateMarket()
              },
              onRateInputFocus: tracking.trackingTouchInput,
              onRateInputBlur: tracking.trackingPriceSetOnBlur,
            }}
          />

          <HStack className="items-center justify-between gap-3">
            <HStack className="min-w-0 items-center gap-2 text-sm text-subText">
              <span className="shrink-0 italic">
                <Trans>Market Price</Trans>
              </span>
              <div className="min-w-0">
                <MarketPrice
                  price={form.tradeInfo}
                  loading={form.loadingTrade}
                  symbolIn={currencyIn?.symbol}
                  symbolOut={currencyOut?.symbol}
                  className="italic"
                />
              </div>
            </HStack>
            <ReverseTokenSelectionButton className="size-6 bg-buttonGray p-0.5" onClick={form.handleRotateClick} />
          </HStack>

          <LimitOrderOutputTokenPanel {...tokenSectionProps} />
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

            {validation.warnings.length > 0 && (
              <Stack className="gap-3">
                {validation.warnings.map((warning, i) => (
                  <ErrorWarning type={warning.type} key={i} title={warning.message} />
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
            <ReviewButton
              disabled={disableReviewButton}
              hasWarning={validation.shouldWarningAction}
              onClick={review.openReview}
            >
              {reviewButtonContent}
            </ReviewButton>
          )}
        </Stack>
      </Stack>

      <CreateOrderFlow order={order} isOpen={showReview} onDismiss={review.closeReview} createOrder={createOrder} />

      <DateTimePicker
        returnPresetValue={true}
        defaultDate={form.customDateExpire}
        expire={form.expire}
        isOpen={form.showDatePicker}
        onDismiss={form.toggleDatePicker}
        onSetDate={form.onChangeExpire}
      />
    </>
  )
}

export default memo(LimitOrderForm)

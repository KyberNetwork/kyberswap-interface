import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { ReactNode, memo, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'react-feather'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import DateTimePicker from 'components/DateTimePicker'
import { ErrorWarning } from 'components/ErrorWarning'
import LimitOrderExpirySection from 'components/LimitOrder/Form/LimitOrderExpirySection'
import { LimitOrderInputTokenPanel } from 'components/LimitOrder/Form/LimitOrderTokenSection'
import { calcUsdPrices } from 'components/LimitOrder/utils'
import { HStack, Stack } from 'components/Stack'
import StopOrderFlow from 'components/StopOrder/CreateOrder/StopOrderFlow'
import { useCreateStopOrder } from 'components/StopOrder/CreateOrder/useCreateStopOrder'
import { StopOrderFeeNotes, StopOrderFeeValue } from 'components/StopOrder/Form/StopOrderFeeSummary'
import StopOrderReceiveSection from 'components/StopOrder/Form/StopOrderReceiveSection'
import TriggerPriceSection from 'components/StopOrder/Form/TriggerPriceSection'
import { useStopOrderFormState } from 'components/StopOrder/Form/useStopOrderFormState'
import { useStopOrderWarnings } from 'components/StopOrder/Form/useStopOrderWarnings'
import OrderTypeSubTabs from 'components/StopOrder/OrderTypeSubTabs'
import { getStopOrderExpiryPresets } from 'components/StopOrder/constants'
import { useStopOrderAmountShortcuts } from 'components/StopOrder/hooks/useStopOrderAmountShortcuts'
import { useStopOrderFeeEstimate } from 'components/StopOrder/hooks/useStopOrderFeeEstimate'
import { useStopOrderTracking } from 'components/StopOrder/hooks/useStopOrderTracking'
import ReverseTokenSelectionButton from 'components/SwapForm/ReverseTokenSelectionButton'
import SlippageSetting from 'components/SwapForm/SlippageSetting'
import { useActiveWeb3React } from 'hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { restrictedTokenMessage, useIsTokenRestricted } from 'hooks/useRestrictedTokens'
import { useWalletModalToggle } from 'state/application/hooks'
import { useLimitState } from 'state/limit/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { SLIPPAGE_STATUS } from 'utils/slippage'

type StopOrderFormProps = {
  currencyIn?: Currency
  currencyOut?: Currency
}

/** Flags the token button of a field whose token cannot be used for a stop order. */
const UNUSABLE_TOKEN_SELECT_CLASS = 'border-warning'

/**
 * A note about the field it sits in, so it reads as part of that input rather than of the form. A
 * token with no feed is fixed by picking another, so that note links to the list of ones that work.
 */
const FieldWarning = ({
  children,
  onViewSupportedTokens,
}: {
  children: ReactNode
  onViewSupportedTokens?: () => void
}) => (
  <HStack
    className="animate-[fadeIn_0.2s_ease-out_both] items-start gap-1.5 text-xs font-medium text-warning motion-reduce:animate-none"
    data-testid="stop-order-field-warning"
  >
    <AlertTriangle size={14} className="mt-px shrink-0" />
    <Stack className="gap-0.5">
      <span>{children}</span>
      {onViewSupportedTokens && (
        <button
          type="button"
          data-testid="stop-order-view-supported-tokens"
          className="w-fit cursor-pointer border-0 bg-transparent p-0 text-left text-primary hover:brightness-110"
          onClick={onViewSupportedTokens}
        >
          <Trans>View supported tokens</Trans>
        </button>
      )}
    </Stack>
  </HStack>
)

const StopOrderForm = ({ currencyIn: currencyInProp, currencyOut: currencyOutProp }: StopOrderFormProps) => {
  const toggleWalletModal = useWalletModalToggle()
  const { account } = useActiveWeb3React()
  const limitState = useLimitState()

  const currencyIn = currencyInProp || limitState.currencyIn
  const currencyOut = currencyOutProp || limitState.currencyOut

  const [showReview, setShowReview] = useState(false)
  const tracking = useStopOrderTracking()
  const trackedPageView = useRef(false)

  const form = useStopOrderFormState({ currencyIn, currencyOut })
  const validation = useStopOrderWarnings({
    chainId: form.chainId,
    currencyIn,
    currencyOut,
    inputAmount: form.inputAmount,
    marketPriceUnavailable: form.marketPriceUnavailable,
  })

  const createOrder = useCreateStopOrder({
    currencyIn,
    currencyOut,
    inputAmount: form.inputAmount,
    triggerPrice: form.triggerPrice,
    slippage: form.slippage,
    expiredAt: form.expiredAt,
    onResetForm: form.onResetForm,
  })

  const isTokenRestricted = useIsTokenRestricted()
  const restrictedCurrency = isTokenRestricted(currencyIn)
    ? currencyIn
    : isTokenRestricted(currencyOut)
    ? currencyOut
    : undefined

  const balance = useCurrencyBalance(currencyIn ?? undefined, form.chainId)
  const insufficientBalance = createOrder.insufficientBalance

  const amountShortcuts = useStopOrderAmountShortcuts(
    balance,
    form.inputAmount,
    form.setInputValue,
    'stop-order-amount',
  )

  // Shown while the terms are set and again in the review; signing estimates once more for the cap.
  const feeEstimate = useStopOrderFeeEstimate({
    currencyIn,
    currencyOut,
    inputAmount: form.inputAmount,
    triggerPrice: form.triggerPrice,
    slippage: form.slippage,
    expiredAt: form.expiredAt,
  })

  const estimateUsd = calcUsdPrices({
    inputAmount: form.inputAmount,
    outputAmount: form.estimatedOutput,
    priceUsdIn: form.tradeInfo?.priceUsdIn,
    priceUsdOut: form.tradeInfo?.priceUsdOut,
    currencyIn,
    currencyOut,
  })

  useEffect(() => {
    if (trackedPageView.current) return
    trackedPageView.current = true
    tracking.trackPageViewed(form.chainId, 'nav')
  }, [tracking, form.chainId])

  // Fires once per token the user lands on without a feed, not on every re-render of that state.
  const trackedIneligibleToken = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!currencyIn || !validation.hasIneligibleToken) return
    const key = currencyIn.wrapped.address
    if (trackedIneligibleToken.current === key) return
    trackedIneligibleToken.current = key
    tracking.trackIneligibleToken(currencyIn)
  }, [currencyIn, validation.hasIneligibleToken, tracking])

  // Stable identity per locale: DateTimePicker keys an effect off this list, so a fresh array every
  // render would re-seed its date every render. The labels are read from the active catalogue when
  // the helper runs, which the linter cannot see — hence the explicit locale dependency.
  const locale = useActiveLocale()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const expiryPresets = useMemo(() => getStopOrderExpiryPresets(), [locale])

  // Both sides report to the same funnel event the tracking spec defines.
  const onSelectSellToken = (currency: Currency) => {
    tracking.trackTokenSelected(currency)
    form.onSelectCurrencyIn(currency)
  }
  const onSelectReceiveToken = (currency: Currency) => {
    tracking.trackTokenSelected(currency)
    form.onSelectCurrencyOut(currency)
  }

  const isMissingAmount = !form.inputAmount || Number(form.inputAmount) === 0
  const isMissingTrigger = !form.triggerPrice || Number(form.triggerPrice) === 0
  // Held while the oracle price loads: the trigger is set against the market, which is not known yet.
  const disableAction =
    !!restrictedCurrency ||
    isMissingAmount ||
    isMissingTrigger ||
    insufficientBalance ||
    form.loadingMarketPrice ||
    validation.shouldDisableAction

  const unavailableToken = validation.unavailableToken
  const isReceiveTokenUnavailable = !!unavailableToken && !!currencyOut && unavailableToken.equals(currencyOut)

  const actionLabel = restrictedCurrency ? (
    restrictedTokenMessage(restrictedCurrency.symbol)
  ) : unavailableToken ? (
    <Trans>Stop order not available for {unavailableToken.symbol}</Trans>
  ) : isMissingAmount ? (
    <Trans>Enter an amount</Trans>
  ) : isMissingTrigger ? (
    <Trans>Set a trigger price</Trans>
  ) : insufficientBalance ? (
    <Trans>Insufficient {currencyIn?.symbol} funds</Trans>
  ) : (
    <Trans>Place Stop Order</Trans>
  )

  return (
    <>
      <Stack className="gap-4" data-testid="stop-order-form">
        <OrderTypeSubTabs />

        <LimitOrderInputTokenPanel
          chainId={form.chainId}
          tokens={{ currencyIn, currencyOut, inputAmount: form.inputAmount }}
          estimateUsd={estimateUsd}
          events={{
            onInputAmountChange: form.setInputValue,
            // Clicking the balance does what Max does.
            onMaxInput: amountShortcuts[amountShortcuts.length - 1]?.onClick,
            onInputTokenSelect: onSelectSellToken,
          }}
          amountShortcuts={amountShortcuts}
          footer={
            validation.sellTokenWarning
              ? openTokenSelector => (
                  <FieldWarning onViewSupportedTokens={openTokenSelector}>{validation.sellTokenWarning}</FieldWarning>
                )
              : undefined
          }
          selectClassName={validation.sellTokenWarning ? UNUSABLE_TOKEN_SELECT_CLASS : undefined}
          // The trigger is evaluated against the chain's oracle, so a token it has no feed for cannot be monitored.
          requireOracle
        />

        <TriggerPriceSection
          sellCurrency={currencyIn}
          receiveCurrency={currencyOut}
          triggerPrice={form.triggerPrice}
          triggerPercent={form.triggerPercent}
          marketPrice={form.marketPrice}
          isLoadingPrice={form.loadingMarketPrice}
          onChangeTriggerPrice={form.onChangeTriggerPrice}
          onChangeTriggerPercent={form.onChangeTriggerPercent}
          onSetMarketPrice={form.onSetMarketPrice}
        />

        {/* Between the trigger and what it yields, with the switch at its end as the design lays it out. */}
        <div className="-my-1 px-1">
          <SlippageSetting
            alwaysVisible
            // The default copy describes a swap the user sends themselves; a stop order is settled by
            // an operator, so there is no transaction of theirs to revert.
            tooltip={t`The most your fill may fall below the oracle price when the order executes, after fees. Too tight and the order may not fill at all.`}
            slippage={{ value: form.slippage, onChange: form.setSlippage }}
            // The swap form's numbers for this pair's category, scaled for a stop order; the wording stays the
            // stop order's own, since the setting is measured against the oracle at execution rather than a
            // fresh quote.
            slippageInfo={{
              default: form.defaultSlippage,
              presets: form.slippagePresets,
              isLow: form.slippageStatus === SLIPPAGE_STATUS.LOW,
              isHigh: form.slippageStatus === SLIPPAGE_STATUS.HIGH,
              message:
                form.slippageStatus === SLIPPAGE_STATUS.LOW
                  ? t`Slippage this low may cause your stop order to fail during volatile markets — the conditions it exists for.`
                  : form.slippageStatus === SLIPPAGE_STATUS.HIGH
                  ? t`Slippage this high means your order could fill meaningfully below the market price at the moment it executes.`
                  : '',
            }}
            rightComponent={
              <div data-testid="stop-order-switch-pair">
                <ReverseTokenSelectionButton className="size-6 bg-buttonGray p-0.5" onClick={form.onSwitchPair} />
              </div>
            }
          />
        </div>

        <StopOrderReceiveSection
          sellCurrency={currencyIn}
          receiveCurrency={currencyOut}
          estimatedOutput={form.estimatedOutput}
          estimatedUsd={estimateUsd.output}
          triggerPrice={form.triggerPrice}
          onSelectCurrency={onSelectReceiveToken}
          warning={
            validation.receiveTokenWarning
              ? openTokenSelector => (
                  <FieldWarning onViewSupportedTokens={isReceiveTokenUnavailable ? openTokenSelector : undefined}>
                    {validation.receiveTokenWarning}
                  </FieldWarning>
                )
              : undefined
          }
          selectClassName={validation.receiveTokenWarning ? UNUSABLE_TOKEN_SELECT_CLASS : undefined}
        />

        {/* The fee sits beside the expiry, and what it means for a small order right under them. */}
        <Stack className="-mt-1 gap-3 px-1">
          <LimitOrderExpirySection
            expiry={{
              expire: form.expire,
              expanded: form.expiryExpanded,
              customDateExpire: form.customDateExpire,
              displayTime: form.displayTime,
            }}
            events={{
              onToggleExpanded: () => form.setExpiryExpanded(expanded => !expanded),
              onOpenDatePicker: form.toggleDatePicker,
              onExpireChange: form.onChangeExpire,
            }}
            presetOptions={expiryPresets}
            tooltip={t`You can cancel anytime before expiry at no cost.`}
            rightComponent={<StopOrderFeeValue fee={feeEstimate.fee} isLoading={feeEstimate.isLoading} />}
          />
          <StopOrderFeeNotes
            fee={feeEstimate.fee}
            isLoading={feeEstimate.isLoading}
            errorMessage={feeEstimate.errorMessage}
          />
        </Stack>

        {validation.formWarnings.length > 0 && (
          <Stack className="gap-3" data-testid="stop-order-warnings">
            {validation.formWarnings.map((warning, index) => (
              <ErrorWarning
                type={warning.type}
                key={index}
                title={warning.message}
                dataTestId="stop-order-warning"
                // Fades in when it appears; keyed by position, so a message that changes while the user
                // types updates in place instead of flashing again.
                className="animate-[fadeIn_0.2s_ease-out_both] motion-reduce:animate-none"
              />
            ))}
          </Stack>
        )}

        {!account ? (
          <ButtonLight onClick={toggleWalletModal} data-testid="stop-order-connect-wallet">
            <Trans>Connect</Trans>
          </ButtonLight>
        ) : (
          <ButtonPrimary
            id="place-stop-order-button"
            data-testid="stop-order-place-order-button"
            disabled={disableAction}
            onClick={() => {
              const expiredAt = form.startExpiry()
              tracking.trackReviewOpened({
                currencyIn,
                currencyOut,
                chainId: form.chainId,
                inputAmount: form.inputAmount,
                triggerPrice: form.triggerPrice,
                triggerPercent: form.triggerPercent,
                slippage: form.slippage,
                expiredAt,
              })
              setShowReview(true)
            }}
          >
            <span className="font-medium">{actionLabel}</span>
          </ButtonPrimary>
        )}
      </Stack>

      <StopOrderFlow
        isOpen={showReview}
        currencyIn={currencyIn}
        currencyOut={currencyOut}
        inputAmount={form.inputAmount}
        estimatedOutput={form.estimatedOutput}
        estimatedUsdIn={estimateUsd.input}
        triggerPrice={form.triggerPrice}
        triggerPercent={form.triggerPercent}
        slippage={form.slippage}
        expiredAt={form.expiredAt}
        warnings={validation.reviewWarnings}
        fee={feeEstimate.fee}
        isFeeLoading={feeEstimate.isLoading}
        feeError={feeEstimate.errorMessage}
        onRetryFee={feeEstimate.refetch}
        onDismiss={() => setShowReview(false)}
        createOrder={createOrder}
      />

      <DateTimePicker
        returnPresetValue
        // Same list as the inline control: anything it does not recognise is read as an absolute
        // timestamp, which turns a duration like 90 days into a 1970 date.
        defaultOptions={expiryPresets}
        defaultDate={form.customDateExpire}
        expire={form.expire}
        isOpen={form.showDatePicker}
        onDismiss={form.toggleDatePicker}
        onSetDate={form.onChangeExpire}
      />
    </>
  )
}

export default memo(StopOrderForm)

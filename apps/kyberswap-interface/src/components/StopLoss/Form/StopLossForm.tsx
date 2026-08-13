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
import StopLossOrderFlow from 'components/StopLoss/CreateOrder/StopLossOrderFlow'
import { useCreateStopLossOrder } from 'components/StopLoss/CreateOrder/useCreateStopLossOrder'
import StopLossReceiveSection from 'components/StopLoss/Form/StopLossReceiveSection'
import TriggerPriceSection from 'components/StopLoss/Form/TriggerPriceSection'
import { useStopLossFormState } from 'components/StopLoss/Form/useStopLossFormState'
import { useStopLossWarnings } from 'components/StopLoss/Form/useStopLossWarnings'
import OrderTypeSubTabs from 'components/StopLoss/OrderTypeSubTabs'
import {
  STOP_LOSS_SLIPPAGE_HIGH_THRESHOLD,
  STOP_LOSS_SLIPPAGE_LOW_THRESHOLD,
  STOP_LOSS_SLIPPAGE_PRESETS,
  getStopLossExpiryPresets,
} from 'components/StopLoss/constants'
import { useStopLossTracking } from 'components/StopLoss/hooks/useStopLossTracking'
import SlippageSetting from 'components/SwapForm/SlippageSetting'
import { useActiveWeb3React } from 'hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { restrictedTokenMessage, useIsTokenRestricted } from 'hooks/useRestrictedTokens'
import { useWalletModalToggle } from 'state/application/hooks'
import { useLimitState } from 'state/limit/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { halfAmountSpend, maxAmountSpend } from 'utils/maxAmountSpend'
import { formatSlippage } from 'utils/slippage'

type StopLossFormProps = {
  currencyIn?: Currency
  currencyOut?: Currency
}

/** A note about the field it sits in, so it reads as part of that input rather than of the form. */
const FieldWarning = ({ children }: { children: ReactNode }) => (
  <HStack className="items-start gap-1.5 text-xs font-medium text-warning" data-testid="stop-loss-field-warning">
    <AlertTriangle size={14} className="mt-px shrink-0" />
    <span>{children}</span>
  </HStack>
)

const StopLossForm = ({ currencyIn: currencyInProp, currencyOut: currencyOutProp }: StopLossFormProps) => {
  const toggleWalletModal = useWalletModalToggle()
  const { account } = useActiveWeb3React()
  const limitState = useLimitState()

  const currencyIn = currencyInProp || limitState.currencyIn
  const currencyOut = currencyOutProp || limitState.currencyOut

  const [showReview, setShowReview] = useState(false)
  const tracking = useStopLossTracking()
  const trackedPageView = useRef(false)

  const form = useStopLossFormState({ currencyIn, currencyOut })
  const validation = useStopLossWarnings({
    chainId: form.chainId,
    currencyIn,
    currencyOut,
    triggerPercent: form.triggerPercent,
    triggerAtOrAboveMarket: form.triggerAtOrAboveMarket,
  })

  const createOrder = useCreateStopLossOrder({
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
  const expiryPresets = useMemo(() => getStopLossExpiryPresets(), [locale])

  // Both sides report to the same funnel event the tracking spec defines.
  const onSelectSellToken = (currency: Currency) => {
    tracking.trackTokenSelected(currency)
    form.onSelectCurrencyIn(currency)
  }
  const onSelectReceiveToken = (currency: Currency) => {
    tracking.trackTokenSelected(currency)
    form.onSelectCurrencyOut(currency)
  }

  const lowSlippageThreshold = formatSlippage(STOP_LOSS_SLIPPAGE_LOW_THRESHOLD)
  const highSlippageThreshold = formatSlippage(STOP_LOSS_SLIPPAGE_HIGH_THRESHOLD)

  const isMissingAmount = !form.inputAmount || Number(form.inputAmount) === 0
  const isMissingTrigger = !form.triggerPrice || Number(form.triggerPrice) === 0
  const disableAction =
    !!restrictedCurrency || isMissingAmount || isMissingTrigger || insufficientBalance || validation.shouldDisableAction

  const actionLabel = restrictedCurrency ? (
    restrictedTokenMessage(restrictedCurrency.symbol)
  ) : isMissingAmount ? (
    <Trans>Enter an amount</Trans>
  ) : isMissingTrigger ? (
    <Trans>Set a trigger price</Trans>
  ) : insufficientBalance ? (
    <Trans>Insufficient {currencyIn?.symbol} balance</Trans>
  ) : (
    <Trans>Place Stop-Loss Order</Trans>
  )

  return (
    <>
      <Stack className="gap-4" data-testid="stop-loss-form">
        <OrderTypeSubTabs />

        <LimitOrderInputTokenPanel
          chainId={form.chainId}
          tokens={{ currencyIn, currencyOut, inputAmount: form.inputAmount }}
          estimateUsd={estimateUsd}
          events={{
            onInputAmountChange: form.setInputValue,
            // Go through the shared spend helpers so native currency keeps whatever they hold back.
            onMaxInput: () => {
              const max = maxAmountSpend(balance)
              if (max) form.setInputValue(max.toExact())
            },
            onHalfInput: () => {
              const half = halfAmountSpend(balance)
              if (half) form.setInputValue(half.toExact())
            },
            onInputTokenSelect: onSelectSellToken,
          }}
          footer={validation.sellTokenWarning ? <FieldWarning>{validation.sellTokenWarning}</FieldWarning> : undefined}
        />

        <TriggerPriceSection
          receiveCurrency={currencyOut}
          triggerPrice={form.triggerPrice}
          triggerPercent={form.triggerPercent}
          marketPrice={form.marketPrice}
          isLoadingPrice={form.loadingMarketPrice}
          onChangeTriggerPrice={form.onChangeTriggerPrice}
          onChangeTriggerPercent={form.onChangeTriggerPercent}
          onSetMarketPrice={form.onSetMarketPrice}
        />

        <StopLossReceiveSection
          sellCurrency={currencyIn}
          receiveCurrency={currencyOut}
          estimatedOutput={form.estimatedOutput}
          estimatedUsd={estimateUsd.output}
          triggerPrice={form.triggerPrice}
          onSelectCurrency={onSelectReceiveToken}
          warning={
            validation.receiveTokenWarning ? <FieldWarning>{validation.receiveTokenWarning}</FieldWarning> : undefined
          }
        />

        {/* The two headers sit side by side, but an open panel spans the whole row: half the form is
            189px, where the slippage presets shrink under their own labels and the expiry pills wrap
            out of their border. Each control places its own header and panel into this grid, so
            opening one never moves the other's header. Below xxs the row is a single column. */}
        <div className="grid grid-cols-2 items-start gap-x-4 max-xxs:grid-cols-1">
          <SlippageSetting
            alwaysVisible
            // The default copy describes a swap the user sends themselves; a stop-loss is settled by
            // an operator, so there is no transaction of theirs to revert.
            tooltip={t`The most your fill may fall below the oracle price when the order executes, after fees. Too tight and the order may not fill at all.`}
            gridCells={{ header: 'col-start-1 row-start-1 min-w-0', panel: 'col-span-full row-start-2' }}
            slippage={{ value: form.slippage, onChange: form.setSlippage }}
            slippageInfo={{
              default: STOP_LOSS_SLIPPAGE_PRESETS[0],
              presets: STOP_LOSS_SLIPPAGE_PRESETS,
              isLow: form.slippage < STOP_LOSS_SLIPPAGE_LOW_THRESHOLD,
              isHigh: form.slippage > STOP_LOSS_SLIPPAGE_HIGH_THRESHOLD,
              message:
                form.slippage < STOP_LOSS_SLIPPAGE_LOW_THRESHOLD
                  ? t`Slippage below ${lowSlippageThreshold} may cause your stop-loss to fail during volatile markets — the conditions it exists for.`
                  : form.slippage > STOP_LOSS_SLIPPAGE_HIGH_THRESHOLD
                  ? t`Slippage above ${highSlippageThreshold} means your order could fill meaningfully below the market price at the moment it executes.`
                  : '',
            }}
          />

          <LimitOrderExpirySection
            gridCells={{
              header: 'col-start-2 row-start-1 min-w-0 max-xxs:col-start-1 max-xxs:row-start-3 max-xxs:mt-4',
              panel: 'col-span-full row-start-3 max-xxs:row-start-4',
            }}
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
          />
        </div>

        {validation.formWarnings.length > 0 && (
          <Stack className="gap-3" data-testid="stop-loss-warnings">
            {validation.formWarnings.map((warning, index) => (
              <ErrorWarning type={warning.type} key={index} title={warning.message} dataTestId="stop-loss-warning" />
            ))}
          </Stack>
        )}

        {!account ? (
          <ButtonLight onClick={toggleWalletModal} data-testid="stop-loss-connect-wallet">
            <Trans>Connect</Trans>
          </ButtonLight>
        ) : (
          <ButtonPrimary
            id="place-stop-loss-button"
            data-testid="stop-loss-place-order-button"
            disabled={disableAction}
            onClick={() => {
              tracking.trackReviewOpened({
                currencyIn,
                currencyOut,
                chainId: form.chainId,
                inputAmount: form.inputAmount,
                triggerPrice: form.triggerPrice,
                triggerPercent: form.triggerPercent,
                slippage: form.slippage,
                expiredAt: form.expiredAt,
              })
              setShowReview(true)
            }}
          >
            <span className="font-medium">{actionLabel}</span>
          </ButtonPrimary>
        )}
      </Stack>

      <StopLossOrderFlow
        isOpen={showReview}
        currencyIn={currencyIn}
        currencyOut={currencyOut}
        inputAmount={form.inputAmount}
        estimatedOutput={form.estimatedOutput}
        estimatedUsdIn={estimateUsd.input}
        estimatedUsdOut={estimateUsd.output}
        triggerPrice={form.triggerPrice}
        triggerPercent={form.triggerPercent}
        slippage={form.slippage}
        expiredAt={form.expiredAt}
        notionalUsd={estimateUsd.rawInput}
        warnings={validation.reviewWarnings}
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

export default memo(StopLossForm)

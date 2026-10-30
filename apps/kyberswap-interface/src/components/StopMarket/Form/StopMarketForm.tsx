import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { ReactNode, memo, useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import { useBalanceAmountShortcuts } from 'components/CurrencyInputPanel/useBalanceAmountShortcuts'
import DateTimePicker from 'components/DateTimePicker'
import { ErrorWarning } from 'components/ErrorWarning'
import LimitOrderExpirySection from 'components/LimitOrder/Form/LimitOrderExpirySection'
import { LimitOrderInputTokenPanel } from 'components/LimitOrder/Form/LimitOrderTokenSection'
import { calcUsdPrices } from 'components/LimitOrder/utils'
import { Stack } from 'components/Stack'
import { useStopMarketFlow } from 'components/StopMarket/CreateOrder/StopMarketFlow'
import { StopMarketFeeNotes, StopMarketFeeValue } from 'components/StopMarket/Form/StopMarketFeeSummary'
import StopMarketReceiveSection from 'components/StopMarket/Form/StopMarketReceiveSection'
import TriggerPriceSection, { HigherOraclePriceWarning } from 'components/StopMarket/Form/TriggerPriceSection'
import { useStopMarketFormState } from 'components/StopMarket/Form/useStopMarketFormState'
import { useStopMarketWarnings } from 'components/StopMarket/Form/useStopMarketWarnings'
import { StopMarketNotice } from 'components/StopMarket/StopMarketNotice'
import { getStopMarketExpiryPresets } from 'components/StopMarket/constants'
import { useStopMarketFeeEstimate } from 'components/StopMarket/hooks/useStopMarketFeeEstimate'
import { useStopMarketTracking } from 'components/StopMarket/hooks/useStopMarketTracking'
import ReverseTokenSelectionButton from 'components/SwapForm/CurrencyInput/ReverseTokenSelectionButton'
import SlippageSetting from 'components/SwapForm/Settings/SlippageSetting'
import { useActiveWeb3React } from 'hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { restrictedTokenMessage, useIsTokenRestricted } from 'hooks/useRestrictedTokens'
import { useWalletModalToggle } from 'state/application/hooks'
import { useLimitState } from 'state/limit/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { SLIPPAGE_STATUS } from 'utils/slippage'

type StopMarketFormProps = {
  currencyIn?: Currency
  currencyOut?: Currency
}

/** Flags the token button of a field whose token cannot be used for a stop market order. */
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
  <StopMarketNotice type="warn" dataTestId="stop-market-field-warning">
    <Stack className="gap-0.5">
      <span>{children}</span>
      {onViewSupportedTokens && (
        <button
          type="button"
          data-testid="stop-market-view-supported-tokens"
          className="w-fit cursor-pointer border-0 bg-transparent p-0 text-left text-primary hover:brightness-110"
          onClick={onViewSupportedTokens}
        >
          <Trans>View supported tokens</Trans>
        </button>
      )}
    </Stack>
  </StopMarketNotice>
)

const StopMarketForm = ({ currencyIn: currencyInProp, currencyOut: currencyOutProp }: StopMarketFormProps) => {
  const toggleWalletModal = useWalletModalToggle()
  const { account } = useActiveWeb3React()
  const limitState = useLimitState()

  const currencyIn = currencyInProp || limitState.currencyIn
  const currencyOut = currencyOutProp || limitState.currencyOut

  const tracking = useStopMarketTracking()
  const trackedPageView = useRef(false)
  const location = useLocation()
  // Entry buttons hand their origin over through router state; a link carrying a pair in the query is a deep link.
  const pageSource = useMemo(() => {
    const stateSource = (location.state as { source?: string } | null)?.source
    if (stateSource) return stateSource
    const params = new URLSearchParams(location.search)
    return params.has('inputCurrency') || params.has('outputCurrency') ? 'deep_link' : 'nav'
    // Read once at landing; later navigation inside the page does not change where the user came from.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const form = useStopMarketFormState({ currencyIn, currencyOut })
  const isTriggerAboveOracle = (form.triggerPercent ?? 0) > 0
  const validation = useStopMarketWarnings({
    chainId: form.chainId,
    currencyIn,
    currencyOut,
    inputAmount: form.inputAmount,
    marketPriceUnavailable: form.marketPriceUnavailable,
    isTriggerAboveOracle,
  })

  const estimateUsd = calcUsdPrices({
    inputAmount: form.inputAmount,
    outputAmount: form.outputAmount,
    priceUsdIn: form.tradeInfo?.priceUsdIn,
    priceUsdOut: form.tradeInfo?.priceUsdOut,
    currencyIn,
    currencyOut,
  })

  const amountUsd = estimateUsd.rawInput || undefined

  const { openReview, flow } = useStopMarketFlow({ onOrderCreated: form.onResetForm })

  const isTokenRestricted = useIsTokenRestricted()
  const restrictedCurrency = isTokenRestricted(currencyIn)
    ? currencyIn
    : isTokenRestricted(currencyOut)
    ? currencyOut
    : undefined

  const balance = useCurrencyBalance(currencyIn ?? undefined, form.chainId)
  const parsedInputAmount = useMemo(() => tryParseAmount(form.inputAmount, currencyIn), [form.inputAmount, currencyIn])
  const hasMatchingBalance = !!parsedInputAmount && !!balance?.currency.equals(parsedInputAmount.currency)
  const insufficientBalance = hasMatchingBalance && !!balance?.lessThan(parsedInputAmount)
  const needsWrap = !!currencyIn?.isNative && hasMatchingBalance && !insufficientBalance

  const amountShortcuts = useBalanceAmountShortcuts(balance, form.inputAmount, form.setInputValue, 'stop-market-amount')

  // Shown while the terms are set and again in the review; signing estimates once more for the cap.
  const feeEstimate = useStopMarketFeeEstimate({
    currencyIn,
    currencyOut,
    inputAmount: form.inputAmount,
    triggerPrice: form.triggerPrice,
    slippage: form.slippage,
    expiredAt: form.expiredAt,
    pollingInterval: 30_000,
  })

  useEffect(() => {
    if (trackedPageView.current) return
    trackedPageView.current = true
    tracking.trackPageViewed(form.chainId, pageSource)
  }, [tracking, form.chainId, pageSource])

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
  const expiryPresets = useMemo(() => getStopMarketExpiryPresets(), [locale])

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
  // A cleared Amount Out leaves the trigger as it was, but the order is not placed with that field blank.
  const isMissingOutput = !form.outputAmount || Number(form.outputAmount) === 0
  // Review opens only with a complete estimate; errors are retried on this form.
  const disableAction =
    !!restrictedCurrency ||
    isMissingAmount ||
    isMissingTrigger ||
    isTriggerAboveOracle ||
    isMissingOutput ||
    insufficientBalance ||
    form.loadingMarketPrice ||
    feeEstimate.isLoading ||
    !feeEstimate.fee ||
    validation.shouldDisableAction

  const handleReview = () => {
    if (!account || disableAction || !feeEstimate.fee) return
    openReview({
      currencyIn,
      currencyOut,
      inputAmount: form.inputAmount,
      estimatedOutput: form.estimatedOutput,
      estimatedUsdIn: estimateUsd.input,
      amountUsd,
      triggerPrice: form.triggerPrice,
      triggerPercent: form.triggerPercent,
      marketPrice: form.marketPrice,
      slippage: form.slippage,
      expiredAt: form.expiredAt,
      fee: feeEstimate.fee,
      warnings: validation.reviewWarnings,
      needsWrap,
    })
    tracking.trackReviewOpened({
      currencyIn,
      currencyOut,
      chainId: form.chainId,
      inputAmount: form.inputAmount,
      amountUsd,
      triggerPrice: form.triggerPrice,
      triggerPercent: form.triggerPercent,
      slippage: form.slippage,
      expiredAt: form.expiredAt,
    })
  }

  const unavailableToken = validation.unavailableToken
  const isReceiveTokenUnavailable = !!unavailableToken && !!currencyOut && unavailableToken.equals(currencyOut)

  const actionLabel = restrictedCurrency ? (
    restrictedTokenMessage(restrictedCurrency.symbol)
  ) : unavailableToken ? (
    <Trans>Stop Market order not available for {unavailableToken.symbol}</Trans>
  ) : isMissingAmount || (isMissingOutput && !isMissingTrigger) ? (
    <Trans>Enter an amount</Trans>
  ) : isMissingTrigger ? (
    <Trans>Set a trigger price</Trans>
  ) : insufficientBalance ? (
    <Trans>Insufficient {currencyIn?.symbol} funds</Trans>
  ) : (
    <Trans>Place Stop Market Order</Trans>
  )

  return (
    <>
      <Stack className="gap-4" data-testid="stop-market-form">
        <Stack className="gap-3">
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

          <Stack className="gap-2">
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
            <SlippageSetting
              alwaysVisible
              // The default copy describes a swap the user sends themselves; a stop market order is settled by
              // an operator, so there is no transaction of theirs to revert.
              tooltip={t`The most your fill may fall below the Oracle price when the order executes, after fees. Too tight and the order may not fill at all.`}
              slippage={{ value: form.slippage, onChange: form.setSlippage }}
              // Stop Market's own settings and wording: slippage is measured against the oracle at execution.
              slippageInfo={{
                default: form.defaultSlippage,
                presets: form.slippagePresets,
                isLow: form.slippageStatus === SLIPPAGE_STATUS.LOW,
                isHigh: form.slippageStatus === SLIPPAGE_STATUS.HIGH,
                message:
                  form.slippageStatus === SLIPPAGE_STATUS.LOW
                    ? t`Slippage this low may cause your Stop Market order to fail during volatile markets — the conditions it exists for.`
                    : form.slippageStatus === SLIPPAGE_STATUS.HIGH
                    ? t`Slippage this high means your order could fill meaningfully below the market price at the moment it executes.`
                    : '',
              }}
              rightComponent={
                <div data-testid="stop-market-switch-pair">
                  <ReverseTokenSelectionButton className="size-6 bg-buttonGray p-0.5" onClick={form.onSwitchPair} />
                </div>
              }
            />

            <StopMarketReceiveSection
              sellCurrency={currencyIn}
              receiveCurrency={currencyOut}
              outputAmount={form.outputAmount}
              estimatedUsd={estimateUsd.output}
              onChangeOutput={form.onChangeOutput}
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
          </Stack>
        </Stack>

        <Stack className="gap-6">
          <Stack className="gap-4">
            {/* The fee sits beside the expiry, and what it means for a small order right under them. */}
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
              rightComponent={
                <StopMarketFeeValue fee={feeEstimate.fee} isLoading={feeEstimate.isLoading} chainId={form.chainId} />
              }
            />
            {!isTriggerAboveOracle && (
              <StopMarketFeeNotes
                fee={feeEstimate.fee}
                isLoading={feeEstimate.isLoading}
                errorMessage={feeEstimate.errorMessage}
                onRetry={feeEstimate.refetch}
                showShareWarning
              />
            )}

            {(validation.formWarnings.length > 0 || isTriggerAboveOracle) && (
              <Stack className="gap-3" data-testid="stop-market-warnings">
                <HigherOraclePriceWarning
                  sellCurrency={currencyIn}
                  receiveCurrency={currencyOut}
                  triggerPercent={form.triggerPercent}
                />
                {validation.formWarnings.map((warning, index) => (
                  <ErrorWarning
                    type={warning.type}
                    key={index}
                    title={warning.message}
                    dataTestId="stop-market-warning"
                    // Fades in when it appears; keyed by position, so a message that changes while the user
                    // types updates in place instead of flashing again.
                    className="animate-[fadeIn_0.2s_ease-out_both] motion-reduce:animate-none"
                  />
                ))}
              </Stack>
            )}
          </Stack>

          {!account ? (
            <ButtonLight onClick={toggleWalletModal} data-testid="stop-market-connect-wallet">
              <Trans>Connect</Trans>
            </ButtonLight>
          ) : (
            <ButtonPrimary
              id="place-stop-market-button"
              data-testid="stop-market-place-order-button"
              disabled={disableAction}
              onClick={handleReview}
            >
              <span className="font-medium">{actionLabel}</span>
            </ButtonPrimary>
          )}
        </Stack>
      </Stack>

      {flow}

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

export default memo(StopMarketForm)

import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import AnimatedHeight from 'components/AnimatedHeight'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import { AmountShortcutChips } from 'components/CurrencyInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import DateTimePicker from 'components/DateTimePicker'
import { ErrorWarning } from 'components/ErrorWarning'
import Wallet from 'components/Icons/Wallet'
import LimitOrderExpirySection from 'components/LimitOrder/Form/LimitOrderExpirySection'
import { calcOutput } from 'components/LimitOrder/utils'
import Modal from 'components/Modal'
import NumericalInput from 'components/NumericalInput'
import { HStack, Stack } from 'components/Stack'
import {
  StopMarketReviewSummary,
  isStopMarketReviewBlocked,
} from 'components/StopMarket/CreateOrder/StopMarketConfirmModal'
import { useStopMarketProcessing } from 'components/StopMarket/CreateOrder/StopMarketFlow'
import { useCreateStopMarket } from 'components/StopMarket/CreateOrder/useCreateStopMarket'
import { StopMarketFeeNotes, StopMarketFeeValue } from 'components/StopMarket/Form/StopMarketFeeSummary'
import TriggerPriceSection from 'components/StopMarket/Form/TriggerPriceSection'
import { useStopMarketWarnings } from 'components/StopMarket/Form/useStopMarketWarnings'
import { getStopMarketExpiryPresets } from 'components/StopMarket/constants'
import { useStopMarketAmountShortcuts } from 'components/StopMarket/hooks/useStopMarketAmountShortcuts'
import { useStopMarketCurrency } from 'components/StopMarket/hooks/useStopMarketCurrency'
import { useStopMarketFeeEstimate } from 'components/StopMarket/hooks/useStopMarketFeeEstimate'
import { useStopMarketOraclePrice } from 'components/StopMarket/hooks/useStopMarketOraclePrice'
import { useStopMarketSlippageOptions } from 'components/StopMarket/hooks/useStopMarketSlippageOptions'
import { useStopMarketTracking } from 'components/StopMarket/hooks/useStopMarketTracking'
import { StopMarket } from 'components/StopMarket/types'
import {
  MAX_STOP_MARKET_DEADLINE,
  formatTriggerPriceValue,
  getStopMarketTriggerPrice,
  getTriggerPercent,
} from 'components/StopMarket/utils'
import SlippageSetting from 'components/SwapForm/SlippageSetting'
import { useActiveWeb3React } from 'hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { tryParseAmount } from 'state/swap/hooks'
import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { CloseIcon } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { SLIPPAGE_STATUS } from 'utils/slippage'
import { formatTimeDuration } from 'utils/time'

/** Neither set, the order keeps the deadline it was signed with. */
type EditExpiry = { expire?: number; customDate?: Date }

/** The surfaces of the creation review, which this dialog shares: fields on a fill one step off its own. */
const FIELD_CLASS = 'rounded-xl bg-buttonGray p-3'

/** The two faces of the dialog: the fields, then the new terms as they will be signed. */
type EditStep = 'edit' | 'review'

/** Each face fades in as it takes the other's place. */
const STEP_CLASS = 'w-full animate-[fadeIn_0.2s_ease-out_both] gap-4 motion-reduce:animate-none'

/** The frame both faces share: a title with the close button, the body, and the buttons over the signing note. */
const StepShell = ({
  title,
  dataTestId,
  closeTestId,
  orderId,
  className,
  actions,
  onClose,
  children,
}: {
  title: ReactNode
  dataTestId: string
  closeTestId: string
  orderId: number
  className?: string
  actions: ReactNode
  onClose: () => void
  children: ReactNode
}) => (
  <Stack className={cn(STEP_CLASS, className)} data-testid={dataTestId} data-order-id={orderId}>
    <HStack className="items-center justify-between gap-4">
      <span className="text-xl font-medium leading-tight text-text">{title}</span>
      <CloseIcon onClick={onClose} data-testid={closeTestId} />
    </HStack>
    {children}
    <Stack className="gap-3">
      <HStack className="gap-3">{actions}</HStack>
      {/* The replacement is signed like the original — an off-chain signature, no transaction. */}
      <span className="text-center text-xs font-medium italic text-subText" data-testid="stop-market-edit-note">
        <Trans>Updating requires a new signature. No gas</Trans>
      </span>
    </Stack>
  </Stack>
)

const formatUsd = (value: number) =>
  Number.isFinite(value) && value > 0
    ? formatDisplayNumber(value, { style: 'currency', significantDigits: 6 })
    : undefined

type Props = {
  order: StopMarket
  onDismiss: () => void
}

/**
 * Edits an open order from the list. The pair and the receiver are part of what the order is, so only
 * the amount, trigger, slippage and expiry can change; the new terms are reviewed and then signed as a
 * replacement of the order, which the service swaps in atomically. The edit stands only for the wallet
 * and chain that own the order — the replacement is signed by that wallet, on that chain.
 */
const StopMarketEditModal = ({ order, onDismiss }: Props) => {
  const { account, chainId } = useActiveWeb3React()
  const tracking = useStopMarketTracking()
  const sellCurrency = useStopMarketCurrency(order.tokenInInfo, order.chainId)
  const receiveCurrency = useStopMarketCurrency(order.tokenOutInfo, order.chainId)
  const sellSymbol = sellCurrency.symbol ?? ''
  const receiveSymbol = receiveCurrency.symbol ?? ''

  const originalAmount = useMemo(
    () => CurrencyAmount.fromRawAmount(sellCurrency, order.amountIn).toExact(),
    [sellCurrency, order.amountIn],
  )
  const originalTrigger = getStopMarketTriggerPrice(order)

  const [step, setStep] = useState<EditStep>('edit')
  const [inputAmount, setInputAmount] = useState(originalAmount)
  const [triggerPrice, setTriggerPrice] = useState(originalTrigger)
  const [slippage, setSlippage] = useState(order.slippage)
  const [expiry, setExpiry] = useState<EditExpiry>({})
  const [expiryExpanded, setExpiryExpanded] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  // The processing modal stands in for this one while the update is signed.
  const [isProcessing, setIsProcessing] = useState(false)

  /**
   * Another wallet ends the edit at once. A chain mismatch ends it only once the edit has been on screen:
   * an order from another chain is opened right after the network switch, which the active chain can
   * still be catching up with, and nothing is shown until it has.
   */
  const isOwnOrder = !!account && account.toLowerCase() === order.userWallet.toLowerCase()
  const isOnOrderChain = chainId === order.chainId
  const wasOnOrderChain = useRef(false)
  useEffect(() => {
    if (isOwnOrder && isOnOrderChain) {
      wasOnOrderChain.current = true
      return
    }
    if (!isOwnOrder || wasOnOrderChain.current) onDismiss()
  }, [isOwnOrder, isOnOrderChain, onDismiss])

  // The order's own pair, not the one on the page behind the modal.
  const pair = useMemo(() => ({ tokenIn: order.tokenIn, tokenOut: order.tokenOut }), [order.tokenIn, order.tokenOut])
  const { defaultSlippage, slippagePresets, getSlippageStatus } = useStopMarketSlippageOptions(order.chainId, pair)
  const slippageStatus = getSlippageStatus(slippage)

  const { priceNumber: marketPrice, isLoading: loadingMarketPrice } = useStopMarketOraclePrice(
    sellCurrency,
    receiveCurrency,
    order.chainId,
  )
  const trigger = Number(triggerPrice)
  const hasTrigger = trigger > 0 && Number.isFinite(trigger)
  const triggerPercent = marketPrice && hasTrigger ? getTriggerPercent(trigger, marketPrice) : undefined

  /** The percent chip is the same value from the other side, so typing in it drives the price. */
  const onChangeTriggerPercent = (percent: string) => {
    const parsed = Number(percent)
    if (!marketPrice || !Number.isFinite(parsed)) {
      setTriggerPrice('')
      return
    }
    setTriggerPrice(formatTriggerPriceValue(marketPrice * (1 + parsed / 100)))
  }
  const onSetMarketPrice = () => {
    if (marketPrice) setTriggerPrice(formatTriggerPriceValue(marketPrice))
  }

  const parsedAmount = useMemo(() => tryParseAmount(inputAmount, sellCurrency), [inputAmount, sellCurrency])
  const estimatedOutput = useMemo(
    () => (inputAmount && hasTrigger ? calcOutput(inputAmount, triggerPrice, receiveCurrency.decimals) : ''),
    [inputAmount, hasTrigger, triggerPrice, receiveCurrency.decimals],
  )

  const balance = useCurrencyBalance(sellCurrency, order.chainId)
  const amountShortcuts = useStopMarketAmountShortcuts(balance, inputAmount, setInputAmount, 'stop-market-edit-amount')

  const tokenAddresses = useMemo(() => [order.tokenIn], [order.tokenIn])
  const { data: prices } = useTokenPricesWithLoading(tokenAddresses, order.chainId)
  const sellPriceUsd = prices[order.tokenIn.toLowerCase()]
  const sellUsd = formatUsd(Number(inputAmount) * (sellPriceUsd ?? 0))
  // Analytics only; left out while the price is unknown rather than reported as zero.
  const amountUsd = sellPriceUsd ? Number(inputAmount) * sellPriceUsd : undefined

  const isAmountChanged = parsedAmount?.quotient.toString() !== order.amountIn
  const isTriggerChanged = trigger !== Number(originalTrigger)
  const isSlippageChanged = slippage !== order.slippage
  const isExpiryChanged = expiry.expire !== undefined || expiry.customDate !== undefined
  const hasChanges = isAmountChanged || isTriggerChanged || isSlippageChanged || isExpiryChanged

  // As on the creation form, a preset counts from the moment the update is confirmed.
  const [expiryStart, setExpiryStart] = useState(Date.now)
  const expiredAt =
    expiry.customDate?.getTime() ??
    (expiry.expire !== undefined ? expiryStart + expiry.expire * 1000 : order.deadline * 1000)

  const validation = useStopMarketWarnings({
    chainId: order.chainId,
    currencyIn: sellCurrency,
    currencyOut: receiveCurrency,
    inputAmount,
    marketPriceUnavailable: !loadingMarketPrice && !marketPrice,
    releasedAmount: order.amountIn,
  })
  // The pair cannot change here, so a token that has lost its feed has no field of its own to flag.
  const warnings = [
    ...[validation.sellTokenWarning, validation.receiveTokenWarning]
      .filter(Boolean)
      .map(message => ({ type: 'warn' as const, message })),
    ...validation.formWarnings,
  ]

  const createOrder = useCreateStopMarket({
    currencyIn: sellCurrency,
    currencyOut: receiveCurrency,
    inputAmount,
    triggerPrice,
    slippage,
    expiredAt,
    replacing: order,
    triggerPercent,
    amountUsd,
  })
  const feeEstimate = useStopMarketFeeEstimate({
    currencyIn: sellCurrency,
    currencyOut: receiveCurrency,
    inputAmount,
    triggerPrice,
    slippage,
    expiredAt,
  })

  const { start, processingModal } = useStopMarketProcessing({
    currencyIn: sellCurrency,
    currencyOut: receiveCurrency,
    isEdit: true,
    createOrder,
    onStart: () => setIsProcessing(true),
    // A finished run ends the edit; a failed one goes back to the review, values intact.
    onClose: completed => (completed ? onDismiss() : setIsProcessing(false)),
  })

  // A preset deadline counts from the click, so the run starts on the render that carries it.
  const [isStartRequested, setIsStartRequested] = useState(false)
  useEffect(() => {
    if (!isStartRequested) return
    setIsStartRequested(false)
    start()
  }, [isStartRequested, start])

  // The review shows the deadline as it stands; moving a preset's start here would re-key the fee estimate
  // and open the review on a skeleton for nothing.
  const openReview = () => {
    setStep('review')
    tracking.trackReviewOpened({
      currencyIn: sellCurrency,
      currencyOut: receiveCurrency,
      chainId: order.chainId,
      inputAmount,
      amountUsd,
      triggerPrice,
      triggerPercent,
      slippage,
      expiredAt,
      replacesOrderId: order.id,
    })
  }
  const confirm = () => {
    setExpiryStart(Date.now())
    setIsStartRequested(true)
  }

  // Stable per locale, for the reason the creation form gives.
  const locale = useActiveLocale()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const expiryPresets = useMemo(() => getStopMarketExpiryPresets(), [locale])
  const isForever = order.deadline >= MAX_STOP_MARKET_DEADLINE
  // The deadline as the time left, which fits beside the label.
  const originalExpiryLabel = isForever ? t`Forever` : formatTimeDuration(order.deadline - Date.now() / 1000)
  const displayTime = expiry.customDate
    ? dayjs(expiry.customDate).format('DD/MM/YYYY HH:mm')
    : expiry.expire !== undefined
    ? formatTimeDuration(expiry.expire)
    : originalExpiryLabel

  const isMissingAmount = !parsedAmount || parsedAmount.equalTo(0)
  const disableAction =
    !hasChanges ||
    isMissingAmount ||
    !hasTrigger ||
    createOrder.insufficientBalance ||
    loadingMarketPrice ||
    validation.shouldDisableAction

  const actionLabel = !hasChanges ? (
    <Trans>Review Update</Trans>
  ) : isMissingAmount ? (
    <Trans>Enter an amount</Trans>
  ) : !hasTrigger ? (
    <Trans>Set a trigger price</Trans>
  ) : createOrder.insufficientBalance ? (
    <Trans>Insufficient {sellSymbol} funds</Trans>
  ) : (
    <Trans>Review Update</Trans>
  )

  const review = {
    currencyIn: sellCurrency,
    currencyOut: receiveCurrency,
    inputAmount,
    estimatedOutput,
    estimatedUsdIn: sellUsd,
    triggerPrice,
    triggerPercent,
    slippage,
    expiredAt,
    fee: feeEstimate.fee,
    feeError: feeEstimate.errorMessage,
    isFeeLoading: feeEstimate.isLoading,
    onRetryFee: feeEstimate.refetch,
    warnings: validation.reviewWarnings,
  }
  const isReviewBlocked = isStopMarketReviewBlocked(review)

  const editStep = (
    <StepShell
      title={<Trans>Edit Stop Market Order</Trans>}
      dataTestId="stop-market-edit-modal"
      closeTestId="stop-market-edit-close"
      orderId={order.id}
      onClose={onDismiss}
      actions={
        <>
          <ButtonOutlined className="flex-1" onClick={onDismiss} data-testid="stop-market-edit-discard">
            <Trans>Discard changes</Trans>
          </ButtonOutlined>
          {/* Eases between enabled and disabled, which flips as the fields are typed in and the price loads. */}
          <ButtonPrimary
            className="flex-1 transition-colors duration-200"
            data-testid="stop-market-edit-review"
            disabled={disableAction}
            onClick={openReview}
          >
            <span className="font-medium">{actionLabel}</span>
          </ButtonPrimary>
        </>
      }
    >
      <Stack className={cn(FIELD_CLASS, 'gap-3')}>
        <HStack className="min-h-5 items-center justify-between gap-2">
          <HStack className="items-center gap-1">
            <span className="mr-1 text-sm text-subText">
              <Trans>You Sell</Trans>
            </span>
            {account && <AmountShortcutChips shortcuts={amountShortcuts} />}
          </HStack>
          <HStack
            className="items-center gap-1 text-xs font-medium text-subText"
            data-testid="stop-market-edit-balance"
          >
            <Wallet className="text-subText" />
            {balance ? balance.toSignificant(10) : '-'}
          </HStack>
        </HStack>
        <HStack className="min-w-0 items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center">
            <NumericalInput
              maxLength={50}
              className="bg-transparent text-2xl font-medium text-text"
              data-testid="stop-market-edit-amount"
              value={inputAmount}
              onUserInput={setInputAmount}
            />
          </div>
          {sellUsd && <span className="shrink-0 text-sm font-medium text-border">~{sellUsd}</span>}
          {/* The pair is fixed for an edit, so the token is shown rather than offered. */}
          <HStack className="shrink-0 items-center gap-1.5 rounded-full bg-tableHeader py-1 pl-1 pr-3 text-xl font-medium text-subText">
            <CurrencyLogo currency={sellCurrency} size="24px" />
            {sellSymbol}
          </HStack>
        </HStack>
      </Stack>

      <TriggerPriceSection
        className={FIELD_CLASS}
        sellCurrency={sellCurrency}
        receiveCurrency={receiveCurrency}
        triggerPrice={triggerPrice}
        triggerPercent={triggerPercent}
        marketPrice={marketPrice}
        isLoadingPrice={loadingMarketPrice}
        onChangeTriggerPrice={setTriggerPrice}
        onChangeTriggerPercent={onChangeTriggerPercent}
        onSetMarketPrice={onSetMarketPrice}
      />

      <div className="-my-1 px-1">
        <SlippageSetting
          alwaysVisible
          tooltip={t`The most your fill may fall below the oracle price when the order executes, after fees. Too tight and the order may not fill at all.`}
          slippage={{ value: slippage, onChange: setSlippage }}
          slippageInfo={{
            default: defaultSlippage,
            presets: slippagePresets,
            isLow: slippageStatus === SLIPPAGE_STATUS.LOW,
            isHigh: slippageStatus === SLIPPAGE_STATUS.HIGH,
            message:
              slippageStatus === SLIPPAGE_STATUS.LOW
                ? t`Slippage this low may cause your stop market order to fail during volatile markets — the conditions it exists for.`
                : slippageStatus === SLIPPAGE_STATUS.HIGH
                ? t`Slippage this high means your order could fill meaningfully below the market price at the moment it executes.`
                : '',
          }}
        />
      </div>

      <HStack className={cn(FIELD_CLASS, 'items-center justify-between gap-3')}>
        <span className="text-sm text-subText">
          <Trans>Amount Out</Trans>
        </span>
        <HStack
          className="min-w-0 items-center gap-1.5 text-lg font-medium text-text"
          data-testid="stop-market-edit-receive"
        >
          ~
          <CurrencyLogo currency={receiveCurrency} size="20px" />
          <span className="truncate">
            {estimatedOutput ? formatDisplayNumber(estimatedOutput, { significantDigits: 6 }) : '0'} {receiveSymbol}
          </span>
        </HStack>
      </HStack>

      <Stack className="gap-3 px-1">
        <LimitOrderExpirySection
          expiry={{
            expire: expiry.expire,
            expanded: expiryExpanded,
            customDateExpire: expiry.customDate,
            displayTime,
          }}
          events={{
            onToggleExpanded: () => setExpiryExpanded(expanded => !expanded),
            onOpenDatePicker: () => setShowDatePicker(true),
            onExpireChange: value => setExpiry(value instanceof Date ? { customDate: value } : { expire: value }),
          }}
          presetOptions={expiryPresets}
          tooltip={t`You can cancel anytime before expiry at no cost.`}
          rightComponent={
            <StopMarketFeeValue fee={feeEstimate.fee} isLoading={feeEstimate.isLoading} chainId={order.chainId} />
          }
        />
        <StopMarketFeeNotes
          fee={feeEstimate.fee}
          isLoading={feeEstimate.isLoading}
          errorMessage={feeEstimate.errorMessage}
          showShareWarning
        />
      </Stack>

      {warnings.length > 0 && (
        <Stack className="gap-3" data-testid="stop-market-warnings">
          {warnings.map((warning, index) => (
            <ErrorWarning
              type={warning.type}
              key={index}
              title={warning.message}
              dataTestId="stop-market-warning"
              className="animate-[fadeIn_0.2s_ease-out_both] motion-reduce:animate-none"
            />
          ))}
        </Stack>
      )}
    </StepShell>
  )

  const reviewStep = (
    <StepShell
      title={<Trans>Review New Stop Market Order</Trans>}
      dataTestId="stop-market-edit-review-modal"
      closeTestId="stop-market-edit-review-close"
      orderId={order.id}
      className="gap-5"
      onClose={onDismiss}
      actions={
        <>
          {/* Back to the fields with every change kept; discarding them is the edit step's own button. */}
          <ButtonOutlined className="flex-1" onClick={() => setStep('edit')} data-testid="stop-market-edit-review-back">
            <Trans>Cancel</Trans>
          </ButtonOutlined>
          {/* Also held by the fields' own checks: a balance can fall short while the review is on screen. */}
          <ButtonPrimary
            className="flex-1 transition-colors duration-200"
            data-testid="stop-market-edit-confirm"
            disabled={isReviewBlocked || disableAction}
            onClick={confirm}
          >
            <span className="font-medium">
              {createOrder.needsWrap ? <Trans>Wrap & Confirm</Trans> : <Trans>Confirm</Trans>}
            </span>
          </ButtonPrimary>
        </>
      }
    >
      <StopMarketReviewSummary {...review} />
    </StepShell>
  )

  return (
    <>
      <Modal
        isOpen={isOwnOrder && isOnOrderChain && !isProcessing}
        onDismiss={onDismiss}
        maxWidth={420}
        borderRadius={16}
      >
        {/* One dialog for both steps, easing between their heights rather than closing and reopening. */}
        <AnimatedHeight className="w-full">
          <div className="p-5 max-sm:p-4" data-step={step}>
            {step === 'edit' ? editStep : reviewStep}
          </div>
        </AnimatedHeight>
      </Modal>

      {processingModal}

      <DateTimePicker
        returnPresetValue
        defaultOptions={expiryPresets}
        defaultDate={expiry.customDate}
        // Anything but a preset is read as a timestamp, which opens the picker on the order's own deadline.
        expire={expiry.expire ?? order.deadline * 1000}
        isOpen={showDatePicker}
        onDismiss={() => setShowDatePicker(false)}
        onSetDate={value => setExpiry(value instanceof Date ? { customDate: value } : { expire: value })}
      />
    </>
  )
}

export default StopMarketEditModal

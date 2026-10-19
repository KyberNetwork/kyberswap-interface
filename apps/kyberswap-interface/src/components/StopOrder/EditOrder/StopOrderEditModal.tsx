import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import DateTimePicker from 'components/DateTimePicker'
import { ErrorWarning } from 'components/ErrorWarning'
import LimitOrderExpirySection from 'components/LimitOrder/Form/LimitOrderExpirySection'
import { calcOutput } from 'components/LimitOrder/utils'
import Modal from 'components/Modal'
import NumericalInput from 'components/NumericalInput'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { StopOrderChange, StopOrderReview } from 'components/StopOrder/CreateOrder/StopOrderConfirmModal'
import { useStopOrderProcessing } from 'components/StopOrder/CreateOrder/StopOrderFlow'
import { useCreateStopOrder } from 'components/StopOrder/CreateOrder/useCreateStopOrder'
import { useStopOrderWarnings } from 'components/StopOrder/Form/useStopOrderWarnings'
import { triggerProximityText } from 'components/StopOrder/MyOrders/components'
import { getStopOrderExpiryPresets } from 'components/StopOrder/constants'
import { useStopOrderCurrency } from 'components/StopOrder/hooks/useStopOrderCurrency'
import { useStopOrderOraclePrice } from 'components/StopOrder/hooks/useStopOrderOraclePrice'
import { useStopOrderSlippageOptions } from 'components/StopOrder/hooks/useStopOrderSlippageOptions'
import { useStopOrderTracking } from 'components/StopOrder/hooks/useStopOrderTracking'
import { StopOrder } from 'components/StopOrder/types'
import {
  MAX_STOP_ORDER_DEADLINE,
  clampStopOrderDeadline,
  formatDistanceMagnitude,
  getStopOrderTriggerPrice,
  getTriggerProximity,
} from 'components/StopOrder/utils'
import SlippageSetting from 'components/SwapForm/SlippageSetting'
import { useActiveWeb3React } from 'hooks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { tryParseAmount } from 'state/swap/hooks'
import { CloseIcon } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { SLIPPAGE_STATUS, formatSlippage } from 'utils/slippage'
import { formatTimeDuration } from 'utils/time'

/** Neither set, the order keeps the deadline it was signed with. */
type EditExpiry = { expire?: number; customDate?: Date }

/**
 * The edit and its review share one dialog, the review pushed in over the edit as a step; signing runs
 * in the processing modal, as it does for a new order.
 */
type Phase = 'edit' | 'review' | 'processing'

/**
 * The surfaces of the creation review, which this dialog shares: fields sit on a fill one step off the
 * dialog's own, with no outline.
 */
const FIELD_CLASS = 'rounded-xl bg-buttonGray p-3'

/**
 * The settings row's headers carry their own padding, so marking one as changed does not move it. A
 * struck-through value that does not fit beside its setting goes under it rather than past the edge.
 */
const SETTING_HEADER_CLASS =
  'min-w-0 max-w-full flex-wrap justify-self-start gap-y-0.5 whitespace-nowrap rounded-lg px-2 py-1 transition-colors'
const CHANGED_SETTING_CLASS = 'bg-buttonGray'

/** Matches the wrapper's transition below. */
const HEIGHT_EASE_MS = 200

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const formatDeadline = (deadlineInSeconds: number) => dayjs.unix(deadlineInSeconds).format('DD/MM/YYYY HH:mm')

/** The value a field had before the edit, struck through beside the new one. */
const PreviousValue = ({ children, dataTestId }: { children: ReactNode; dataTestId: string }) => (
  <span className="truncate text-xs font-medium text-subText line-through" data-testid={dataTestId}>
    {children}
  </span>
)

/**
 * Eases the dialog between the heights of its views instead of snapping it. Inside a view the height is
 * the content's own, so the edit's settings panels still open at their own pace — unless `easeContent`
 * is set, for a view such as the review whose notes land once the fee estimate does.
 */
const EasedHeight = ({ view, easeContent, children }: { view: Phase; easeContent: boolean; children: ReactNode }) => {
  const contentRef = useRef<HTMLDivElement>(null)
  // The content's height at the last measure, which is where the next change eases from.
  const lastHeight = useRef<number | undefined>(undefined)
  const previousView = useRef(view)
  const easeContentRef = useRef(easeContent)
  const [height, setHeight] = useState<number>()

  useEffect(() => {
    easeContentRef.current = easeContent
  }, [easeContent])

  useLayoutEffect(() => {
    const node = contentRef.current
    if (!node) return
    lastHeight.current = node.offsetHeight
    if (typeof ResizeObserver !== 'function') return
    const observer = new ResizeObserver(() => {
      lastHeight.current = node.offsetHeight
      if (easeContentRef.current) setHeight(node.offsetHeight)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // Pinned to the old height before paint, then let go to the new one a frame later so the change eases.
  useLayoutEffect(() => {
    if (previousView.current === view) return
    previousView.current = view
    const node = contentRef.current
    const from = lastHeight.current
    if (!node || from === undefined || prefersReducedMotion()) return
    setHeight(from)
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setHeight(node.offsetHeight))
    })
    const release = easeContent ? undefined : window.setTimeout(() => setHeight(undefined), HEIGHT_EASE_MS + 50)
    return () => {
      cancelAnimationFrame(frame)
      if (release) window.clearTimeout(release)
    }
  }, [view, easeContent])

  return (
    <div
      className={cn(
        'w-full',
        // `duration-*` would also set the animations' length under tailwindcss-animate, hence the plain property.
        height !== undefined &&
          'overflow-hidden transition-[height] ease-out [transition-duration:200ms] motion-reduce:transition-none',
      )}
      style={height !== undefined ? { height } : undefined}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  )
}

type Props = {
  order: StopOrder
  onDismiss: () => void
}

/**
 * Edits an open order from the list. The pair and the receiver are part of what the order is, so only
 * the amount, trigger, slippage and expiry can change; the result is signed as a replacement of the
 * order, which the service swaps in atomically. The edit stands only for the wallet and chain that own
 * the order — the replacement is signed by that wallet, on that chain.
 */
const StopOrderEditModal = ({ order, onDismiss }: Props) => {
  const { account, chainId } = useActiveWeb3React()
  const tracking = useStopOrderTracking()
  const sellCurrency = useStopOrderCurrency(order.tokenInInfo, order.chainId)
  const receiveCurrency = useStopOrderCurrency(order.tokenOutInfo, order.chainId)
  const sellSymbol = sellCurrency.symbol ?? ''
  const receiveSymbol = receiveCurrency.symbol ?? ''

  const originalAmount = useMemo(
    () => CurrencyAmount.fromRawAmount(sellCurrency, order.amountIn).toExact(),
    [sellCurrency, order.amountIn],
  )
  const originalTrigger = getStopOrderTriggerPrice(order)

  const [inputAmount, setInputAmount] = useState(originalAmount)
  const [triggerPrice, setTriggerPrice] = useState(originalTrigger)
  const [slippage, setSlippage] = useState(order.slippage)
  const [expiry, setExpiry] = useState<EditExpiry>({})
  const [expiryExpanded, setExpiryExpanded] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [phase, setPhase] = useState<Phase>('edit')
  // Set while the review slides back out; the edit returns once it is gone.
  const [isLeavingReview, setIsLeavingReview] = useState(false)

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
  const { defaultSlippage, slippagePresets, getSlippageStatus } = useStopOrderSlippageOptions(order.chainId, pair)
  const slippageStatus = getSlippageStatus(slippage)

  const { priceNumber: marketPrice, isLoading: loadingMarketPrice } = useStopOrderOraclePrice(
    sellCurrency,
    receiveCurrency,
    order.chainId,
  )
  const trigger = Number(triggerPrice)
  const hasTrigger = trigger > 0 && Number.isFinite(trigger)
  const triggerPercent = marketPrice && hasTrigger ? ((trigger - marketPrice) / marketPrice) * 100 : undefined
  // The order fires once the oracle is at or under the trigger.
  const isTriggerReached = !!marketPrice && hasTrigger && marketPrice <= trigger

  const parsedAmount = useMemo(() => tryParseAmount(inputAmount, sellCurrency), [inputAmount, sellCurrency])
  const estimatedOutput = useMemo(
    () => (inputAmount && hasTrigger ? calcOutput(inputAmount, triggerPrice, receiveCurrency.decimals) : ''),
    [inputAmount, hasTrigger, triggerPrice, receiveCurrency.decimals],
  )

  const isAmountChanged = parsedAmount?.quotient.toString() !== order.amountIn
  const isTriggerChanged = trigger !== Number(originalTrigger)
  const isSlippageChanged = slippage !== order.slippage
  const isExpiryChanged = expiry.expire !== undefined || expiry.customDate !== undefined
  const hasChanges = isAmountChanged || isTriggerChanged || isSlippageChanged || isExpiryChanged

  // As on the creation form, a preset counts from the moment the edit goes to review.
  const [expiryStart, setExpiryStart] = useState(Date.now)
  const resolveExpiredAt = (start: number) =>
    expiry.customDate?.getTime() ?? (expiry.expire !== undefined ? start + expiry.expire * 1000 : order.deadline * 1000)
  const expiredAt = resolveExpiredAt(expiryStart)

  const validation = useStopOrderWarnings({
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

  const createOrder = useCreateStopOrder({
    currencyIn: sellCurrency,
    currencyOut: receiveCurrency,
    inputAmount,
    triggerPrice,
    slippage,
    expiredAt,
    replacing: order,
  })

  const { start, processingModal } = useStopOrderProcessing({
    isReviewOpen: phase === 'review',
    currencyIn: sellCurrency,
    currencyOut: receiveCurrency,
    isEdit: true,
    createOrder,
    onStart: () => setPhase('processing'),
    // A finished run ends the edit; a failed one goes back to it, values intact.
    onClose: completed => (completed ? onDismiss() : setPhase('edit')),
  })

  // Stable per locale, for the reason the creation form gives.
  const locale = useActiveLocale()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const expiryPresets = useMemo(() => getStopOrderExpiryPresets(), [locale])
  const isForever = order.deadline >= MAX_STOP_ORDER_DEADLINE
  // The edit reads the deadline as the time left, which fits beside the label; the review names the date.
  const originalExpiryLabel = isForever ? t`Forever` : formatTimeDuration(order.deadline - Date.now() / 1000)
  const originalDeadlineLabel = isForever ? t`Forever` : formatDeadline(order.deadline)
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
    <Trans>Confirm</Trans>
  ) : isMissingAmount ? (
    <Trans>Enter an amount</Trans>
  ) : !hasTrigger ? (
    <Trans>Set a trigger price</Trans>
  ) : createOrder.insufficientBalance ? (
    <Trans>Insufficient {sellSymbol} funds</Trans>
  ) : (
    <Trans>Confirm</Trans>
  )

  const changes: StopOrderChange[] = [
    ...(isAmountChanged
      ? [
          {
            key: 'amount' as const,
            label: <Trans>You Sell</Trans>,
            before: `${formatDisplayNumber(originalAmount, { significantDigits: 6 })} ${sellSymbol}`,
            after: `${formatDisplayNumber(inputAmount, { significantDigits: 6 })} ${sellSymbol}`,
          },
        ]
      : []),
    ...(isTriggerChanged
      ? [
          {
            key: 'trigger' as const,
            label: <Trans>Trigger Price</Trans>,
            before: `${formatDisplayNumber(originalTrigger, { significantDigits: 6 })} ${receiveSymbol}`,
            after: `${formatDisplayNumber(triggerPrice, { significantDigits: 6 })} ${receiveSymbol}`,
          },
        ]
      : []),
    ...(isSlippageChanged
      ? [
          {
            key: 'slippage' as const,
            label: <Trans>Max Slippage</Trans>,
            before: formatSlippage(order.slippage),
            after: formatSlippage(slippage),
          },
        ]
      : []),
    ...(isExpiryChanged
      ? [
          {
            key: 'expiry' as const,
            label: <Trans>Expires</Trans>,
            before: originalDeadlineLabel,
            // The deadline that gets signed, as the creation review shows it.
            after: formatDeadline(clampStopOrderDeadline(expiredAt / 1000)),
          },
        ]
      : []),
  ]

  const openReview = () => {
    const now = Date.now()
    setExpiryStart(now)
    tracking.trackReviewOpened({
      currencyIn: sellCurrency,
      currencyOut: receiveCurrency,
      chainId: order.chainId,
      inputAmount,
      triggerPrice,
      triggerPercent,
      slippage,
      expiredAt: resolveExpiredAt(now),
      replacesOrderId: order.id,
    })
    setPhase('review')
  }

  // The review slides back out before the edit returns; without motion there is nothing to wait for.
  const backToEdit = () => {
    if (prefersReducedMotion()) setPhase('edit')
    else setIsLeavingReview(true)
  }

  const editView = (
    <Stack className="w-full gap-6 p-5 max-sm:p-4" data-testid="stop-order-edit-modal" data-order-id={order.id}>
      <HStack className="items-center justify-between gap-4">
        <span className="text-xl font-medium leading-tight text-text">
          <Trans>Edit Stop Order</Trans>
        </span>
        <HStack className="min-w-0 items-center gap-3">
          <span className="truncate text-sm text-subText" data-testid="stop-order-edit-pair">
            {sellSymbol} → {receiveSymbol}
          </span>
          <CloseIcon onClick={onDismiss} data-testid="stop-order-edit-close" />
        </HStack>
      </HStack>

      <Stack className="gap-4">
        <Stack className={cn(FIELD_CLASS, 'gap-2')}>
          <HStack className="min-h-5 items-center justify-between gap-2">
            <span className="text-sm text-subText">
              <Trans>You sell</Trans>
            </span>
            {isAmountChanged && (
              <PreviousValue dataTestId="stop-order-edit-amount-before">
                {formatDisplayNumber(originalAmount, { significantDigits: 6 })} {sellSymbol}
              </PreviousValue>
            )}
          </HStack>
          <HStack className="min-w-0 items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center">
              <NumericalInput
                maxLength={50}
                className="bg-transparent text-xl font-medium text-text"
                data-testid="stop-order-edit-amount"
                value={inputAmount}
                onUserInput={setInputAmount}
              />
            </div>
            {/* The pair is fixed for an edit, so the token is shown rather than offered — as the creation
                form's token chip, one step lighter than the field it sits in. */}
            <HStack className="shrink-0 items-center gap-1.5 rounded-full bg-tableHeader py-1 pl-1 pr-2.5 text-base font-medium text-subText">
              <CurrencyLogo currency={sellCurrency} size="20px" />
              {sellSymbol}
            </HStack>
          </HStack>
        </Stack>

        <Stack className={cn(FIELD_CLASS, 'gap-2')}>
          <HStack className="min-h-5 items-center justify-between gap-2">
            <span className="text-sm text-subText">
              <Trans>Trigger a swap when price reaches</Trans>
            </span>
            {isTriggerChanged && (
              <PreviousValue dataTestId="stop-order-edit-trigger-before">
                {formatDisplayNumber(originalTrigger, { significantDigits: 6 })}
              </PreviousValue>
            )}
          </HStack>
          <HStack className="min-w-0 items-baseline gap-1.5">
            {/* The creation form's rate colour, so the trigger reads the same in both. */}
            <NumericalInput
              maxLength={50}
              className="w-auto min-w-[2ch] max-w-full flex-none bg-transparent text-xl font-medium text-primary"
              // Sized to its value, so the unit reads on from the number as one phrase.
              style={{ width: `${Math.max(triggerPrice.length, 1)}ch` }}
              data-testid="stop-order-edit-trigger"
              value={triggerPrice}
              onUserInput={setTriggerPrice}
            />
            <span className="min-w-0 truncate text-base font-medium text-subText">
              {receiveSymbol} <Trans>per</Trans> {sellSymbol}
            </span>
          </HStack>
          {marketPrice ? (
            <HStack className="flex-wrap items-center gap-x-1.5 text-xs font-medium text-subText">
              <span data-testid="stop-order-edit-oracle-price">
                <Trans>Current oracle price</Trans>: {formatDisplayNumber(marketPrice, { significantDigits: 6 })}{' '}
                {receiveSymbol}
              </span>
              {isTriggerReached ? (
                <span className="flex items-center gap-1" data-testid="stop-order-edit-trigger-reached">
                  · <span className="size-2 rounded-full border border-current" />
                  <Trans>trigger reached</Trans>
                </span>
              ) : triggerPercent !== undefined ? (
                // Not reached means the trigger still sits below the oracle.
                <span
                  className={triggerProximityText({ proximity: getTriggerProximity(triggerPercent) })}
                  data-testid="stop-order-edit-trigger-distance"
                >
                  · ↓ {formatDistanceMagnitude(triggerPercent)}% <Trans>below</Trans>
                </span>
              ) : null}
            </HStack>
          ) : loadingMarketPrice ? (
            // Boxed at the text-xs line the oracle price takes, so it lands without moving the field.
            <span className="flex h-4 items-center" data-testid="stop-order-edit-oracle-price-loading">
              <Skeleton height={10} width={220} borderRadius={6} />
            </span>
          ) : null}
        </Stack>

        {/* Laid out as on the creation form: two headers in a row, either panel spanning it. */}
        <div className="grid grid-cols-2 items-start gap-x-2 max-xxs:grid-cols-1">
          <SlippageSetting
            alwaysVisible
            tooltip={t`The most your fill may fall below the oracle price when the order executes, after fees. Too tight and the order may not fill at all.`}
            gridCells={{
              header: cn('col-start-1 row-start-1', SETTING_HEADER_CLASS, isSlippageChanged && CHANGED_SETTING_CLASS),
              panel: 'col-span-full row-start-2',
            }}
            slippage={{ value: slippage, onChange: setSlippage }}
            slippageInfo={{
              default: defaultSlippage,
              presets: slippagePresets,
              isLow: slippageStatus === SLIPPAGE_STATUS.LOW,
              isHigh: slippageStatus === SLIPPAGE_STATUS.HIGH,
              message:
                slippageStatus === SLIPPAGE_STATUS.LOW
                  ? t`Slippage this low may cause your stop order to fail during volatile markets — the conditions it exists for.`
                  : slippageStatus === SLIPPAGE_STATUS.HIGH
                  ? t`Slippage this high means your order could fill meaningfully below the market price at the moment it executes.`
                  : '',
            }}
            rightComponent={
              isSlippageChanged && (
                <PreviousValue dataTestId="stop-order-edit-slippage-before">
                  {formatSlippage(order.slippage)}
                </PreviousValue>
              )
            }
          />

          <LimitOrderExpirySection
            gridCells={{
              header: cn(
                'col-start-2 row-start-1 max-xxs:col-start-1 max-xxs:row-start-3 max-xxs:mt-2',
                SETTING_HEADER_CLASS,
                isExpiryChanged && CHANGED_SETTING_CLASS,
              ),
              panel: 'col-span-full row-start-3 max-xxs:row-start-4',
            }}
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
              isExpiryChanged && (
                <PreviousValue dataTestId="stop-order-edit-expiry-before">{originalExpiryLabel}</PreviousValue>
              )
            }
          />
        </div>

        {/* The creation review's note. */}
        <div
          className="rounded-xl border border-primary-20 bg-primary-10 px-3 py-2 text-sm text-primary"
          data-testid="stop-order-edit-note"
        >
          <Trans>Updating requires a new signature. No gas.</Trans>
        </div>

        {warnings.length > 0 && (
          <Stack className="gap-3" data-testid="stop-order-warnings">
            {warnings.map((warning, index) => (
              <ErrorWarning
                type={warning.type}
                key={index}
                title={warning.message}
                dataTestId="stop-order-warning"
                className="animate-[fadeIn_0.2s_ease-out_both] motion-reduce:animate-none"
              />
            ))}
          </Stack>
        )}

        <Stack className="gap-2">
          {/* Eases between enabled and disabled, which flips as the fields are typed in and the price loads. */}
          <ButtonPrimary
            className="transition-colors duration-200"
            data-testid="stop-order-edit-confirm"
            disabled={disableAction}
            onClick={openReview}
          >
            <span className="font-medium">{actionLabel}</span>
          </ButtonPrimary>
          <button
            type="button"
            className="mx-auto cursor-pointer border-0 bg-transparent p-0 text-xs font-medium text-subText underline hover:text-text"
            data-testid="stop-order-edit-discard"
            onClick={onDismiss}
          >
            <Trans>Discard changes</Trans>
          </button>
        </Stack>
      </Stack>
    </Stack>
  )

  return (
    <>
      <Modal
        isOpen={isOwnOrder && isOnOrderChain && phase !== 'processing'}
        onDismiss={onDismiss}
        maxWidth={480}
        borderRadius={16}
      >
        <EasedHeight view={phase} easeContent={phase === 'review'}>
          {/* Kept mounted behind the review, so its settings panels come back as they were left. Showing
              it again replays the fade. */}
          <div
            className={cn(
              phase === 'edit' ? 'block' : 'hidden',
              'animate-[fadeIn_0.15s_ease-out_both] motion-reduce:animate-none',
            )}
          >
            {editView}
          </div>
          {phase === 'review' && (
            <div
              className={cn(
                'w-full motion-reduce:animate-none',
                isLeavingReview ? 'animate-slideOutRight' : 'animate-slideInRight',
              )}
              onAnimationEnd={event => {
                // Only the wrapper's own slide-out, not an animation bubbling up from inside the review.
                if (event.target !== event.currentTarget || !isLeavingReview) return
                setIsLeavingReview(false)
                setPhase('edit')
              }}
            >
              <StopOrderReview
                currencyIn={sellCurrency}
                currencyOut={receiveCurrency}
                inputAmount={inputAmount}
                estimatedOutput={estimatedOutput}
                triggerPrice={triggerPrice}
                triggerPercent={triggerPercent}
                slippage={slippage}
                expiredAt={expiredAt}
                fee={createOrder.fee}
                feeError={createOrder.feeError}
                isFeeLoading={createOrder.isEstimatingFee}
                onRetryFee={createOrder.refreshFee}
                needsWrap={createOrder.needsWrap}
                warnings={validation.reviewWarnings}
                changes={changes}
                onBack={backToEdit}
                onDismiss={onDismiss}
                onSubmit={start}
              />
            </div>
          )}
        </EasedHeight>
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

export default StopOrderEditModal

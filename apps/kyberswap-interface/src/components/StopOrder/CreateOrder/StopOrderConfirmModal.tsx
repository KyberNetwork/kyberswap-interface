import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, Info } from 'react-feather'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import Skeleton from 'components/Skeleton'
import { Center, HStack, Stack } from 'components/Stack'
import { StopOrderWarning } from 'components/StopOrder/Form/useStopOrderWarnings'
import { triggerProximityText } from 'components/StopOrder/MyOrders/components'
import { StopOrderFee } from 'components/StopOrder/types'
import { clampStopOrderDeadline, formatDistanceMagnitude, getTriggerProximity } from 'components/StopOrder/utils'
import { CloseIcon } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { formatSlippage } from 'utils/slippage'

type ReviewProps = {
  currencyIn?: Currency
  currencyOut?: Currency
  inputAmount: string
  estimatedOutput: string
  estimatedUsdIn?: string
  estimatedUsdOut?: string
  triggerPrice: string
  triggerPercent?: number
  slippage: number
  expiredAt: number
  fee?: StopOrderFee
  /** Why the fee could not be estimated. The order cannot be signed without one. */
  feeError?: string
  /** The fee is being re-estimated for this review; any figure held is from an earlier one. */
  isFeeLoading?: boolean
  onRetryFee?: () => void
  needsWrap?: boolean
  warnings?: StopOrderWarning[]
  /**
   * Set when the review is for an edit: only these rows are shown, each as its old value against the
   * new one, in place of the full order summary.
   */
  changes?: StopOrderChange[]
  onDismiss?: () => void
  /** Set when the review is a step after another view: a back arrow by the title stands in for the close. */
  onBack?: () => void
  onSubmit?: () => void
}

type Props = ReviewProps & { isOpen: boolean }

/** One edited field of an open order, as the review of the edit shows it. */
export type StopOrderChange = {
  key: 'amount' | 'trigger' | 'slippage' | 'expiry'
  label: ReactNode
  before: ReactNode
  after: ReactNode
}

const SummaryRow = ({ label, dataTestId, children }: { label: ReactNode; dataTestId: string; children: ReactNode }) => (
  <HStack className="items-start justify-between gap-4 text-sm">
    <span className="shrink-0 text-subText">{label}</span>
    <div className="text-right text-text" data-testid={dataTestId}>
      {children}
    </div>
  </HStack>
)

/** The highest tier rate; a fee above it is the flat minimum taking a large share of a small order. */
const HIGH_FEE_SHARE_PERCENT = 1

// `error` is the zap flows' error note — red text on a 20% red ground — in the review's own shape.
const NOTE_STYLES = {
  info: { className: 'bg-primary-10 text-primary', Icon: Info },
  warn: { className: 'bg-warning-10 text-warning', Icon: AlertTriangle },
  error: { className: 'bg-red-20 text-red', Icon: AlertTriangle },
} as const

const ReviewNote = ({
  type,
  dataTestId,
  children,
}: {
  type: keyof typeof NOTE_STYLES
  dataTestId: string
  children: ReactNode
}) => {
  const { className, Icon } = NOTE_STYLES[type]
  return (
    <HStack
      className={cn(
        // Fades in, since a note that depends on the fee lands once the estimate does.
        'w-full animate-[fadeIn_0.2s_ease-out_both] items-start gap-2.5 rounded-xl px-3 py-2 text-sm motion-reduce:animate-none',
        className,
      )}
      data-testid={dataTestId}
      data-warning-type={type}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1">{children}</div>
    </HStack>
  )
}

/** The review itself, for a caller that hosts it in a dialog of its own. */
export const StopOrderReview = ({
  currencyIn,
  currencyOut,
  inputAmount,
  estimatedOutput,
  estimatedUsdIn,
  estimatedUsdOut,
  triggerPrice,
  triggerPercent,
  slippage,
  expiredAt,
  fee,
  feeError,
  isFeeLoading,
  onRetryFee,
  needsWrap,
  warnings = [],
  changes,
  onDismiss,
  onBack,
  onSubmit,
}: ReviewProps) => {
  const isEdit = changes !== undefined
  const feePercentage = fee?.protocol?.percentage
  // Taken from what the order receives, so it is in the receive token and, like that amount, an estimate
  // at the trigger price.
  const feeAmount =
    feePercentage !== undefined && Number(estimatedOutput) > 0
      ? (Number(estimatedOutput) * feePercentage) / 100
      : undefined
  // The order stays reviewable so the warning can be read; only signing it is refused. The fee sets the
  // cap signed into the order, so there is nothing to sign until it is known.
  const isBlocked = warnings.some(warning => warning.blocking) || isFeeLoading || !fee
  const showFeeError = !!feeError && !isFeeLoading
  // Neither a fee nor a reason yet means the estimate is still on its way, from the moment the review opens.
  const isFeePending = isFeeLoading || (!fee && !feeError)
  /**
   * The minimum fee is flat, so on a small order it takes a large share. Pointed out once it passes 1% —
   * the highest tier rate — which only the minimum can push it past. Only a warning: the size is the
   * user's call.
   */
  const highFeeShare =
    !isFeeLoading && feePercentage !== undefined && feePercentage > HIGH_FEE_SHARE_PERCENT
      ? formatDisplayNumber(feePercentage, { fractionDigits: 2 })
      : undefined

  return (
    <Stack className="w-full gap-6 p-5 max-sm:p-4" data-testid="stop-order-confirm-modal">
      <HStack className="items-center justify-between gap-4">
        <HStack className="min-w-0 items-center gap-2">
          {onBack && (
            <button
              type="button"
              aria-label={t`Back`}
              onClick={onBack}
              data-testid="stop-order-confirm-back"
              className="-ml-1 flex shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-1 text-subText transition-colors hover:bg-white/10 hover:text-text"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="text-xl font-medium leading-tight text-text">
            {isEdit ? <Trans>Review Changes</Trans> : <Trans>Review Stop Order</Trans>}
          </div>
        </HStack>
        {!onBack && <CloseIcon onClick={onDismiss} data-testid="stop-order-confirm-close" />}
      </HStack>

      <Stack className="gap-4">
        {!isEdit && (
          <HStack className="items-center justify-between gap-3 rounded-xl bg-[#272727] p-3">
            <Stack className="min-w-0 gap-2">
              <span className="text-sm text-subText">
                <Trans>You Sell</Trans>
              </span>
              <span className="truncate text-xl font-medium text-text" data-testid="stop-order-confirm-sell-amount">
                {formatDisplayNumber(inputAmount, { significantDigits: 6 })} {currencyIn?.symbol}
              </span>
              {estimatedUsdIn && (
                <span className="text-sm text-subText" data-testid="stop-order-confirm-sell-usd">
                  ~{estimatedUsdIn}
                </span>
              )}
            </Stack>

            <Center className="size-6 shrink-0 rounded-full bg-primary-10">
              <ArrowRight size={16} className="text-primary" />
            </Center>

            <Stack className="min-w-0 items-end gap-2">
              <span className="text-sm text-subText">
                <Trans>Est. Receive</Trans>
              </span>
              <span className="truncate text-xl font-medium text-text" data-testid="stop-order-confirm-receive-amount">
                ~{formatDisplayNumber(estimatedOutput, { significantDigits: 6 })} {currencyOut?.symbol}
              </span>
              {estimatedUsdOut && (
                <span className="text-sm text-subText" data-testid="stop-order-confirm-receive-usd">
                  ~{estimatedUsdOut}
                </span>
              )}
            </Stack>
          </HStack>
        )}

        <Stack className="gap-3">
          {changes?.map(change => (
            <SummaryRow key={change.key} label={change.label} dataTestId={`stop-order-confirm-change-${change.key}`}>
              <HStack className="flex-wrap items-center justify-end gap-x-1.5">
                <span className="text-subText line-through" data-testid="stop-order-confirm-change-before">
                  {change.before}
                </span>
                <ArrowRight size={14} className="shrink-0 text-subText" />
                <span data-testid="stop-order-confirm-change-after">{change.after}</span>
              </HStack>
            </SummaryRow>
          ))}

          {!isEdit && (
            <SummaryRow label={<Trans>Trigger Price</Trans>} dataTestId="stop-order-confirm-trigger-price">
              <div>
                1 {currencyIn?.symbol} = {triggerPrice} {currencyOut?.symbol}
              </div>
              {triggerPercent !== undefined && triggerPercent !== 0 && (
                <div data-testid="stop-order-confirm-trigger-distance">
                  <span className={triggerProximityText({ proximity: getTriggerProximity(triggerPercent) })}>
                    {triggerPercent < 0 ? '↓' : '↑'} {formatDistanceMagnitude(triggerPercent)}%
                  </span>{' '}
                  <span className="text-subText">
                    {triggerPercent < 0 ? (
                      <Trans>below current oracle price</Trans>
                    ) : (
                      <Trans>above current oracle price</Trans>
                    )}
                  </span>
                </div>
              )}
            </SummaryRow>
          )}

          {!isEdit && (
            <SummaryRow label={<Trans>Max Slippage</Trans>} dataTestId="stop-order-confirm-slippage">
              {formatSlippage(slippage)}
            </SummaryRow>
          )}

          <SummaryRow label={<Trans>Fee (incl. gas)</Trans>} dataTestId="stop-order-confirm-fee">
            {isFeePending ? (
              <span className="flex h-5 items-center justify-end" data-testid="stop-order-confirm-fee-loading">
                <Skeleton height={12} width={96} borderRadius={6} />
              </span>
            ) : (
              // An amount, not a rate: once the minimum applies the rate no longer matches the published tier.
              <span className={cn(showFeeError && 'text-red')}>
                {showFeeError ? (
                  <Trans>Unavailable</Trans>
                ) : feeAmount === undefined ? (
                  '--'
                ) : (
                  `~${formatDisplayNumber(feeAmount, { significantDigits: 6 })} ${currencyOut?.symbol ?? ''}`
                )}
              </span>
            )}
          </SummaryRow>

          {/* Show the deadline that actually gets signed, not the pre-clamp value an
              "expires never" choice produces. */}
          {!isEdit && (
            <SummaryRow label={<Trans>Expires</Trans>} dataTestId="stop-order-confirm-expiry">
              {dayjs.unix(clampStopOrderDeadline(expiredAt / 1000)).format('DD/MM/YYYY HH:mm')}
            </SummaryRow>
          )}
        </Stack>

        <div
          className="rounded-xl border border-primary-20 bg-primary-10 px-3 py-2 text-sm text-primary"
          data-testid="stop-order-confirm-execution-note"
        >
          {/* The replacement is signed like the original — an off-chain signature, no transaction. */}
          {isEdit ? (
            <Trans>Updating requires a new signature. No gas.</Trans>
          ) : (
            <Trans>
              When triggered, KyberSwap will swap your {currencyIn?.symbol} at the best available market price.
            </Trans>
          )}
        </div>

        {warnings.map((warning, index) => (
          <ReviewNote key={index} type={warning.type} dataTestId="stop-order-confirm-warning">
            {warning.message}
          </ReviewNote>
        ))}

        {highFeeShare !== undefined && (
          <ReviewNote type="warn" dataTestId="stop-order-confirm-min-fee-warning">
            <Trans>
              At this size the fee is {highFeeShare}% of your order. Execution costs the same regardless of order size.
            </Trans>
          </ReviewNote>
        )}

        {showFeeError && (
          <ReviewNote type="error" dataTestId="stop-order-confirm-fee-error">
            {feeError}
            {onRetryFee && (
              <>
                {' '}
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent p-0 font-medium text-red underline hover:brightness-110"
                  onClick={onRetryFee}
                  data-testid="stop-order-confirm-fee-retry"
                >
                  <Trans>Try again</Trans>
                </button>
              </>
            )}
          </ReviewNote>
        )}

        <Stack className="gap-2">
          {/* Eases into enabled once the fee lands, rather than snapping. */}
          <ButtonPrimary
            className="transition-colors duration-200"
            onClick={onSubmit}
            disabled={isBlocked}
            data-testid="stop-order-confirm-submit"
          >
            {isEdit ? (
              <Trans>Confirm Update</Trans>
            ) : needsWrap ? (
              <Trans>Wrap & Confirm Stop Order</Trans>
            ) : (
              <Trans>Confirm Stop Order</Trans>
            )}
          </ButtonPrimary>
          <span className="text-center text-xs font-medium italic text-subText">
            <Trans>Free to place and cancel · Fee on execution</Trans>
          </span>
        </Stack>
      </Stack>
    </Stack>
  )
}

const StopOrderConfirmModal = ({ isOpen, onDismiss, ...review }: Props) => (
  <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth={480} borderRadius={16}>
    <StopOrderReview {...review} onDismiss={onDismiss} />
  </Modal>
)

export default StopOrderConfirmModal

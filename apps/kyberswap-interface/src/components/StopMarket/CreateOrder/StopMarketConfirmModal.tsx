import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode } from 'react'
import { AlertTriangle, Info } from 'react-feather'

import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import InfoHelper from 'components/InfoHelper'
import Modal from 'components/Modal'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { StopMarketWarning } from 'components/StopMarket/Form/useStopMarketWarnings'
import { TriggerDistance } from 'components/StopMarket/TriggerDistance'
import { StopMarketFee } from 'components/StopMarket/types'
import { clampStopMarketDeadline, getStopMarketMinReceive, getTriggerDirection } from 'components/StopMarket/utils'
import { CloseIcon } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { formatSlippage } from 'utils/slippage'

/** The terms of an order as they are reviewed before signing, new or as a replacement of an open one. */
export type StopMarketReviewProps = {
  currencyIn?: Currency
  currencyOut?: Currency
  inputAmount: string
  estimatedOutput: string
  estimatedUsdIn?: string
  triggerPrice: string
  triggerPercent?: number
  slippage: number
  expiredAt: number
  fee?: StopMarketFee
  /** Why the fee could not be estimated. The order cannot be signed without one. */
  feeError?: string
  /** The fee is being re-estimated for this review; any figure held is from an earlier one. */
  isFeeLoading?: boolean
  onRetryFee?: () => void
  warnings?: StopMarketWarning[]
}

type Props = StopMarketReviewProps & {
  isOpen: boolean
  needsWrap?: boolean
  onDismiss?: () => void
  onSubmit?: () => void
}

const SummaryRow = ({
  label,
  tooltip,
  dataTestId,
  children,
}: {
  label: ReactNode
  tooltip?: string
  dataTestId: string
  children: ReactNode
}) => (
  <HStack className="items-start justify-between gap-4 text-sm">
    <HStack className="shrink-0 items-center gap-1 text-subText">
      {label}
      {tooltip && <InfoHelper text={tooltip} size={14} placement="top" margin={false} />}
    </HStack>
    <div className="min-w-0 text-right text-text" data-testid={dataTestId}>
      {children}
    </div>
  </HStack>
)

/** Holds a row's place while the fee it depends on is estimated. */
const RowSkeleton = ({ dataTestId }: { dataTestId: string }) => (
  <span className="flex h-5 items-center justify-end" data-testid={dataTestId}>
    <Skeleton height={12} width={96} borderRadius={6} />
  </span>
)

const Divider = () => <div className="h-px w-full bg-white-08" />

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

/**
 * Whether the reviewed order can be signed. The order stays reviewable so a warning can be read; only
 * signing it is refused. The fee sets the cap signed into the order, so there is nothing to sign until it
 * is known.
 */
export const isStopMarketReviewBlocked = ({
  warnings = [],
  isFeeLoading,
  fee,
}: Pick<StopMarketReviewProps, 'warnings' | 'isFeeLoading' | 'fee'>) =>
  warnings.some(warning => warning.blocking) || !!isFeeLoading || !fee

/**
 * The order as it will be signed, row by row: what it sells, where it triggers, what it costs and the
 * least it pays out. That floor is worked out here — the sell amount at the trigger, less the slippage
 * allowed, less the fee taken out of the amount out — since the service reports none.
 */
export const StopMarketReviewSummary = ({
  currencyIn,
  currencyOut,
  inputAmount,
  estimatedOutput,
  estimatedUsdIn,
  triggerPrice,
  triggerPercent,
  slippage,
  expiredAt,
  fee,
  feeError,
  isFeeLoading,
  onRetryFee,
  warnings = [],
}: StopMarketReviewProps) => {
  const feePercentage = fee?.protocol?.percentage
  // Taken from what the order receives, so it is in the receive token and, like that amount, an estimate
  // at the trigger price.
  const feeAmount =
    feePercentage !== undefined && Number(estimatedOutput) > 0
      ? (Number(estimatedOutput) * feePercentage) / 100
      : undefined
  // Unknown until the fee is: the floor before the fee would overstate what the order pays out.
  const minReceive =
    feeAmount === undefined
      ? undefined
      : getStopMarketMinReceive({ estimatedOutput: Number(estimatedOutput), slippage, fee: feeAmount })
  const showFeeError = !!feeError && !isFeeLoading
  // Neither a fee nor a reason yet means the estimate is still on its way, from the moment the review opens.
  const isFeePending = isFeeLoading || (!fee && !feeError)
  const receiveSymbol = currencyOut?.symbol ?? ''

  return (
    <>
      <Stack className="gap-3">
        <SummaryRow label={<Trans>You Sell</Trans>} dataTestId="stop-market-confirm-sell-amount">
          <span className="text-base font-medium">
            {formatDisplayNumber(inputAmount, { significantDigits: 6 })} {currencyIn?.symbol}
          </span>
          {estimatedUsdIn && (
            <span className="text-xs text-subText" data-testid="stop-market-confirm-sell-usd">
              {' '}
              ~{estimatedUsdIn}
            </span>
          )}
        </SummaryRow>

        <SummaryRow
          label={<Trans>Trigger Price</Trans>}
          tooltip={t`The order triggers once the oracle price is at or below this price.`}
          dataTestId="stop-market-confirm-trigger-price"
        >
          <div className="text-base font-medium">
            1 {currencyIn?.symbol} = {triggerPrice} {receiveSymbol}
          </div>
          {getTriggerDirection(triggerPercent) !== 'none' && (
            <div data-testid="stop-market-confirm-trigger-distance">
              <TriggerDistance percent={triggerPercent} muteWords className="text-sm" />
            </div>
          )}
        </SummaryRow>

        <Divider />

        <SummaryRow
          label={<Trans>Fee (incl. gas)</Trans>}
          tooltip={t`Covers the protocol fee plus the gas KyberSwap pays to execute on-chain.`}
          dataTestId="stop-market-confirm-fee"
        >
          {isFeePending ? (
            <RowSkeleton dataTestId="stop-market-confirm-fee-loading" />
          ) : (
            // An amount, not a rate: once the minimum applies the rate no longer matches the published tier.
            <span className={cn(showFeeError && 'text-red')}>
              {showFeeError ? (
                <Trans>Unavailable</Trans>
              ) : feeAmount === undefined ? (
                '--'
              ) : (
                `${formatDisplayNumber(feeAmount, { significantDigits: 6 })} ${receiveSymbol}`
              )}
            </span>
          )}
        </SummaryRow>

        <SummaryRow label={<Trans>Max Slippage</Trans>} dataTestId="stop-market-confirm-slippage">
          {formatSlippage(slippage)}
        </SummaryRow>

        <Divider />

        <SummaryRow label={<Trans>Min. Receive</Trans>} dataTestId="stop-market-confirm-min-receive">
          {isFeePending ? (
            <RowSkeleton dataTestId="stop-market-confirm-min-receive-loading" />
          ) : minReceive === undefined ? (
            '--'
          ) : (
            <HStack className="items-center justify-end gap-1 font-medium">
              ~{currencyOut && <CurrencyLogo currency={currencyOut} size="16px" />}
              {formatDisplayNumber(minReceive, { significantDigits: 6 })} {receiveSymbol}
            </HStack>
          )}
        </SummaryRow>

        {/* Show the deadline that actually gets signed, not the pre-clamp value an
            "expires never" choice produces. */}
        <SummaryRow label={<Trans>Expires</Trans>} dataTestId="stop-market-confirm-expiry">
          {dayjs.unix(clampStopMarketDeadline(expiredAt / 1000)).format('DD/MM/YYYY HH:mm')}
        </SummaryRow>
      </Stack>

      <HStack className="items-start gap-1.5 text-xs text-blue" data-testid="stop-market-confirm-execution-note">
        <Info size={14} className="mt-px shrink-0" />
        <span>
          <Trans>
            When the trigger price is reached, your order is submitted for execution at the current market price.
            Execution depends on market conditions.
          </Trans>
        </span>
      </HStack>

      {warnings.map((warning, index) => (
        <ReviewNote key={index} type={warning.type} dataTestId="stop-market-confirm-warning">
          {warning.message}
        </ReviewNote>
      ))}

      {showFeeError && (
        <ReviewNote type="error" dataTestId="stop-market-confirm-fee-error">
          {feeError}
          {onRetryFee && (
            <>
              {' '}
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent p-0 font-medium text-red underline hover:brightness-110"
                onClick={onRetryFee}
                data-testid="stop-market-confirm-fee-retry"
              >
                <Trans>Try again</Trans>
              </button>
            </>
          )}
        </ReviewNote>
      )}
    </>
  )
}

/** The review of a new order, in its own dialog over the form. */
const StopMarketConfirmModal = ({ isOpen, needsWrap, onDismiss, onSubmit, ...review }: Props) => {
  const isBlocked = isStopMarketReviewBlocked(review)

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth={480} borderRadius={16}>
      <Stack className="w-full gap-5 p-5 max-sm:p-4" data-testid="stop-market-confirm-modal">
        <HStack className="items-center justify-between gap-4">
          <div className="text-xl font-medium leading-tight text-text">
            <Trans>Review Stop Market Order</Trans>
          </div>
          <CloseIcon onClick={onDismiss} data-testid="stop-market-confirm-close" />
        </HStack>

        <StopMarketReviewSummary {...review} />

        <Stack className="gap-2">
          {/* Eases into enabled once the fee lands, rather than snapping. */}
          <ButtonPrimary
            className="transition-colors duration-200"
            onClick={onSubmit}
            disabled={isBlocked}
            data-testid="stop-market-confirm-submit"
          >
            {needsWrap ? <Trans>Wrap & Confirm Stop Market Order</Trans> : <Trans>Confirm Stop Market Order</Trans>}
          </ButtonPrimary>
          <span className="text-center text-xs font-medium italic text-subText">
            <Trans>Free to place and cancel · Fee on execution</Trans>
          </span>
        </Stack>
      </Stack>
    </Modal>
  )
}

export default StopMarketConfirmModal

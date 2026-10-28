import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode, useEffect, useState } from 'react'
import { Info } from 'react-feather'
import { Link } from 'react-router-dom'

import { ButtonPrimary } from 'components/Button'
import CheckBox from 'components/CheckBox'
import CurrencyLogo from 'components/CurrencyLogo'
import InfoHelper from 'components/InfoHelper'
import { getSwapCurrencyId } from 'components/LimitOrder/TakeOrder/utils'
import Modal from 'components/Modal'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import {
  StopMarketFeeNotes,
  StopMarketFeeTooltip,
  getStopMarketFeeLabel,
} from 'components/StopMarket/Form/StopMarketFeeSummary'
import { StopMarketWarning } from 'components/StopMarket/Form/useStopMarketWarnings'
import { StopMarketNotice } from 'components/StopMarket/StopMarketNotice'
import { TriggerDistance } from 'components/StopMarket/TriggerDistance'
import { StopMarketFee } from 'components/StopMarket/types'
import {
  clampStopMarketDeadline,
  getStopMarketMinReceive,
  getStopMarketOrderTooSmall,
  getTriggerDirection,
  isStopMarketTriggerClose,
} from 'components/StopMarket/utils'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { CloseIcon } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { formatSlippage } from 'utils/slippage'

/** The Swap page for the pair, with the sell amount carried in the URL. */
const getSwapPath = (currencyIn?: Currency, currencyOut?: Currency, inputAmount?: string) => {
  const route = currencyIn ? NETWORKS_INFO[currencyIn.chainId]?.route : undefined
  const inputId = getSwapCurrencyId(currencyIn)
  const outputId = getSwapCurrencyId(currencyOut)
  if (!route || !inputId || !outputId) return undefined
  const search = new URLSearchParams()
  if (inputAmount && Number(inputAmount) > 0) search.set('input', inputAmount)
  const query = search.toString()
  return `${APP_PATHS.SWAP}/${route}/${encodeURIComponent(inputId)}-to-${encodeURIComponent(outputId)}${
    query ? `?${query}` : ''
  }`
}

/** The terms of an order as they are reviewed before signing, new or as a replacement of an open one. */
export type StopMarketReviewProps = {
  currencyIn?: Currency
  currencyOut?: Currency
  inputAmount: string
  estimatedOutput: string
  estimatedUsdIn?: string
  triggerPrice: string
  triggerPercent?: number
  marketPrice?: number
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

/** Creation review is complete at opening and never subscribes to form estimates. */
export type StopMarketReviewSnapshot = Omit<
  StopMarketReviewProps,
  'fee' | 'feeError' | 'isFeeLoading' | 'onRetryFee'
> & {
  fee: StopMarketFee
  needsWrap: boolean
  amountUsd?: number
}

type Props = StopMarketReviewSnapshot & {
  isOpen: boolean
  /** The user has not placed a stop market order on this device yet, so must accept the terms first. */
  requiresTermsAcceptance?: boolean
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
  tooltip?: ReactNode
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
  marketPrice,
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
  // A too-small order cannot be fixed by retrying the estimate; the user must increase its amount.
  const isOrderTooSmall = !!getStopMarketOrderTooSmall(feeError)
  // Neither a fee nor a reason yet means the estimate is still on its way, from the moment the review opens.
  const isFeePending = isFeeLoading || (!fee && !feeError)
  const receiveSymbol = currencyOut?.symbol ?? ''
  const isTriggerClose = isStopMarketTriggerClose({ triggerPrice, marketPrice, slippage })
  const swapPath = getSwapPath(currencyIn, currencyOut, inputAmount)

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
          tooltip={<StopMarketFeeTooltip fee={fee} chainId={currencyIn?.chainId} />}
          dataTestId="stop-market-confirm-fee"
        >
          {isFeePending ? (
            <RowSkeleton dataTestId="stop-market-confirm-fee-loading" />
          ) : (
            <span className={cn(showFeeError && 'text-red')}>
              {showFeeError ? <Trans>Unavailable</Trans> : (fee && getStopMarketFeeLabel(fee)) ?? '--'}
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

      {warnings.map((warning, index) => (
        <StopMarketNotice variant="box" key={index} type={warning.type} dataTestId="stop-market-confirm-warning">
          {warning.message}
        </StopMarketNotice>
      ))}

      {isTriggerClose && (
        <StopMarketNotice
          type="warn"
          icon={Info}
          animate={false}
          dataTestId="stop-market-confirm-close-trigger-warning"
        >
          <span>
            {swapPath ? (
              <Trans>
                Your trigger is very close to the current price. If you want to trade instantly, use{' '}
                <Link to={swapPath} className="text-primary hover:brightness-125">
                  Swap.
                </Link>
              </Trans>
            ) : (
              <Trans>Your trigger is very close to the current price. If you want to trade instantly, use Swap.</Trans>
            )}
          </span>
        </StopMarketNotice>
      )}

      {showFeeError && isOrderTooSmall && (
        <StopMarketNotice type="warn" icon={Info} animate={false} dataTestId="stop-market-confirm-fee-too-small">
          <Trans>The fee is higher than your order amount. Increase the amount to continue.</Trans>
        </StopMarketNotice>
      )}

      {showFeeError && !isOrderTooSmall && (
        <StopMarketNotice variant="box" type="error" dataTestId="stop-market-confirm-fee-error">
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
        </StopMarketNotice>
      )}
    </>
  )
}

/** The review of a new order, in its own dialog over the form. */
const StopMarketConfirmModal = ({
  isOpen,
  needsWrap,
  requiresTermsAcceptance,
  onDismiss,
  onSubmit,
  ...review
}: Props) => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false)
  const [isTermsExpanded, setIsTermsExpanded] = useState(false)
  // Each review asks afresh until an order is placed.
  useEffect(() => {
    if (!isOpen) return
    setHasAcceptedTerms(false)
    setIsTermsExpanded(false)
  }, [isOpen])

  const isBlocked = isStopMarketReviewBlocked(review) || (!!requiresTermsAcceptance && !hasAcceptedTerms)

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
        {/* Keep the fee-share warning from the estimate captured when review opened. */}
        <StopMarketFeeNotes fee={review.fee} showShareWarning />

        {requiresTermsAcceptance && (
          <label
            className="flex cursor-pointer items-start gap-2.5 text-xs text-subText"
            data-testid="stop-market-confirm-terms"
          >
            {/* Drawn rather than native, so it shows the modal through it until it is ticked. */}
            <CheckBox
              borderStyle
              className="mt-px size-3.5 min-w-3.5 cursor-pointer rounded-[3px] border-subText before:size-2.5"
              checked={hasAcceptedTerms}
              onChange={event => setHasAcceptedTerms(event.target.checked)}
              data-testid="stop-market-confirm-terms-checkbox"
            />
            <span>
              <Trans>
                I acknowledge that Stop Market order will be automatically triggered and executed based on my specified
                parameters and third-party price data, without further confirmation, and accept the associated risks.
              </Trans>
              {isTermsExpanded && (
                <span className="block">
                  <Trans>
                    Execution may be delayed, fail, or occur at a price different from my specified trigger price due to
                    market conditions, price data delays or discrepancies, or technical issues.
                  </Trans>
                </span>
              )}
              {!isTermsExpanded && ' '}
              <button
                type="button"
                // Inside the label, a click would otherwise tick the box as well.
                onClick={event => {
                  event.preventDefault()
                  setIsTermsExpanded(expanded => !expanded)
                }}
                className={cn(
                  'cursor-pointer border-0 bg-transparent p-0 text-xs text-primary hover:brightness-125',
                  isTermsExpanded && 'block',
                )}
                data-testid="stop-market-confirm-terms-toggle"
              >
                {isTermsExpanded ? <Trans>See less</Trans> : <Trans>See more</Trans>}
              </button>
            </span>
          </label>
        )}

        <Stack className="gap-2">
          {/* The fee is settled; terms acceptance and captured blocking warnings gate confirmation. */}
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

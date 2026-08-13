import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { AlertTriangle, ArrowRight, Info } from 'react-feather'

import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import Modal from 'components/Modal'
import { Center, HStack, Stack } from 'components/Stack'
import { StopLossWarning } from 'components/StopLoss/Form/useStopLossWarnings'
import { StopLossFee } from 'components/StopLoss/types'
import { clampStopLossDeadline } from 'components/StopLoss/utils'
import { CloseIcon } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { formatSlippage } from 'utils/slippage'

type Props = {
  isOpen: boolean
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
  fee?: StopLossFee
  /** Sell side priced in USD, which is what turns the fee percentage into an amount. */
  notionalUsd?: number
  needsWrap?: boolean
  warnings?: StopLossWarning[]
  onDismiss?: () => void
  onSubmit?: () => void
}

const SummaryRow = ({
  label,
  dataTestId,
  children,
}: {
  label: React.ReactNode
  dataTestId: string
  children: React.ReactNode
}) => (
  <HStack className="items-start justify-between gap-4 text-sm">
    <span className="shrink-0 text-subText">{label}</span>
    <div className="text-right text-text" data-testid={dataTestId}>
      {children}
    </div>
  </HStack>
)

const WARNING_STYLES = {
  info: { className: 'bg-primary-10 text-primary', Icon: Info },
  warn: { className: 'bg-warning-10 text-warning', Icon: AlertTriangle },
} as const

const ReviewWarning = ({ warning }: { warning: StopLossWarning }) => {
  const { className, Icon } = WARNING_STYLES[warning.type]
  return (
    <HStack
      className={cn('w-full items-start gap-2.5 rounded-xl px-3 py-2 text-sm', className)}
      data-testid="stop-loss-confirm-warning"
      data-warning-type={warning.type}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1">{warning.message}</div>
    </HStack>
  )
}

const StopLossConfirmModal = ({
  isOpen,
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
  notionalUsd,
  needsWrap,
  warnings = [],
  onDismiss,
  onSubmit,
}: Props) => {
  const feePercentage = fee?.protocol?.percentage
  const feeUsd = feePercentage !== undefined && notionalUsd ? (notionalUsd * feePercentage) / 100 : undefined
  // The order stays reviewable so the warning can be read; only signing it is refused.
  const isBlocked = warnings.some(warning => warning.blocking)

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth={480} borderRadius={16}>
      <Stack className="w-full gap-6 p-5 max-sm:p-4" data-testid="stop-loss-confirm-modal">
        <HStack className="items-center justify-between gap-4">
          <div className="text-xl font-medium leading-tight text-text">
            <Trans>Review Stop-Loss Order</Trans>
          </div>
          <CloseIcon onClick={onDismiss} data-testid="stop-loss-confirm-close" />
        </HStack>

        <Stack className="gap-4">
          <HStack className="items-center justify-between gap-3 rounded-xl bg-buttonGray p-3">
            <Stack className="min-w-0 gap-2">
              <span className="text-sm text-subText">
                <Trans>You Sell</Trans>
              </span>
              <HStack className="min-w-0 items-center gap-1.5">
                <CurrencyLogo currency={currencyIn} size="20px" />
                <span className="truncate text-xl font-medium text-text" data-testid="stop-loss-confirm-sell-amount">
                  {formatDisplayNumber(inputAmount, { significantDigits: 6 })} {currencyIn?.symbol}
                </span>
              </HStack>
              {estimatedUsdIn && (
                <span className="text-sm text-subText" data-testid="stop-loss-confirm-sell-usd">
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
              <HStack className="min-w-0 items-center gap-1.5">
                <CurrencyLogo currency={currencyOut} size="20px" />
                <span className="truncate text-xl font-medium text-text" data-testid="stop-loss-confirm-receive-amount">
                  ~{formatDisplayNumber(estimatedOutput, { significantDigits: 6 })} {currencyOut?.symbol}
                </span>
              </HStack>
              {estimatedUsdOut && (
                <span className="text-sm text-subText" data-testid="stop-loss-confirm-receive-usd">
                  ~{estimatedUsdOut}
                </span>
              )}
            </Stack>
          </HStack>

          <Stack className="gap-3">
            <SummaryRow label={<Trans>Trigger Price</Trans>} dataTestId="stop-loss-confirm-trigger-price">
              <div>
                1 {currencyIn?.symbol} = {triggerPrice} {currencyOut?.symbol}
              </div>
              {triggerPercent !== undefined && triggerPercent < 0 && (
                <div data-testid="stop-loss-confirm-trigger-distance">
                  <span className="text-red">
                    ↓ {formatDisplayNumber(Math.abs(triggerPercent), { fractionDigits: 1 })}%
                  </span>{' '}
                  <span className="text-subText">
                    <Trans>below current oracle price</Trans>
                  </span>
                </div>
              )}
            </SummaryRow>

            <SummaryRow label={<Trans>Max Slippage</Trans>} dataTestId="stop-loss-confirm-slippage">
              {formatSlippage(slippage)}
            </SummaryRow>

            <SummaryRow label={<Trans>Fee</Trans>} dataTestId="stop-loss-confirm-fee">
              <HStack className="items-center gap-1">
                <span>
                  {feePercentage === undefined ? '--' : `${formatDisplayNumber(feePercentage, { fractionDigits: 2 })}%`}
                </span>
                {/* The percentage applied to the sell side, so the figure is an estimate like the rest. */}
                {feeUsd !== undefined && (
                  <span className="text-subText">
                    ~{formatDisplayNumber(feeUsd, { style: 'currency', significantDigits: 4 })}
                  </span>
                )}
              </HStack>
            </SummaryRow>

            {/* Show the deadline that actually gets signed, not the pre-clamp value an
              "expires never" choice produces. */}
            <SummaryRow label={<Trans>Expires</Trans>} dataTestId="stop-loss-confirm-expiry">
              {dayjs.unix(clampStopLossDeadline(expiredAt / 1000)).format('DD/MM/YYYY HH:mm')}
            </SummaryRow>
          </Stack>

          <div
            className="rounded-xl border border-primary-20 bg-primary-10 px-3 py-2 text-sm text-primary"
            data-testid="stop-loss-confirm-execution-note"
          >
            <Trans>
              When triggered, KyberSwap will swap your {currencyIn?.symbol} at the best available market price.
            </Trans>
          </div>

          {warnings.map((warning, index) => (
            <ReviewWarning key={index} warning={warning} />
          ))}

          <Stack className="gap-2">
            <ButtonPrimary onClick={onSubmit} disabled={isBlocked} data-testid="stop-loss-confirm-submit">
              {needsWrap ? <Trans>Wrap & Confirm Stop-Loss</Trans> : <Trans>Confirm Stop-Loss</Trans>}
            </ButtonPrimary>
            <span className="text-center text-xs font-medium italic text-subText">
              <Trans>No gas to sign · Fee on execution</Trans>
            </span>
          </Stack>
        </Stack>
      </Stack>
    </Modal>
  )
}

export default StopLossConfirmModal

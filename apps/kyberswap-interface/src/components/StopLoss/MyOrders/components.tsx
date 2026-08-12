import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { cva } from 'class-variance-authority'
import dayjs from 'dayjs'
import { ReactNode } from 'react'
import { AlertTriangle, ChevronDown, Trash } from 'react-feather'

import { ReactComponent as RecreateIcon } from 'assets/svg/ic_stoploss_recreate.svg'
import { ReactComponent as NoDataIcon } from 'assets/svg/no_data.svg'
import { ButtonOutlined } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import { HStack, Stack } from 'components/Stack'
import { StopLossDisplayStatus } from 'components/StopLoss/types'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { formatTimeDuration } from 'utils/time'

export const StopLossTabSelector = ({
  isActiveTab,
  onChange,
}: {
  isActiveTab: boolean
  onChange: (isActive: boolean) => void
}) => (
  <HStack className="min-w-0 flex-1 items-center gap-0 px-4 py-3 text-sm font-medium" data-testid="stop-loss-tabs">
    <button
      type="button"
      data-testid="stop-loss-tab-active"
      aria-selected={isActiveTab}
      onClick={() => onChange(true)}
      className={cn(
        'cursor-pointer border-0 border-r border-darkBorder bg-transparent pr-3',
        isActiveTab ? 'text-primary' : 'text-subText hover:text-text',
      )}
    >
      <Trans>Active Orders</Trans>
    </button>
    <button
      type="button"
      data-testid="stop-loss-tab-history"
      aria-selected={!isActiveTab}
      onClick={() => onChange(false)}
      className={cn(
        'cursor-pointer border-0 bg-transparent pl-3',
        !isActiveTab ? 'text-primary' : 'text-subText hover:text-text',
      )}
    >
      <span className="max-sm:hidden">
        <Trans>Order History</Trans>
      </span>
      <span className="sm:hidden">
        <Trans>History</Trans>
      </span>
    </button>
  </HStack>
)

/**
 * The confirmation modal owns the cancelling state and covers this button while a batch runs, so the
 * button itself has no busy state to show. Orders drop out of the cancellable set as they settle,
 * which is what takes it off screen.
 */
export const CancelAllButton = ({ onClick }: { onClick: () => void }) => (
  <ButtonOutlined
    onClick={onClick}
    data-testid="stop-loss-cancel-all-button"
    className="w-fit gap-1.5 !border-red-35 px-3 py-1 text-sm !text-red"
  >
    <Trash size={14} />
    <Trans>Cancel All</Trans>
  </ButtonOutlined>
)

export const StopLossEmptyOrders = ({
  isActiveTab,
  keyword,
  isError,
}: {
  isActiveTab: boolean
  keyword: string
  /** A failed request must not read as "you have no orders" — that hides outages behind a normal state. */
  isError?: boolean
}) => (
  <Stack
    className={cn(
      'min-h-[220px] items-center justify-center gap-2 text-sm font-medium',
      isError ? 'text-warning' : 'text-subText',
    )}
    data-testid={isError ? 'stop-loss-orders-error' : 'stop-loss-no-orders'}
  >
    {isError ? <AlertTriangle size={22} /> : <NoDataIcon />}
    <span>
      {isError ? (
        <Trans>Could not load your stop-loss orders. Retrying…</Trans>
      ) : keyword ? (
        <Trans>No orders found.</Trans>
      ) : isActiveTab ? (
        <Trans>No active stop-loss orders. Place your first order above.</Trans>
      ) : (
        <Trans>No order history yet.</Trans>
      )}
    </span>
  </Stack>
)

/**
 * Logo and symbol both come from the resolved currency. Looking the logo up by the order's raw
 * address instead would miss: the service returns addresses lower-cased, while the whitelist map is
 * keyed by checksummed ones.
 */
export const PairCell = ({
  sellCurrency,
  receiveCurrency,
}: {
  sellCurrency?: Currency
  receiveCurrency?: Currency
}) => (
  <HStack className="min-w-0 items-center gap-1.5 text-sm font-medium text-text" data-testid="stop-loss-order-pair">
    <CurrencyLogo currency={sellCurrency} size="16px" />
    <span className="truncate">{sellCurrency?.symbol || '--'}</span>
    <span className="shrink-0 text-subText">→</span>
    <CurrencyLogo currency={receiveCurrency} size="16px" />
    <span className="truncate">{receiveCurrency?.symbol || '--'}</span>
  </HStack>
)

/** A primary value with its USD equivalent underneath, the shape every amount column uses. */
export const AmountCell = ({
  value,
  subValue,
  className,
  dataTestId,
}: {
  value: ReactNode
  subValue?: ReactNode
  className?: string
  dataTestId?: string
}) => (
  <Stack className={cn('min-w-0 gap-0.5', className)}>
    <span className="truncate text-sm font-medium text-text" data-testid={dataTestId}>
      {value}
    </span>
    {subValue !== undefined && (
      <span className="truncate text-xs font-medium text-subText" data-testid={dataTestId && `${dataTestId}-usd`}>
        {subValue}
      </span>
    )}
  </Stack>
)

const distanceStyles = cva('text-sm font-medium', {
  variants: {
    proximity: {
      far: 'text-primary',
      near: 'text-warning',
      imminent: 'text-red',
      unknown: 'text-subText',
    },
  },
  defaultVariants: { proximity: 'unknown' },
})

/**
 * How much room is left before the trigger fires. The arrow follows the sign: a trigger that has risen
 * above the market is about to fire, which is the opposite of the same magnitude below it.
 */
export const DistanceCell = ({ percent }: { percent?: number }) => {
  if (percent === undefined)
    return (
      <span className={distanceStyles({ proximity: 'unknown' })} data-testid="stop-loss-order-distance">
        --
      </span>
    )

  const magnitude = Math.abs(percent)
  // A trigger at or above the market is imminent no matter how far past it has gone.
  const proximity = percent >= 0 ? 'imminent' : magnitude > 10 ? 'far' : magnitude >= 5 ? 'near' : 'imminent'

  return (
    <span className={distanceStyles({ proximity })} data-testid="stop-loss-order-distance">
      {percent >= 0 ? '↑' : '↓'} {formatDisplayNumber(magnitude, { fractionDigits: 1 })}%
    </span>
  )
}

const statusStyles = cva('block text-sm font-medium', {
  variants: {
    status: {
      [StopLossDisplayStatus.ACTIVE]: 'text-primary',
      [StopLossDisplayStatus.TRIGGERED]: 'text-warning',
      [StopLossDisplayStatus.EXECUTED]: 'text-primary',
      [StopLossDisplayStatus.FAILED]: 'text-red',
      [StopLossDisplayStatus.CANCELLED]: 'text-subText',
      [StopLossDisplayStatus.EXPIRED]: 'text-subText',
    },
  },
})

export const formatStopLossStatus = (status: StopLossDisplayStatus) => {
  switch (status) {
    case StopLossDisplayStatus.ACTIVE:
      return t`Active`
    case StopLossDisplayStatus.TRIGGERED:
      return t`Triggered`
    case StopLossDisplayStatus.EXECUTED:
      return t`Executed`
    case StopLossDisplayStatus.FAILED:
      return t`Failed`
    case StopLossDisplayStatus.CANCELLED:
      return t`Cancelled`
    default:
      return t`Expired`
  }
}

/**
 * Only a failure carries anything to expand — the other statuses say everything they have in one word.
 */
export const StatusCell = ({
  status,
  expanded,
  onToggle,
}: {
  status: StopLossDisplayStatus
  expanded?: boolean
  onToggle?: () => void
}) => {
  const label = formatStopLossStatus(status)
  if (!onToggle)
    return (
      <span className={statusStyles({ status })} data-testid="stop-loss-order-status" data-status={status}>
        {label}
      </span>
    )

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      data-testid="stop-loss-order-status"
      data-status={status}
      className={cn(
        statusStyles({ status }),
        'flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 hover:brightness-110',
      )}
    >
      {label}
      <ChevronDown size={14} className={cn('transition-transform', expanded && 'rotate-180')} />
    </button>
  )
}

/** The failure detail that drops out of a Failed row, spanning the whole table width. */
export const StopLossFailureDetail = ({
  sellSymbol,
  reason,
  onRecreate,
}: {
  sellSymbol: string
  reason: string
  onRecreate: () => void
}) => (
  <HStack
    className="col-span-full mt-3 items-center justify-between gap-4 border-t border-darkBorder pt-3 max-sm:flex-col max-sm:items-start"
    data-testid="stop-loss-order-failure-detail"
  >
    <Stack className="gap-1 text-sm font-medium text-subText">
      <span>
        <Trans>
          Your stop-loss triggered but the swap could not complete. Your <span className="text-text">{sellSymbol}</span>{' '}
          is still in your wallet.
        </Trans>
      </span>
      <span data-testid="stop-loss-order-failure-reason">
        <Trans>Reason</Trans>: {reason}
      </span>
    </Stack>
    <ButtonOutlined
      onClick={onRecreate}
      data-testid="stop-loss-order-failure-recreate"
      className="w-fit shrink-0 gap-1.5 !border-primary-50 px-3 py-1 text-sm !text-primary"
    >
      <RecreateIcon className="size-3.5" />
      <Trans>Recreate</Trans>
    </ButtonOutlined>
  </HStack>
)

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60

/** Relative wording inside a week, an absolute date beyond it. */
export const formatExpiry = (deadlineInSeconds: number) => {
  const expiry = dayjs.unix(deadlineInSeconds)
  const secondsLeft = expiry.diff(dayjs(), 'second')

  if (secondsLeft <= 0) return t`Expired`
  if (secondsLeft >= SEVEN_DAYS_IN_SECONDS) return expiry.format('DD/MM/YYYY HH:mm')

  const remaining = formatTimeDuration(secondsLeft)
  return t`in ${remaining}`
}

import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { cva } from 'class-variance-authority'
import dayjs from 'dayjs'
import { ReactNode } from 'react'
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, ExternalLink as LinkIcon, Trash } from 'react-feather'

import { ReactComponent as RecreateIcon } from 'assets/svg/ic_stoploss_recreate.svg'
import { ReactComponent as NoDataIcon } from 'assets/svg/no_data.svg'
import CurrencyLogo from 'components/CurrencyLogo'
import { HStack, Stack } from 'components/Stack'
import { StopLossDisplayStatus } from 'components/StopLoss/types'
import { StopLossFill, StopLossFillSummary, getTriggerProximity } from 'components/StopLoss/utils'
import { MouseoverTooltip } from 'components/Tooltip'
import { NETWORKS_INFO } from 'constants/networks'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { getEtherscanLink } from 'utils/explorer'
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
  <button
    type="button"
    onClick={onClick}
    data-testid="stop-loss-cancel-all-button"
    className="flex w-fit cursor-pointer items-center gap-1.5 rounded-[10px] border border-tabActive bg-white-08 px-3 py-1 text-sm font-medium text-subText transition-colors hover:text-text"
  >
    <Trash size={14} />
    <Trans>Cancel All</Trans>
  </button>
)

const pagerArrowClass = (enabled: boolean) =>
  cn(
    'flex size-7 items-center justify-center rounded-full border-0 transition',
    enabled
      ? 'cursor-pointer bg-primary-10 text-primary hover:brightness-110'
      : 'cursor-not-allowed bg-white-04 text-border',
  )

/** Previous, the current page and next — the compact pager the order table ends with. */
export const StopLossPager = ({
  page,
  pageCount,
  onPageChange,
}: {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}) => (
  <HStack className="items-center justify-end gap-2 bg-raisedBlack px-4 py-2" data-testid="stop-loss-pagination">
    <button
      type="button"
      aria-label={t`Previous page`}
      data-testid="stop-loss-pagination-previous"
      disabled={page <= 1}
      className={pagerArrowClass(page > 1)}
      onClick={() => onPageChange(page - 1)}
    >
      <ChevronLeft size={16} />
    </button>
    <span
      className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-buttonBlack px-2 text-sm font-medium text-subText"
      data-testid="stop-loss-pagination-page"
    >
      {page}
    </span>
    <button
      type="button"
      aria-label={t`Next page`}
      data-testid="stop-loss-pagination-next"
      disabled={page >= pageCount}
      className={pagerArrowClass(page < pageCount)}
      onClick={() => onPageChange(page + 1)}
    >
      <ChevronRight size={16} />
    </button>
  </HStack>
)

export const StopLossEmptyOrders = ({
  isActiveTab,
  keyword,
  isError,
  isWalletConnected,
}: {
  isActiveTab: boolean
  keyword: string
  /** A failed request must not read as "you have no orders" — that hides outages behind a normal state. */
  isError?: boolean
  /** Without a wallet there is nothing to list, which is not the same as having no orders. */
  isWalletConnected: boolean
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
      {!isWalletConnected ? (
        <Trans>Connect your wallet to view your stop-loss orders.</Trans>
      ) : isError ? (
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

/** The list holds the wallet's orders on every chain, so each row names its own. */
export const ChainCell = ({ chainId }: { chainId: ChainId }) => {
  const { name, icon } = NETWORKS_INFO[chainId]
  return (
    <span className="flex items-center justify-center" data-testid="stop-loss-order-chain">
      <MouseoverTooltip text={name} placement="top" width="fit-content">
        <img className="size-5" src={icon} alt={name} />
      </MouseoverTooltip>
    </span>
  )
}

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
    <span className="truncate">{sellCurrency?.symbol || '-'}</span>
    <span className="shrink-0 text-subText">→</span>
    <CurrencyLogo currency={receiveCurrency} size="16px" />
    <span className="truncate">{receiveCurrency?.symbol || '-'}</span>
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
  // `max-w-full` lets the lines truncate when a caller aligns them with `items-end`: a flex item that is
  // not stretched sizes to its content and would otherwise spill into the neighbouring column.
  <Stack className={cn('min-w-0 gap-0.5', className)}>
    <span className="max-w-full truncate text-sm font-medium text-text" data-testid={dataTestId}>
      {value}
    </span>
    {subValue !== undefined && (
      <span
        className="max-w-full truncate text-xs font-medium text-subText"
        data-testid={dataTestId && `${dataTestId}-usd`}
      >
        {subValue}
      </span>
    )}
  </Stack>
)

/** The colour a trigger distance takes, in the order list and on the form alike. */
export const triggerProximityText = cva('', {
  variants: {
    proximity: {
      far: 'text-green2',
      near: 'text-darkOrange',
      imminent: 'text-red',
      unknown: 'text-subText',
    },
  },
  defaultVariants: { proximity: 'unknown' },
})

/**
 * The distance's size as shown, without its sign. One decimal, always, so the column lines up —
 * formatDisplayNumber would drop the trailing zero. A distance too small to survive that rounding keeps
 * its first significant digit instead, in the form's notation (0.003, 0.0₄9), so a trigger merely close
 * to the market never reads as exactly at it.
 */
export const formatDistanceMagnitude = (percent: number) => {
  const magnitude = Math.abs(percent)
  const rounded = Math.round(magnitude * 10) / 10
  if (rounded === 0 && magnitude > 0) return formatDisplayNumber(magnitude, { fractionDigits: 1 })
  return rounded.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

/**
 * How much room is left before the trigger fires. The arrow follows the sign: a trigger that has risen
 * above the market is about to fire, which is the opposite of the same magnitude below it.
 */
export const DistanceCell = ({ percent }: { percent?: number }) => {
  if (percent === undefined)
    return (
      <span className={cn('text-sm font-medium', triggerProximityText())} data-testid="stop-loss-order-distance">
        -
      </span>
    )

  return (
    <span
      className={cn('text-sm font-medium', triggerProximityText({ proximity: getTriggerProximity(percent) }))}
      data-testid="stop-loss-order-distance"
    >
      {percent >= 0 ? '↑' : '↓'} {formatDistanceMagnitude(percent)}%
    </span>
  )
}

const statusStyles = cva('block text-xs font-medium', {
  variants: {
    status: {
      [StopLossDisplayStatus.ACTIVE]: 'text-primary',
      [StopLossDisplayStatus.TRIGGERED]: 'text-warning',
      [StopLossDisplayStatus.EXECUTED]: 'text-green2',
      [StopLossDisplayStatus.FAILED]: 'text-red',
      [StopLossDisplayStatus.CANCELLED]: 'text-gray',
      [StopLossDisplayStatus.EXPIRED]: 'text-gray',
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
 * Only an executed or failed order carries anything to expand — the other statuses say everything they
 * have in one word.
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

const DETAIL_CLASS = 'border-t border-white-04 px-4 pb-3 pt-2 text-xs font-medium text-subText'

/** The failure detail that opens under a Failed row, spanning the whole table width. */
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
    className={cn(DETAIL_CLASS, 'items-center justify-between gap-4 max-sm:flex-col max-sm:items-start')}
    data-testid="stop-loss-order-failure-detail"
  >
    <Stack className="gap-1">
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
    <button
      type="button"
      onClick={onRecreate}
      data-testid="stop-loss-order-failure-recreate"
      className="flex w-fit shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-primary-20 px-3 py-1 text-xs font-medium text-primary transition hover:brightness-110"
    >
      <RecreateIcon className="size-3.5" />
      <Trans>Recreate</Trans>
    </button>
  </HStack>
)

const formatFillAmount = (value: number | undefined) =>
  value === undefined ? '-' : formatDisplayNumber(value, { significantDigits: 6 })

/** Positive when the fill landed below the trigger. */
const getTriggerGapPercent = (price: number | undefined, triggerPrice: number) =>
  price && triggerPrice ? ((triggerPrice - price) / triggerPrice) * 100 : undefined

const formatTriggerGap = (gapPercent: number) => formatDisplayNumber(Math.abs(gapPercent), { fractionDigits: 2 })

/**
 * What an executed order actually did, opening under its row like the failure detail. The gap to the
 * trigger is worth stating: the fill follows the oracle at execution, which a fast market can carry
 * well past the trigger. An order settled in several fills gets the totals first, then each fill with
 * its own transaction — the row's link reaches only the latest.
 */
export const StopLossExecutionDetail = ({
  chainId,
  fills,
  summary,
  sellSymbol,
  receiveSymbol,
  triggerPrice,
}: {
  chainId: ChainId
  fills: StopLossFill[]
  summary: StopLossFillSummary
  sellSymbol: string
  receiveSymbol: string
  triggerPrice: number
}) => {
  const sold = formatFillAmount(summary.amountIn)
  const received = formatFillAmount(summary.amountOut)
  const price = formatFillAmount(summary.price)
  const gapPercent = getTriggerGapPercent(summary.price, triggerPrice)
  const gap = gapPercent === undefined ? undefined : formatTriggerGap(gapPercent)

  if (fills.length > 1) {
    const fillCount = fills.length
    return (
      <Stack className={cn(DETAIL_CLASS, 'gap-2')} data-testid="stop-loss-order-execution-detail">
        <span>
          <Trans>
            Sold <span className="text-text">{sold}</span> {sellSymbol} in {fillCount} fills at ~{price} {receiveSymbol}{' '}
            per {sellSymbol} on average. You received <span className="text-text">{received}</span> {receiveSymbol}.
          </Trans>
        </span>
        {/* One grid for every fill, so their figures line up in columns; a phone wraps each fill instead. */}
        <ol className="grid grid-cols-[repeat(4,max-content)_1fr] items-center gap-x-4 gap-y-1 max-sm:flex max-sm:flex-col">
          {fills.map((fill, index) => {
            const fillNumber = index + 1
            const fillGapPercent = getTriggerGapPercent(fill.price, triggerPrice)
            const fillGap = fillGapPercent === undefined ? undefined : formatTriggerGap(fillGapPercent)
            return (
              <li
                key={fill.hash}
                className="contents max-sm:flex max-sm:flex-wrap max-sm:items-center max-sm:gap-x-3 max-sm:gap-y-0.5"
                data-testid="stop-loss-order-fill"
              >
                <span className="text-gray">
                  <Trans>Fill {fillNumber}</Trans>
                </span>
                <span>
                  <span className="text-text">{formatFillAmount(fill.amountIn)}</span> {sellSymbol} →{' '}
                  <span className="text-text">{formatFillAmount(fill.amountOut)}</span> {receiveSymbol}
                </span>
                <span>~{formatFillAmount(fill.price)}</span>
                {/* Rendered even when empty, so a fill without a price keeps its link in the last column. */}
                <span>
                  {fillGap !== undefined &&
                    fillGapPercent !== undefined &&
                    (fillGapPercent >= 0 ? (
                      <Trans>{fillGap}% below trigger</Trans>
                    ) : (
                      <Trans>{fillGap}% above trigger</Trans>
                    ))}
                </span>
                <ExternalLink
                  href={getEtherscanLink(chainId, fill.hash, 'transaction')}
                  aria-label={t`View transaction`}
                  data-testid="stop-loss-order-fill-tx-link"
                  className="flex w-fit items-center text-subText hover:text-text hover:no-underline"
                >
                  <LinkIcon size={12} />
                </ExternalLink>
              </li>
            )
          })}
        </ol>
      </Stack>
    )
  }

  return (
    <Stack className={cn(DETAIL_CLASS, 'gap-1')} data-testid="stop-loss-order-execution-detail">
      <span>
        <Trans>
          Sold <span className="text-text">{sold}</span> {sellSymbol} at ~{price} {receiveSymbol} per {sellSymbol}. You
          received <span className="text-text">{received}</span> {receiveSymbol}.
        </Trans>
      </span>
      {gap !== undefined && gapPercent !== undefined && (
        <span data-testid="stop-loss-order-execution-gap">
          {gapPercent >= 0 ? (
            <Trans>Executed {gap}% below trigger.</Trans>
          ) : (
            <Trans>Executed {gap}% above trigger.</Trans>
          )}
        </span>
      )}
    </Stack>
  )
}

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60

/** Relative wording inside a week; beyond it, an absolute date with its time split out as a second line. */
export const formatExpiry = (deadlineInSeconds: number): { label: string; time?: string } => {
  const expiry = dayjs.unix(deadlineInSeconds)
  const secondsLeft = expiry.diff(dayjs(), 'second')

  if (secondsLeft <= 0) return { label: t`Expired` }
  if (secondsLeft >= SEVEN_DAYS_IN_SECONDS) return { label: expiry.format('DD/MM/YYYY'), time: expiry.format('HH:mm') }

  const remaining = formatTimeDuration(secondsLeft)
  return { label: t`in ${remaining}` }
}

/** The date sits above its time; relative and expired wording have no time and stay on one line. */
export const ExpiryCell = ({ deadline }: { deadline: number }) => {
  const { label, time } = formatExpiry(deadline)

  return (
    <Stack className="min-w-0 gap-0.5 font-medium" data-testid="stop-loss-order-expiry">
      <span className="truncate text-sm text-subText">{label}</span>
      {time && <span className="truncate text-xs text-gray">{time}</span>}
    </Stack>
  )
}

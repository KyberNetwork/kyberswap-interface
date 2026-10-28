import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { cva } from 'class-variance-authority'
import dayjs from 'dayjs'
import { ReactNode } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink as LinkIcon,
  RefreshCw,
} from 'react-feather'

import { ReactComponent as NoDataIcon } from 'assets/svg/no_data.svg'
import CurrencyLogo from 'components/CurrencyLogo'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { StopMarketRowLayout, StopMarketRowWrapper } from 'components/StopMarket/MyOrders/TableHeader'
import { StopMarketDisplayStatus } from 'components/StopMarket/types'
import {
  StopMarketFill,
  StopMarketFillSummary,
  formatDistanceMagnitude,
  getTriggerProximity,
} from 'components/StopMarket/utils'
import { MouseoverTooltip } from 'components/Tooltip'
import { NETWORKS_INFO } from 'constants/networks'
import { ExternalLink } from 'theme'
import { shortenHash } from 'utils/address'
import { cn } from 'utils/cn'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'

export const StopMarketTabSelector = ({
  isActiveTab,
  onChange,
}: {
  isActiveTab: boolean
  onChange: (isActive: boolean) => void
}) => (
  <HStack className="min-w-0 flex-1 items-center gap-0 px-4 py-3 text-sm font-medium" data-testid="stop-market-tabs">
    <button
      type="button"
      data-testid="stop-market-tab-active"
      aria-selected={isActiveTab}
      onClick={() => onChange(true)}
      className={cn(
        'cursor-pointer border-0 border-r border-darkBorder bg-transparent pr-3 transition-colors',
        isActiveTab ? 'text-primary' : 'text-subText hover:text-text',
      )}
    >
      <Trans>Active Orders</Trans>
    </button>
    <button
      type="button"
      data-testid="stop-market-tab-history"
      aria-selected={!isActiveTab}
      onClick={() => onChange(false)}
      className={cn(
        'cursor-pointer border-0 bg-transparent pl-3 transition-colors',
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

const pagerArrowClass = (enabled: boolean) =>
  cn(
    'flex size-7 items-center justify-center rounded-full border-0 transition',
    enabled
      ? 'cursor-pointer bg-primary-10 text-primary hover:brightness-110'
      : 'cursor-not-allowed bg-white-04 text-border',
  )

/** Previous, the current page and next — the compact pager the order table ends with. */
export const StopMarketPager = ({
  page,
  pageCount,
  onPageChange,
}: {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}) => (
  <HStack className="items-center justify-end gap-2 bg-raisedBlack px-4 py-2" data-testid="stop-market-pagination">
    <button
      type="button"
      aria-label={t`Previous page`}
      data-testid="stop-market-pagination-previous"
      disabled={page <= 1}
      className={pagerArrowClass(page > 1)}
      onClick={() => onPageChange(page - 1)}
    >
      <ChevronLeft size={16} />
    </button>
    <span
      className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-buttonBlack px-2 text-sm font-medium text-subText"
      data-testid="stop-market-pagination-page"
    >
      {page}
    </span>
    <button
      type="button"
      aria-label={t`Next page`}
      data-testid="stop-market-pagination-next"
      disabled={page >= pageCount}
      className={pagerArrowClass(page < pageCount)}
      onClick={() => onPageChange(page + 1)}
    >
      <ChevronRight size={16} />
    </button>
  </HStack>
)

export const StopMarketEmptyOrders = ({
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
      'min-h-[220px] animate-[fadeIn_0.2s_ease-out_both] items-center justify-center gap-2 text-sm font-medium motion-reduce:animate-none',
      isError ? 'text-warning' : 'text-subText',
    )}
    data-testid={isError ? 'stop-market-orders-error' : 'stop-market-no-orders'}
  >
    {isError ? <AlertTriangle size={22} /> : <NoDataIcon />}
    <span>
      {!isWalletConnected ? (
        <Trans>Connect your wallet to view your stop market orders.</Trans>
      ) : isError ? (
        <Trans>Could not load your stop market orders. Retrying…</Trans>
      ) : keyword ? (
        <Trans>No orders found.</Trans>
      ) : isActiveTab ? (
        <Trans>No active stop market orders. Place your first order above.</Trans>
      ) : (
        <Trans>No order history yet.</Trans>
      )}
    </span>
  </Stack>
)

/**
 * A bar standing in for one line of text, boxed at that line's height so swapping it for the text moves
 * nothing: `sm` is a text-sm line (20px), `xs` a text-xs one (16px).
 */
export const SkeletonLine = ({ size = 'sm', width }: { size?: 'sm' | 'xs'; width: number }) => (
  <span className={cn('flex max-w-full items-center', size === 'sm' ? 'h-5' : 'h-4')}>
    <Skeleton height={size === 'sm' ? 12 : 10} width={width} borderRadius={6} />
  </span>
)

const SKELETON_ROW_COUNT = 5

/**
 * The table's first load: rows built on the same grid and padding as `StopMarketRow`, with every cell's
 * lines in place, so the real rows replace them without the table moving.
 */
export const StopMarketRowsSkeleton = ({ isActiveTab }: { isActiveTab: boolean }) => (
  <div data-testid="stop-market-orders-skeleton">
    {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
      <StopMarketRowWrapper
        key={index}
        layout={isActiveTab ? StopMarketRowLayout.ACTIVE : StopMarketRowLayout.HISTORY}
        className="min-h-14 px-4 py-2"
      >
        <span className="flex items-center justify-center">
          <Skeleton circle height={20} width={20} />
        </span>
        <HStack className="min-w-0 items-center gap-1.5">
          <Skeleton circle height={16} width={16} />
          <SkeletonLine width={40} />
          <Skeleton circle height={16} width={16} />
          <SkeletonLine width={40} />
        </HStack>
        <Stack className="min-w-0 gap-0.5 max-sm:col-start-3 max-sm:items-end">
          <SkeletonLine width={72} />
          <SkeletonLine size="xs" width={44} />
        </Stack>
        <div className="max-sm:hidden">
          <SkeletonLine width={80} />
        </div>
        {isActiveTab ? (
          <>
            <Stack className="min-w-0 gap-0.5 max-sm:hidden">
              <SkeletonLine size="xs" width={64} />
              <SkeletonLine width={56} />
            </Stack>
            <div className="max-sm:hidden">
              <SkeletonLine width={40} />
            </div>
            <Stack className="min-w-0 gap-0.5 max-sm:hidden">
              <SkeletonLine width={72} />
              <SkeletonLine size="xs" width={36} />
            </Stack>
          </>
        ) : (
          <>
            <div className="max-sm:hidden">
              <SkeletonLine width={80} />
            </div>
            <div className="max-sm:hidden">
              <SkeletonLine width={80} />
            </div>
            <div className="max-sm:hidden">
              <SkeletonLine width={64} />
            </div>
          </>
        )}
        <span className="flex justify-end">
          <Skeleton circle height={20} width={20} />
        </span>
      </StopMarketRowWrapper>
    ))}
  </div>
)

/** The list holds the wallet's orders on every chain, so each row names its own. */
export const ChainCell = ({ chainId }: { chainId: ChainId }) => {
  const { name, icon } = NETWORKS_INFO[chainId]
  return (
    <span className="flex items-center justify-center" data-testid="stop-market-order-chain">
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
export const PairCell = ({ sellCurrency, receiveCurrency }: { sellCurrency: Currency; receiveCurrency: Currency }) => (
  <HStack className="min-w-0 items-center gap-1.5 text-sm font-medium text-text" data-testid="stop-market-order-pair">
    <CurrencyLogo currency={sellCurrency} size="16px" />
    <span className="truncate">{sellCurrency.symbol || '-'}</span>
    <span className="shrink-0 text-subText">→</span>
    <CurrencyLogo currency={receiveCurrency} size="16px" />
    <span className="truncate">{receiveCurrency.symbol || '-'}</span>
  </HStack>
)

/** A primary value with its USD equivalent underneath, the shape every amount column uses. */
export const AmountCell = ({
  value,
  subValue,
  isSubLoading,
  className,
  dataTestId,
}: {
  value: ReactNode
  subValue?: ReactNode
  /** The USD line is on its way, so its space is held rather than added once it lands. */
  isSubLoading?: boolean
  className?: string
  dataTestId?: string
}) => (
  // `max-w-full` lets the lines truncate when a caller aligns them with `items-end`: a flex item that is
  // not stretched sizes to its content and would otherwise spill into the neighbouring column.
  <Stack className={cn('min-w-0 gap-0.5', className)}>
    <span className="max-w-full truncate text-sm font-medium text-text" data-testid={dataTestId}>
      {value}
    </span>
    {isSubLoading && subValue === undefined ? (
      <SkeletonLine size="xs" width={44} />
    ) : (
      subValue !== undefined && (
        <span
          className="max-w-full truncate text-xs font-medium text-subText"
          data-testid={dataTestId && `${dataTestId}-usd`}
        >
          {subValue}
        </span>
      )
    )}
  </Stack>
)

/** The colour a trigger distance takes, in the order list and on the form alike. */
export const triggerProximityText = cva('transition-colors duration-200', {
  variants: {
    proximity: {
      far: 'text-text',
      near: 'text-warning',
      imminent: 'text-red',
      unknown: 'text-subText',
    },
  },
  defaultVariants: { proximity: 'unknown' },
})

/**
 * Stands in for the distance once the trigger has been reached without a fill: a distance would say the
 * order is still waiting for the price, when it is the swap that has not gone through.
 */
export const RetryingCell = () => (
  <HStack className="items-center gap-1 text-xs font-medium text-[#FBB324]" data-testid="stop-market-order-retrying">
    {/* Turning, since the order is still being worked on. */}
    <RefreshCw size={12} className="shrink-0 motion-safe:animate-spin-slow" />
    <Trans>Retrying</Trans>
  </HStack>
)

/**
 * How far the trigger sits from the market. The arrow follows the sign: below the market the order
 * waits for the price to fall to it, above the market for the price to rise to its fill floor.
 */
export const DistanceCell = ({ percent }: { percent?: number }) => {
  if (percent === undefined)
    return (
      <span className={cn('text-sm font-medium', triggerProximityText())} data-testid="stop-market-order-distance">
        -
      </span>
    )

  return (
    <span
      className={cn('text-sm font-medium', triggerProximityText({ proximity: getTriggerProximity(percent) }))}
      data-testid="stop-market-order-distance"
    >
      {percent >= 0 ? '↑' : '↓'} {formatDistanceMagnitude(percent)}%
    </span>
  )
}

const statusStyles = cva('block text-xs font-medium', {
  variants: {
    status: {
      [StopMarketDisplayStatus.ACTIVE]: 'text-primary',
      [StopMarketDisplayStatus.TRIGGERED]: 'text-warning',
      [StopMarketDisplayStatus.EXECUTED]: 'text-green2',
      [StopMarketDisplayStatus.CANCELLED]: 'text-gray',
      [StopMarketDisplayStatus.EXPIRED]: 'text-gray',
    },
  },
})

export const formatStopMarketStatus = (status: StopMarketDisplayStatus) => {
  switch (status) {
    case StopMarketDisplayStatus.ACTIVE:
      return t`Active`
    case StopMarketDisplayStatus.TRIGGERED:
      return t`Triggered`
    case StopMarketDisplayStatus.EXECUTED:
      return t`Executed`
    case StopMarketDisplayStatus.CANCELLED:
      return t`Cancelled`
    default:
      return t`Expired`
  }
}

/**
 * Only an executed order carries anything to expand — the other statuses say everything they have in
 * one word.
 */
export const StatusCell = ({
  status,
  partial,
  expanded,
  onToggle,
}: {
  status: StopMarketDisplayStatus
  /** An executed order that received less than its min amount out, so only part of it filled. */
  partial?: boolean
  expanded?: boolean
  onToggle?: () => void
}) => {
  const label = partial ? t`Partial Executed` : formatStopMarketStatus(status)
  const className = cn(statusStyles({ status }), partial && 'text-blue3')
  if (!onToggle)
    return (
      <span className={className} data-testid="stop-market-order-status" data-status={status} data-partial={partial}>
        {label}
      </span>
    )

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      data-testid="stop-market-order-status"
      data-status={status}
      data-partial={partial}
      className={cn(
        className,
        'flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 hover:brightness-110',
      )}
    >
      {label}
      <ChevronDown size={14} className={cn('transition-transform', expanded && 'rotate-180')} />
    </button>
  )
}

const DETAIL_CLASS = 'border-t border-white-04 px-4 pb-3 pt-2 text-xs font-medium text-subText'

const formatFillAmount = (value: number | undefined) =>
  value === undefined ? '-' : formatDisplayNumber(value, { significantDigits: 6 })

/** Positive when the fill landed below the trigger. */
const getTriggerGapPercent = (price: number | undefined, triggerPrice: number) =>
  price && triggerPrice ? ((triggerPrice - price) / triggerPrice) * 100 : undefined

// Two decimals: a fill usually lands within a fraction of a percent of its trigger.
const formatTriggerGap = (gapPercent: number) => formatDistanceMagnitude(gapPercent, 2)

/** One labelled figure of the strip an executed order opens. */
const DetailField = ({
  label,
  dataTestId,
  children,
}: {
  label: ReactNode
  dataTestId: string
  children: ReactNode
}) => (
  <Stack className="min-w-0 gap-0.5">
    <span className="text-xs text-subText">{label}</span>
    <span className="truncate text-sm font-medium text-text" data-testid={dataTestId}>
      {children}
    </span>
  </Stack>
)

const formatDetailTime = (seconds: number | undefined) =>
  seconds ? dayjs.unix(seconds).format('DD MMM, YYYY HH:mm') : '-'

/**
 * What an executed order actually did, opening under its row across the whole table width: the price it
 * filled at, the least it could have paid out, when it was placed and filled, and its transaction. An
 * order settled in several fills lists each fill with its own transaction under the totals — the strip
 * links only the latest.
 */
export const StopMarketExecutionDetail = ({
  chainId,
  fills,
  summary,
  sellSymbol,
  receiveSymbol,
  triggerPrice,
  minAmountOut,
  createdAt,
}: {
  chainId: ChainId
  fills: StopMarketFill[]
  summary: StopMarketFillSummary
  sellSymbol: string
  receiveSymbol: string
  triggerPrice: number
  minAmountOut?: number
  /** Unix seconds. */
  createdAt: number
}) => {
  const latestFill = fills[fills.length - 1]

  return (
    <Stack className={cn(DETAIL_CLASS, 'gap-3')} data-testid="stop-market-order-execution-detail">
      <div className="grid grid-cols-5 gap-4 max-sm:grid-cols-2">
        <DetailField label={<Trans>Execution price</Trans>} dataTestId="stop-market-order-detail-price">
          {formatFillAmount(summary.price)} {receiveSymbol}
        </DetailField>
        <DetailField label={<Trans>Min amount out</Trans>} dataTestId="stop-market-order-detail-min-out">
          {formatFillAmount(minAmountOut)} {receiveSymbol}
        </DetailField>
        <DetailField label={<Trans>Created at</Trans>} dataTestId="stop-market-order-detail-created">
          {formatDetailTime(createdAt)}
        </DetailField>
        <DetailField label={<Trans>Executed at</Trans>} dataTestId="stop-market-order-detail-executed">
          {formatDetailTime(latestFill?.createdAt)}
        </DetailField>
        <DetailField label={<Trans>Transaction</Trans>} dataTestId="stop-market-order-detail-tx">
          {latestFill ? (
            <ExternalLink
              href={getEtherscanLink(chainId, latestFill.hash, 'transaction')}
              className="inline-flex items-center gap-1 text-text hover:no-underline hover:brightness-125"
            >
              {shortenHash(latestFill.hash, 4)}
              <LinkIcon size={12} />
            </ExternalLink>
          ) : (
            '-'
          )}
        </DetailField>
      </div>

      {fills.length > 1 && (
        // One grid for every fill, so their figures line up in columns; a phone wraps each fill instead.
        <ol className="m-0 grid grid-cols-[repeat(4,max-content)_1fr] items-center gap-x-4 gap-y-1 p-0 max-sm:flex max-sm:flex-col">
          {fills.map((fill, index) => {
            const fillNumber = index + 1
            const fillGapPercent = getTriggerGapPercent(fill.price, triggerPrice)
            const fillGap = fillGapPercent === undefined ? undefined : formatTriggerGap(fillGapPercent)
            return (
              <li
                key={fill.hash}
                className="contents max-sm:flex max-sm:flex-wrap max-sm:items-center max-sm:gap-x-3 max-sm:gap-y-0.5"
                data-testid="stop-market-order-fill"
              >
                <span className="text-gray">
                  <Trans>Fill {fillNumber}</Trans>
                </span>
                <span>
                  <span className="text-text">{formatFillAmount(fill.amountIn)}</span> {sellSymbol} →{' '}
                  <span className="text-text">{formatFillAmount(fill.received)}</span> {receiveSymbol}
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
                  data-testid="stop-market-order-fill-tx-link"
                  className="flex w-fit items-center text-subText hover:text-text hover:no-underline"
                >
                  <LinkIcon size={12} />
                </ExternalLink>
              </li>
            )
          })}
        </ol>
      )}
    </Stack>
  )
}

/**
 * The deadline as a date with its time split out as a second line, in the limit-order table's format.
 * A deadline already passed reads as expired instead, since the service can keep such an order open.
 */
export const formatExpiry = (deadlineInSeconds: number): { label: string; time?: string } => {
  const expiry = dayjs.unix(deadlineInSeconds)
  if (!expiry.isAfter(dayjs())) return { label: t`Expired` }
  return { label: expiry.format('DD/MM/YYYY'), time: expiry.format('HH:mm') }
}

/** The date sits above its time; an expired deadline has no time and stays on one line. */
export const ExpiryCell = ({ deadline }: { deadline: number }) => {
  const { label, time } = formatExpiry(deadline)

  return (
    <Stack className="min-w-0 gap-0.5 font-medium" data-testid="stop-market-order-expiry">
      <span className="truncate text-sm text-subText">{label}</span>
      {time && <span className="truncate text-xs text-gray">{time}</span>}
    </Stack>
  )
}

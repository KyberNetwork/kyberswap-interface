import { type HTMLAttributes, type KeyboardEvent } from 'react'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'

import { Stack } from 'components/Stack'
import CursorPagination, { type CursorPaginationState } from 'pages/CopyTrading/components/CursorPagination'
import {
  HeaderCell,
  TableBody,
  TableCardField,
  TableCell,
  TableHeader,
  TableRow,
} from 'pages/CopyTrading/components/Table'
import { CopyRunAgentCell } from 'pages/CopyTrading/components/common/agentIdentity'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import {
  formatCount,
  formatUsd,
  getDisplayCapitalInUsd,
  getSignedMetricClassName,
  signedUsd,
} from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'
import { formatDateTime } from 'utils/time'

type ClosedSubscriptionsGridProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

const ClosedSubscriptionsGrid = ({ header, className, ...props }: ClosedSubscriptionsGridProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[1200px] grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]',
        className,
      )}
      {...props}
    />
  )
}

type ClosedSubscriptionsTableProps = {
  loading?: boolean
  pagination: CursorPaginationState
  rows: CopyRunSummary[]
  onOpenSubscription: (subscription: CopyRunSummary) => void
}

const ClosedSubscriptionsTable = ({ loading, onOpenSubscription, pagination, rows }: ClosedSubscriptionsTableProps) => {
  const handleOpenSubscriptionKeyDown = (event: KeyboardEvent<HTMLElement>, subscription: CopyRunSummary) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpenSubscription(subscription)
    }
  }

  return (
    <Stack className="gap-2 lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:bg-buttonBlack-60">
      <div className="ks-scrollbar relative hidden max-h-[480px] overflow-auto lg:block">
        <ClosedSubscriptionsGrid header className="sticky top-0 z-[1]">
          <HeaderCell>Agent</HeaderCell>
          <HeaderCell className="justify-end text-right">Closed Trades</HeaderCell>
          <HeaderCell className="justify-end text-right">Started &amp; Stopped Time</HeaderCell>
          <HeaderCell className="justify-end text-right">Capital In</HeaderCell>
          <HeaderCell className="justify-end text-right">Current Balance</HeaderCell>
          <HeaderCell className="justify-end text-right">Realised P&amp;L</HeaderCell>
          <HeaderCell className="justify-end text-right">Fees Paid</HeaderCell>
          <HeaderCell className="justify-end text-right">Rebates</HeaderCell>
        </ClosedSubscriptionsGrid>

        <TableBody
          className="min-w-[1200px]"
          empty={!rows.length}
          emptyIconUrl={copyTradingStatIconMap.positionClose.iconUrl}
          emptyMessage={pagination.error ? 'Unable to load copy history' : 'No closed copies found'}
          loading={loading}
        >
          {rows.map(subscription => (
            <ClosedSubscriptionsGrid
              key={subscription.copyRunId}
              role="button"
              tabIndex={0}
              onClick={() => onOpenSubscription(subscription)}
              onKeyDown={event => handleOpenSubscriptionKeyDown(event, subscription)}
              className="cursor-pointer"
            >
              <CopyRunAgentCell run={subscription} className="px-3 py-2" />
              <TableCell className="text-right">
                {formatCount(subscription.closedPositionCount ?? subscription.openPositionCount)}
              </TableCell>
              <TableCell className="flex flex-col text-right text-subText">
                <span>{formatDateTime(subscription.startedAt)}</span>
                <span>{formatDateTime(subscription.stoppedAt)}</span>
              </TableCell>
              <TableCell className="text-right">{formatUsd(getDisplayCapitalInUsd(subscription))}</TableCell>
              <TableCell className="text-right">{formatUsd(subscription.portfolioValueUsd)}</TableCell>
              <TableCell
                className={cn('whitespace-nowrap text-right', getSignedMetricClassName(subscription.realizedPnlUsd))}
              >
                {signedUsd(subscription.realizedPnlUsd)}
              </TableCell>
              <TableCell className="text-right">{formatUsd(subscription.flatFeesCapturedUsd)}</TableCell>
              <TableCell className={cn('text-right', Number(subscription.cashbackReceivedUsd) > 0 && 'text-blue')}>
                {formatUsd(subscription.cashbackReceivedUsd)}
              </TableCell>
            </ClosedSubscriptionsGrid>
          ))}
        </TableBody>
      </div>

      <TableBody
        className="grid gap-2 bg-transparent lg:hidden"
        empty={!rows.length}
        emptyIconUrl={copyTradingStatIconMap.positionClose.iconUrl}
        emptyMessage={pagination.error ? 'Unable to load copy history' : 'No closed copies found'}
        loading={loading}
      >
        {rows.map(subscription => (
          <Stack
            key={subscription.copyRunId}
            role="button"
            tabIndex={0}
            className="cursor-pointer gap-3 rounded-xl bg-buttonBlack-60 p-3 outline-none transition-colors hover:bg-primary-10"
            onClick={() => onOpenSubscription(subscription)}
            onKeyDown={event => handleOpenSubscriptionKeyDown(event, subscription)}
          >
            <CopyRunAgentCell run={subscription} className="gap-3" />

            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              <TableCardField label="Closed Trades">
                {formatCount(subscription.closedPositionCount ?? subscription.openPositionCount)}
              </TableCardField>
              <TableCardField label="Capital In">{formatUsd(getDisplayCapitalInUsd(subscription))}</TableCardField>
              <TableCardField label="Current Balance">{formatUsd(subscription.portfolioValueUsd)}</TableCardField>
              <TableCardField
                label="Realised P&amp;L"
                valueClassName={cn('whitespace-nowrap', getSignedMetricClassName(subscription.realizedPnlUsd))}
              >
                {signedUsd(subscription.realizedPnlUsd)}
              </TableCardField>
              <TableCardField label="Fees Paid">{formatUsd(subscription.flatFeesCapturedUsd)}</TableCardField>
              <TableCardField
                label="Rebates"
                valueClassName={cn(Number(subscription.cashbackReceivedUsd) > 0 && 'text-blue')}
              >
                {formatUsd(subscription.cashbackReceivedUsd)}
              </TableCardField>
              <TableCardField label="Started" valueClassName="text-subText">
                {formatDateTime(subscription.startedAt)}
              </TableCardField>
              <TableCardField label="Stopped" valueClassName="text-subText">
                {formatDateTime(subscription.stoppedAt)}
              </TableCardField>
            </div>
          </Stack>
        ))}
      </TableBody>

      <div className="overflow-hidden rounded-xl lg:rounded-none">
        <CursorPagination {...pagination} />
      </div>
    </Stack>
  )
}

export default ClosedSubscriptionsTable

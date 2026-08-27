import { type HTMLAttributes } from 'react'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'
import type { CopyRunSortBy, SortOrder } from 'services/copyTrading/types/primitives'

import ScrollArea from 'components/ScrollArea'
import { Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import CursorPagination, { type CursorPaginationState } from 'pages/CopyTrading/components/CursorPagination'
import {
  HeaderCell,
  TableBody,
  TableCardField,
  TableCardGrid,
  TableCell,
  TableHeader,
  TableRow,
  TableRowLink,
} from 'pages/CopyTrading/components/Table'
import { CopyRunAgentCell } from 'pages/CopyTrading/components/common/agentIdentity'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import {
  formatCount,
  formatDisplayCapitalInUsd,
  formatUsd,
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
  sortBy?: CopyRunSortBy
  sortOrder?: SortOrder
  onSortChange: (sortBy: CopyRunSortBy) => void
}

const ClosedSubscriptionsTable = ({
  loading,
  onSortChange,
  pagination,
  rows,
  sortBy,
  sortOrder,
}: ClosedSubscriptionsTableProps) => {
  return (
    <Stack className="gap-2 lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:bg-buttonBlack-60">
      <ScrollArea className="relative hidden max-h-[480px] lg:block">
        <ClosedSubscriptionsGrid header className="sticky top-0 z-[1]">
          <HeaderCell>Agent</HeaderCell>
          <HeaderCell className="justify-end text-right">Closed Trades</HeaderCell>
          <HeaderCell className="justify-end text-right">Started &amp; Stopped Time</HeaderCell>
          <HeaderCell className="justify-end text-right">Capital In</HeaderCell>
          <HeaderCell className="justify-end text-right">Realised P&amp;L</HeaderCell>
          <HeaderCell className="justify-end text-right">Fees Paid</HeaderCell>
          <HeaderCell className="justify-end text-right">Rebates</HeaderCell>
          <HeaderCell
            activeSortBy={sortBy}
            className="justify-end text-right"
            onSortChange={onSortChange}
            sortField="current_balance"
            sortOrder={sortOrder}
          >
            Current Balance
          </HeaderCell>
        </ClosedSubscriptionsGrid>

        <TableBody
          className="min-w-[1200px]"
          empty={!rows.length}
          emptyIconUrl={copyTradingStatIconMap.positionClose.iconUrl}
          emptyMessage={pagination.error ? 'Unable to load copy history' : 'No closed copies found'}
          loading={loading}
        >
          {rows.map(subscription => (
            <ClosedSubscriptionsGrid key={subscription.copyRunId} className="relative cursor-pointer">
              <TableRowLink
                label={`View copy history for ${subscription.agentSnapshot?.displayName || 'agent'}`}
                to={`${APP_PATHS.COPY_TRADING}/history/${subscription.copyRunId}`}
              />
              <CopyRunAgentCell run={subscription} className="px-3 py-2" />
              <TableCell className="text-right">
                {formatCount(subscription.closedPositionCount ?? subscription.openPositionCount)}
              </TableCell>
              <TableCell className="flex flex-col text-right text-subText">
                <span>{formatDateTime(subscription.startedAt)}</span>
                <span>{formatDateTime(subscription.stoppedAt)}</span>
              </TableCell>
              <TableCell className="text-right">{formatDisplayCapitalInUsd(subscription)}</TableCell>
              <TableCell
                className={cn('whitespace-nowrap text-right', getSignedMetricClassName(subscription.realizedPnlUsd))}
              >
                {signedUsd(subscription.realizedPnlUsd)}
              </TableCell>
              <TableCell className={cn('text-right', getSignedMetricClassName(subscription.netFeeCostUsd))}>
                {signedUsd(subscription.netFeeCostUsd)}
              </TableCell>
              <TableCell className={cn('text-right', Number(subscription.cashbackReceivedUsd) > 0 && 'text-blue')}>
                {formatUsd(subscription.cashbackReceivedUsd)}
              </TableCell>
              <TableCell className="text-right">{formatUsd(subscription.currentBalanceUsd)}</TableCell>
            </ClosedSubscriptionsGrid>
          ))}
        </TableBody>
      </ScrollArea>

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
            className="relative cursor-pointer gap-3 rounded-xl bg-buttonBlack-60 p-3 outline-none transition-colors hover:bg-primary-10"
          >
            <TableRowLink
              label={`View copy history for ${subscription.agentSnapshot?.displayName || 'agent'}`}
              to={`${APP_PATHS.COPY_TRADING}/history/${subscription.copyRunId}`}
            />
            <CopyRunAgentCell run={subscription} className="gap-3" />

            <TableCardGrid>
              <TableCardField label="Closed Trades">
                {formatCount(subscription.closedPositionCount ?? subscription.openPositionCount)}
              </TableCardField>
              <TableCardField align="right" label="Capital In">
                {formatDisplayCapitalInUsd(subscription)}
              </TableCardField>
              <TableCardField label="Current Balance">{formatUsd(subscription.currentBalanceUsd)}</TableCardField>
              <TableCardField
                align="right"
                label="Realised P&amp;L"
                valueClassName={cn('whitespace-nowrap', getSignedMetricClassName(subscription.realizedPnlUsd))}
              >
                {signedUsd(subscription.realizedPnlUsd)}
              </TableCardField>
              <TableCardField label="Fees Paid" valueClassName={getSignedMetricClassName(subscription.netFeeCostUsd)}>
                {signedUsd(subscription.netFeeCostUsd)}
              </TableCardField>
              <TableCardField
                align="right"
                label="Rebates"
                valueClassName={cn(Number(subscription.cashbackReceivedUsd) > 0 && 'text-blue')}
              >
                {formatUsd(subscription.cashbackReceivedUsd)}
              </TableCardField>
              <TableCardField label="Started" valueClassName="text-subText">
                {formatDateTime(subscription.startedAt)}
              </TableCardField>
              <TableCardField align="right" label="Stopped" valueClassName="text-subText">
                {formatDateTime(subscription.stoppedAt)}
              </TableCardField>
            </TableCardGrid>
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

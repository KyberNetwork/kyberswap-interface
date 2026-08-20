import { type HTMLAttributes } from 'react'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'

import { Stack } from 'components/Stack'
import CursorPagination, { type CursorPaginationState } from 'pages/CopyTrading/components/CursorPagination'
import { HeaderCell, TableBody, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
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
  return (
    <Stack className="overflow-hidden rounded-xl bg-buttonBlack-60">
      <div className="ks-scrollbar relative max-h-[480px] overflow-auto">
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
          {rows.map(subscription => {
            return (
              <ClosedSubscriptionsGrid
                key={subscription.copyRunId}
                role="button"
                tabIndex={0}
                onClick={() => onOpenSubscription(subscription)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onOpenSubscription(subscription)
                  }
                }}
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
            )
          })}
        </TableBody>
      </div>
      <CursorPagination {...pagination} />
    </Stack>
  )
}

export default ClosedSubscriptionsTable

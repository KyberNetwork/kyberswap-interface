import { type HTMLAttributes } from 'react'
import type { CopyRunSummary } from 'services/copyTrading/types'

import { Stack } from 'components/Stack'
import InfiniteScroll, { type InfiniteScrollState } from 'pages/CopyTrading/components/InfiniteScroll'
import { HeaderCell, TableBody, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { CopyRunAgentCell, CopyRunStatusBadge } from 'pages/CopyTrading/components/common'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { formatDate, formatUsd, signedUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

type ClosedSubscriptionsGridProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

const ClosedSubscriptionsGrid = ({ header, className, ...props }: ClosedSubscriptionsGridProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[1360px] grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)]',
        className,
      )}
      {...props}
    />
  )
}

type ClosedSubscriptionsTableProps = {
  infiniteScroll: InfiniteScrollState
  loading?: boolean
  rows: CopyRunSummary[]
  onOpenSubscription: (subscription: CopyRunSummary) => void
}

const ClosedSubscriptionsTable = ({
  rows,
  infiniteScroll,
  loading,
  onOpenSubscription,
}: ClosedSubscriptionsTableProps) => {
  return (
    <Stack className="overflow-hidden rounded-xl bg-buttonBlack-60">
      <InfiniteScroll {...infiniteScroll}>
        <ClosedSubscriptionsGrid header className="sticky top-0 z-[1]">
          <HeaderCell>Agent</HeaderCell>
          <HeaderCell className="justify-end text-right">Closed Trades</HeaderCell>
          <HeaderCell className="justify-end text-right">Started</HeaderCell>
          <HeaderCell className="justify-end text-right">Stopped</HeaderCell>
          <HeaderCell className="justify-end text-right">Capital In</HeaderCell>
          <HeaderCell className="justify-end text-right">Capital Out</HeaderCell>
          <HeaderCell className="justify-end text-right">Realised P&amp;L</HeaderCell>
          <HeaderCell className="justify-end text-right">Fees Paid</HeaderCell>
          <HeaderCell className="justify-end text-right">Rebates</HeaderCell>
          <HeaderCell>Status</HeaderCell>
        </ClosedSubscriptionsGrid>

        <TableBody
          className="min-w-[1360px]"
          empty={!rows.length}
          emptyIconUrl={copyTradingStatIconMap.positionClose.iconUrl}
          emptyMessage="No closed copies found"
          loading={loading}
        >
          {rows.map(subscription => {
            const realizedPnl = signedUsd(subscription.realizedPnlUsd)

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
                  {subscription.closedPositionCount || subscription.openPositionCount}
                </TableCell>
                <TableCell className="text-right text-subText">{formatDate(subscription.startedAt)}</TableCell>
                <TableCell className="text-right text-subText">{formatDate(subscription.stoppedAt)}</TableCell>
                <TableCell className="text-right">{formatUsd(subscription.capitalInUsd)}</TableCell>
                <TableCell className="text-right">{formatUsd(subscription.capitalOutUsd)}</TableCell>
                <TableCell className={cn('text-right', realizedPnl.startsWith('-') ? 'text-red' : 'text-primary')}>
                  {realizedPnl}
                </TableCell>
                <TableCell className="text-right">{formatUsd(subscription.flatFeesCapturedUsd)}</TableCell>
                <TableCell className="text-right">{formatUsd(subscription.cashbackReceivedUsd)}</TableCell>
                <TableCell>
                  <CopyRunStatusBadge status={subscription.status} />
                </TableCell>
              </ClosedSubscriptionsGrid>
            )
          })}
        </TableBody>
      </InfiniteScroll>
    </Stack>
  )
}

export default ClosedSubscriptionsTable

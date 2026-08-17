import { type HTMLAttributes } from 'react'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'

import { ButtonLight } from 'components/Button'
import { Stack } from 'components/Stack'
import CursorPagination, { type CursorPaginationState } from 'pages/CopyTrading/components/CursorPagination'
import { HeaderCell, TableBody, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { CopyRunAgentCell } from 'pages/CopyTrading/components/common/agentIdentity'
import { CopyRunStatusBadge } from 'pages/CopyTrading/components/common/status'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import {
  compactUsd,
  formatCount,
  formatUsd,
  getAgentDisplayName,
  getPreparedReasonMessage,
  getSignedMetricClassName,
  getWinRateClassName,
  isActionAvailable,
  percent,
} from 'pages/CopyTrading/helpers'
import { useCopyTradingModal } from 'pages/CopyTrading/modals/context'
import { cn } from 'utils/cn'

type ActiveSubscriptionsGridProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

const ActiveSubscriptionsGrid = ({ header, className, ...props }: ActiveSubscriptionsGridProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[1120px] grid-cols-[minmax(0,2.4fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(132px,1.1fr)]',
        className,
      )}
      {...props}
    />
  )
}

type ActiveSubscriptionsTableProps = {
  loading?: boolean
  pagination: CursorPaginationState
  rows: CopyRunSummary[]
  onOpenSubscription: (subscription: CopyRunSummary) => void
}

const ActiveSubscriptionsTable = ({ rows, loading, pagination, onOpenSubscription }: ActiveSubscriptionsTableProps) => {
  const { openStopCopy } = useCopyTradingModal()

  return (
    <Stack className="overflow-hidden rounded-xl bg-buttonBlack-60">
      <div className="ks-scrollbar relative max-h-[480px] overflow-auto">
        <ActiveSubscriptionsGrid header className="sticky top-0 z-[1]">
          <HeaderCell>Agent</HeaderCell>
          <HeaderCell className="justify-end text-right">Agent APR</HeaderCell>
          <HeaderCell className="justify-end text-right">Win Rates</HeaderCell>
          <HeaderCell className="justify-end text-right">Volume</HeaderCell>
          <HeaderCell className="justify-end text-right">Capital In</HeaderCell>
          <HeaderCell className="justify-end text-right">Positions</HeaderCell>
          <HeaderCell>Status</HeaderCell>
          <TableCell />
        </ActiveSubscriptionsGrid>

        <TableBody
          className="min-w-[1120px]"
          empty={!rows.length}
          emptyIconUrl={copyTradingStatIconMap.agents.iconUrl}
          emptyMessage={pagination.error ? 'Unable to load active copies' : 'No active copies found'}
          loading={loading}
        >
          {rows.map(subscription => {
            const actionAvailable = isActionAvailable(subscription.stopCopyAvailability)

            return (
              <ActiveSubscriptionsGrid
                key={subscription.copyRunId}
                role="button"
                tabIndex={0}
                onClick={event => {
                  if ((event.target as HTMLElement).closest('button')) return
                  onOpenSubscription(subscription)
                }}
                onKeyDown={event => {
                  if ((event.target as HTMLElement).closest('button')) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onOpenSubscription(subscription)
                  }
                }}
                className="cursor-pointer"
              >
                <CopyRunAgentCell run={subscription} className="px-3 py-2" />
                <TableCell className={cn('text-right', getSignedMetricClassName(subscription.agentStats.apr30dPct))}>
                  {percent(subscription.agentStats.apr30dPct)}
                </TableCell>
                <TableCell className={cn('text-right', getWinRateClassName(subscription.agentStats.winRatePct))}>
                  {percent(subscription.agentStats.winRatePct)}
                </TableCell>
                <TableCell className="text-right">{compactUsd(subscription.agentStats.volumeUsd)}</TableCell>
                <TableCell className="text-right">{formatUsd(subscription.capitalInUsd)}</TableCell>
                <TableCell className="text-right">{formatCount(subscription.openPositionCount)}</TableCell>
                <TableCell>
                  <CopyRunStatusBadge status={subscription.status} />
                </TableCell>
                <TableCell className="flex justify-end">
                  <ButtonLight
                    type="button"
                    padding="8px 12px"
                    color="var(--ks-warning)"
                    className="whitespace-nowrap"
                    disabled={!actionAvailable}
                    title={
                      !actionAvailable ? getPreparedReasonMessage(subscription.stopCopyAvailability?.reason) : undefined
                    }
                    onClick={() => openStopCopy(subscription, getAgentDisplayName(subscription.agentSnapshot))}
                  >
                    Stop Copying
                  </ButtonLight>
                </TableCell>
              </ActiveSubscriptionsGrid>
            )
          })}
        </TableBody>
      </div>
      <CursorPagination {...pagination} />
    </Stack>
  )
}

export default ActiveSubscriptionsTable

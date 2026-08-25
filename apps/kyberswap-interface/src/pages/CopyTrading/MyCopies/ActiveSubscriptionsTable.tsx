import { type HTMLAttributes, type KeyboardEvent, type MouseEvent } from 'react'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'
import type { CopyRunSortBy, SortOrder } from 'services/copyTrading/types/primitives'

import { ButtonLight } from 'components/Button'
import ScrollArea from 'components/ScrollArea'
import { Stack } from 'components/Stack'
import CursorPagination, { type CursorPaginationState } from 'pages/CopyTrading/components/CursorPagination'
import {
  HeaderCell,
  TableBody,
  TableCardField,
  TableCardGrid,
  TableCell,
  TableHeader,
  TableRow,
} from 'pages/CopyTrading/components/Table'
import { CopyRunAgentCell } from 'pages/CopyTrading/components/common/agentIdentity'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import {
  canAttemptPreparation,
  compactUsd,
  formatCount,
  formatDisplayCapitalInUsd,
  getAgentDisplayName,
  getPreparedReasonMessage,
  getSignedMetricClassName,
  getWinRateClassName,
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
        'min-w-[1120px] grid-cols-[minmax(0,2.4fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(132px,1.1fr)]',
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
  sortBy?: CopyRunSortBy
  sortOrder?: SortOrder
  onSortChange: (sortBy: CopyRunSortBy) => void
  onOpenSubscription: (subscription: CopyRunSummary) => void
}

const ActiveSubscriptionsTable = ({
  rows,
  loading,
  pagination,
  sortBy,
  sortOrder,
  onSortChange,
  onOpenSubscription,
}: ActiveSubscriptionsTableProps) => {
  const { openStopCopy } = useCopyTradingModal()

  const handleOpenSubscription = (event: MouseEvent<HTMLElement>, subscription: CopyRunSummary) => {
    if ((event.target as HTMLElement).closest('button')) return
    onOpenSubscription(subscription)
  }

  const handleOpenSubscriptionKeyDown = (event: KeyboardEvent<HTMLElement>, subscription: CopyRunSummary) => {
    if ((event.target as HTMLElement).closest('button')) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpenSubscription(subscription)
    }
  }

  const renderStopCopyButton = (subscription: CopyRunSummary) => {
    const actionAvailable = canAttemptPreparation(subscription.stopCopyAvailability)

    return (
      <ButtonLight
        type="button"
        padding="8px 12px"
        color="var(--ks-red)"
        className="whitespace-nowrap"
        disabled={!actionAvailable}
        title={!actionAvailable ? getPreparedReasonMessage(subscription.stopCopyAvailability?.reason) : undefined}
        onClick={() => openStopCopy(subscription, getAgentDisplayName(subscription.agentSnapshot))}
      >
        Stop Copying
      </ButtonLight>
    )
  }

  return (
    <Stack className="gap-2 lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:bg-buttonBlack-60">
      <ScrollArea className="relative hidden max-h-[480px] lg:block">
        <ActiveSubscriptionsGrid header className="sticky top-0 z-[1]">
          <HeaderCell>Agent</HeaderCell>
          <HeaderCell
            activeSortBy={sortBy}
            className="justify-end text-right"
            onSortChange={onSortChange}
            sortField="agent_apr_30d"
            sortOrder={sortOrder}
          >
            Agent APR
          </HeaderCell>
          <HeaderCell
            activeSortBy={sortBy}
            className="justify-end text-right"
            onSortChange={onSortChange}
            sortField="agent_win_rate"
            sortOrder={sortOrder}
          >
            Win Rates
          </HeaderCell>
          <HeaderCell
            activeSortBy={sortBy}
            className="justify-end text-right"
            onSortChange={onSortChange}
            sortField="agent_volume"
            sortOrder={sortOrder}
          >
            Volume
          </HeaderCell>
          <HeaderCell
            activeSortBy={sortBy}
            className="justify-end text-right"
            onSortChange={onSortChange}
            sortField="capital_in"
            sortOrder={sortOrder}
          >
            Capital In
          </HeaderCell>
          <HeaderCell className="justify-end text-right">Positions</HeaderCell>
          <TableCell />
        </ActiveSubscriptionsGrid>

        <TableBody
          className="min-w-[1120px]"
          empty={!rows.length}
          emptyIconUrl={copyTradingStatIconMap.agents.iconUrl}
          emptyMessage={pagination.error ? 'Unable to load active copies' : 'No active copies found'}
          loading={loading}
        >
          {rows.map(subscription => (
            <ActiveSubscriptionsGrid
              key={subscription.copyRunId}
              role="button"
              tabIndex={0}
              onClick={event => handleOpenSubscription(event, subscription)}
              onKeyDown={event => handleOpenSubscriptionKeyDown(event, subscription)}
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
              <TableCell className="text-right">{formatDisplayCapitalInUsd(subscription)}</TableCell>
              <TableCell className="text-right">{formatCount(subscription.openPositionCount)}</TableCell>
              <TableCell className="flex justify-end">{renderStopCopyButton(subscription)}</TableCell>
            </ActiveSubscriptionsGrid>
          ))}
        </TableBody>
      </ScrollArea>

      <TableBody
        className="grid gap-2 bg-transparent lg:hidden"
        empty={!rows.length}
        emptyIconUrl={copyTradingStatIconMap.agents.iconUrl}
        emptyMessage={pagination.error ? 'Unable to load active copies' : 'No active copies found'}
        loading={loading}
      >
        {rows.map(subscription => (
          <Stack
            key={subscription.copyRunId}
            role="button"
            tabIndex={0}
            className="cursor-pointer gap-3 rounded-xl bg-buttonBlack-60 p-3 outline-none transition-colors hover:bg-primary-10"
            onClick={event => handleOpenSubscription(event, subscription)}
            onKeyDown={event => handleOpenSubscriptionKeyDown(event, subscription)}
          >
            <CopyRunAgentCell run={subscription} className="gap-3" />

            <TableCardGrid>
              <TableCardField
                label="Agent APR"
                valueClassName={getSignedMetricClassName(subscription.agentStats.apr30dPct)}
              >
                {percent(subscription.agentStats.apr30dPct)}
              </TableCardField>
              <TableCardField
                align="right"
                label="Win Rate"
                valueClassName={getWinRateClassName(subscription.agentStats.winRatePct)}
              >
                {percent(subscription.agentStats.winRatePct)}
              </TableCardField>
              <TableCardField label="Volume">{compactUsd(subscription.agentStats.volumeUsd)}</TableCardField>
              <TableCardField align="right" label="Capital In">
                {formatDisplayCapitalInUsd(subscription)}
              </TableCardField>
              <TableCardField span="full" label="Positions">
                {formatCount(subscription.openPositionCount)}
              </TableCardField>
            </TableCardGrid>

            {renderStopCopyButton(subscription)}
          </Stack>
        ))}
      </TableBody>

      <div className="overflow-hidden rounded-xl lg:rounded-none">
        <CursorPagination {...pagination} />
      </div>
    </Stack>
  )
}

export default ActiveSubscriptionsTable

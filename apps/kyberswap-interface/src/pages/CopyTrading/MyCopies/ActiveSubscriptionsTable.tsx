import { type HTMLAttributes, useState } from 'react'
import copyTradingApi from 'services/copyTrading'
import type { CopyRunSummary, PositionSummary } from 'services/copyTrading/types'

import { ButtonLight } from 'components/Button'
import { Stack } from 'components/Stack'
import CursorPagination, { type CursorPaginationState } from 'pages/CopyTrading/components/CursorPagination'
import { HeaderCell, TableBody, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { CopyRunAgentCell, CopyRunStatusBadge } from 'pages/CopyTrading/components/common'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { compactUsd, formatCount, formatUsd, getAgentDisplayName, percent } from 'pages/CopyTrading/helpers'
import { useCopyTradeWrite } from 'pages/CopyTrading/write/WriteContext'
import { getApiErrorMessage, getPreparedReasonMessage, isActionAvailable } from 'pages/CopyTrading/write/preparedAction'
import { cn } from 'utils/cn'

type ActiveSubscriptionsGridProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

const ActiveSubscriptionsGrid = ({ header, className, ...props }: ActiveSubscriptionsGridProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[1120px] grid-cols-[minmax(0,2.4fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,1.1fr)]',
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
  const { openStopCopy } = useCopyTradeWrite()
  const [getCopyRunPositions] = copyTradingApi.useLazyGetCopyRunPositionsQuery()
  const [loadingStopCopyRunId, setLoadingStopCopyRunId] = useState<string>()
  const [stopCopyError, setStopCopyError] = useState<{ copyRunId: string; message: string }>()

  const loadOpenPositions = async (subscription: CopyRunSummary) => {
    const positions: PositionSummary[] = []
    let cursor: string | undefined

    while (true) {
      const response = await getCopyRunPositions({
        ownerAddress: subscription.ownerAddress,
        copyRunId: subscription.copyRunId,
        status: 'open',
        cursor,
        limit: 100,
      }).unwrap()
      positions.push(...response.data)

      if (!response.pagination.hasMore) return positions
      const nextCursor = response.pagination.nextCursor
      if (!nextCursor || nextCursor === cursor) {
        throw new Error('The positions response returned an invalid pagination cursor.')
      }
      cursor = nextCursor
    }
  }

  const handleStopCopy = async (subscription: CopyRunSummary) => {
    setLoadingStopCopyRunId(subscription.copyRunId)
    setStopCopyError(undefined)
    try {
      const positions = await loadOpenPositions(subscription)
      openStopCopy(subscription, positions, getAgentDisplayName(subscription.agentSnapshot))
    } catch (error) {
      setStopCopyError({ copyRunId: subscription.copyRunId, message: getApiErrorMessage(error) })
    } finally {
      setLoadingStopCopyRunId(undefined)
    }
  }

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
            const loadingPositions = loadingStopCopyRunId === subscription.copyRunId
            const actionError = stopCopyError?.copyRunId === subscription.copyRunId ? stopCopyError.message : undefined

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
                <TableCell className="text-right text-primary">{percent(subscription.agentStats.apr30dPct)}</TableCell>
                <TableCell className="text-right">{percent(subscription.agentStats.winRatePct)}</TableCell>
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
                    disabled={!actionAvailable || !!loadingStopCopyRunId}
                    title={
                      !actionAvailable
                        ? getPreparedReasonMessage(subscription.stopCopyAvailability?.reason)
                        : actionError
                    }
                    onClick={() => void handleStopCopy(subscription)}
                  >
                    {loadingPositions ? 'Loading positions…' : actionError ? 'Retry Stop Copying' : 'Stop Copying'}
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

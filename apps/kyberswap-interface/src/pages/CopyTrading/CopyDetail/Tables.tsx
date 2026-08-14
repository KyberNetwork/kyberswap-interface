import type { HTMLAttributes } from 'react'
import type { ActivityRow, PositionActionKind, PositionSummary } from 'services/copyTrading/types'

import { ButtonLight } from 'components/Button'
import { Stack } from 'components/Stack'
import InfiniteScroll, { type InfiniteScrollState } from 'pages/CopyTrading/components/InfiniteScroll'
import { HeaderCell, TableBody, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { PositionLifecycleBadge, ShortenedId } from 'pages/CopyTrading/components/common'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { formatApproximateUsd, formatUsd, getActivityLabel, signedPercent, signedUsd } from 'pages/CopyTrading/helpers'
import { useCopyTradingModal } from 'pages/CopyTrading/modals/context'
import { cn } from 'utils/cn'
import { formatDateTime } from 'utils/time'

type TableGridWrapperProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

const TradeHistoryGrid = ({ header, className, ...props }: TableGridWrapperProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[1320px] grid-cols-[minmax(0,0.9fr)_minmax(0,0.75fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(0,1.25fr)_minmax(0,0.8fr)] gap-x-4',
        !header && 'px-4 py-1',
        className,
      )}
      {...props}
    />
  )
}

const CopyPositionsGrid = ({ header, className, ...props }: TableGridWrapperProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[1120px] grid-cols-[minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(0,0.85fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(144px,1.1fr)] gap-x-3',
        !header && 'px-4 py-1',
        className,
      )}
      {...props}
    />
  )
}

const ActivityGrid = ({ header, className, ...props }: TableGridWrapperProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[900px] grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)]',
        className,
      )}
      {...props}
    />
  )
}

type PositionTableProps = {
  infiniteScroll: InfiniteScrollState
  loading?: boolean
  rows: PositionSummary[]
}

type ActivityTableProps = {
  infiniteScroll: InfiniteScrollState
  loading?: boolean
  rows: ActivityRow[]
}

const activityColor = (activity: ActivityRow) => {
  if (activity.activityType.includes('failed') || activity.activityType.includes('skipped')) return 'text-warning'
  if (activity.activityType === 'copy_stopped') return 'text-red'
  if (activity.activityType.includes('closed') || activity.activityType.includes('succeeded')) return 'text-primary'
  return 'text-text'
}

const formatDuration = (durationSeconds?: string, openedAt?: string, closedAt?: string) => {
  const apiDuration = Number(durationSeconds)
  if (durationSeconds !== undefined && Number.isFinite(apiDuration)) {
    const totalMinutes = Math.max(0, Math.floor(apiDuration / 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return hours ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  if (!openedAt) return '-'
  if (!closedAt) return '-'

  const durationMs = new Date(closedAt).getTime() - new Date(openedAt).getTime()
  if (Number.isNaN(durationMs)) return '-'

  const totalMinutes = Math.max(0, Math.floor(durationMs / 60_000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return hours ? `${hours}h ${minutes}m` : `${minutes}m`
}

const actionLabels: Partial<Record<PositionActionKind, string>> = {
  POSITION_ACTION_KIND_MANUAL_SELL: 'Manual Sell',
  POSITION_ACTION_KIND_CLOSE_POSITION: 'Close position',
}

const PositionAction = ({ position }: { position: PositionSummary }) => {
  const { openManagePosition } = useCopyTradingModal()
  const availableAction =
    position.actionKind && position.actionKind !== 'POSITION_ACTION_KIND_UNSPECIFIED'
      ? position.actionKind
      : position.availableActionKinds.find(kind => kind !== 'POSITION_ACTION_KIND_UNSPECIFIED')
  const label = availableAction && actionLabels[availableAction]
  if (!label) return null

  const isClose = availableAction === 'POSITION_ACTION_KIND_CLOSE_POSITION'
  const color = isClose ? 'var(--ks-red)' : 'var(--ks-warning)'

  return (
    <ButtonLight
      type="button"
      padding="7px 12px"
      color={color}
      className="whitespace-nowrap"
      onClick={event => {
        event.stopPropagation()
        openManagePosition(position, isClose ? 'close' : 'sell')
      }}
    >
      {label}
    </ButtonLight>
  )
}

export const TradeHistoryTable = ({ infiniteScroll, loading, rows }: PositionTableProps) => (
  <Stack>
    <InfiniteScroll {...infiniteScroll}>
      <TradeHistoryGrid header className="sticky top-0 z-[1]">
        <HeaderCell>Trade ID</HeaderCell>
        <HeaderCell>Token</HeaderCell>
        <HeaderCell>Entry Price</HeaderCell>
        <HeaderCell>Exit</HeaderCell>
        <HeaderCell>P&amp;L</HeaderCell>
        <HeaderCell>Fee</HeaderCell>
        <HeaderCell>Rebate</HeaderCell>
        <HeaderCell>Net Cost</HeaderCell>
        <HeaderCell>Opened</HeaderCell>
        <HeaderCell>Closed</HeaderCell>
        <HeaderCell>Duration</HeaderCell>
      </TradeHistoryGrid>
      <TableBody
        className="min-w-[1320px]"
        empty={!rows.length}
        emptyIconUrl={copyTradingStatIconMap.positionClose.iconUrl}
        emptyMessage="No closed positions found"
        loading={loading}
      >
        {rows.map(row => {
          const isNegative = Number(row.realizedPnlUsd || 0) < 0

          return (
            <TradeHistoryGrid key={row.positionId}>
              <TableCell className="text-subText">
                <ShortenedId value={row.tradeId} />
              </TableCell>
              <TableCell>{row.token.symbol || '—'}</TableCell>
              <TableCell>{formatUsd(row.entryPriceUsd)}</TableCell>
              <TableCell>{formatUsd(row.exitPriceUsd || row.currentPriceUsd)}</TableCell>
              <TableCell className={cn(isNegative ? 'text-red' : 'text-primary')}>
                {signedUsd(row.realizedPnlUsd)}
              </TableCell>
              <TableCell>{formatUsd(row.flatFeeCapturedUsd)}</TableCell>
              <TableCell>{formatUsd(row.cashbackReceivedUsd)}</TableCell>
              <TableCell>{formatUsd(row.netFeeCostUsd)}</TableCell>
              <TableCell className="text-subText">{formatDateTime(row.openedAt)}</TableCell>
              <TableCell className="text-subText">{formatDateTime(row.closedAt)}</TableCell>
              <TableCell className="text-subText">
                {formatDuration(row.durationSeconds, row.openedAt, row.closedAt)}
              </TableCell>
            </TradeHistoryGrid>
          )
        })}
      </TableBody>
    </InfiniteScroll>
  </Stack>
)

export const CopyPositionsTable = ({ infiniteScroll, loading, rows }: PositionTableProps) => (
  <Stack>
    <InfiniteScroll {...infiniteScroll}>
      <CopyPositionsGrid header className="sticky top-0 z-[1]">
        <HeaderCell>Trade ID</HeaderCell>
        <HeaderCell>Token</HeaderCell>
        <HeaderCell>Entry Price</HeaderCell>
        <HeaderCell>Current</HeaderCell>
        <HeaderCell>Value</HeaderCell>
        <HeaderCell>Unrealised P&amp;L</HeaderCell>
        <HeaderCell>Est. Rebate</HeaderCell>
        <HeaderCell>Open Since</HeaderCell>
        <HeaderCell>Status</HeaderCell>
        <HeaderCell>Action</HeaderCell>
      </CopyPositionsGrid>
      <TableBody
        className="min-w-[1120px]"
        empty={!rows.length}
        emptyIconUrl={copyTradingStatIconMap.positionOpen.iconUrl}
        emptyMessage="No open positions found"
        loading={loading}
      >
        {rows.map(row => {
          const isNegative = Number(row.unrealizedPnlUsd || 0) < 0

          return (
            <CopyPositionsGrid key={row.positionId}>
              <TableCell className="text-subText">
                <ShortenedId value={row.tradeId} />
              </TableCell>
              <TableCell>{row.token.symbol || '—'}</TableCell>
              <TableCell>{formatUsd(row.entryPriceUsd)}</TableCell>
              <TableCell>{formatUsd(row.currentPriceUsd)}</TableCell>
              <TableCell>{formatUsd(row.valueUsd)}</TableCell>
              <TableCell className={cn(isNegative ? 'text-red' : 'text-primary')}>
                <Stack className="gap-0.5">
                  <span>{signedUsd(row.unrealizedPnlUsd)}</span>
                  <span className="text-xs">{signedPercent(row.unrealizedPnlPct)}</span>
                </Stack>
              </TableCell>
              <TableCell className="text-warning">{formatApproximateUsd(row.estimatedCashbackUsd)}</TableCell>
              <TableCell className="text-subText">{formatDateTime(row.openedAt)}</TableCell>
              <TableCell>
                <PositionLifecycleBadge lifecycle={row.lifecycle} quantityState={row.quantityState} />
              </TableCell>
              <TableCell>
                <PositionAction position={row} />
              </TableCell>
            </CopyPositionsGrid>
          )
        })}
      </TableBody>
    </InfiniteScroll>
  </Stack>
)

export const ActionLogsTable = ({ infiniteScroll, loading, rows }: ActivityTableProps) => (
  <Stack>
    <InfiniteScroll {...infiniteScroll}>
      <ActivityGrid header className="sticky top-0 z-[1]">
        <HeaderCell>Trade ID</HeaderCell>
        <HeaderCell>Type</HeaderCell>
        <HeaderCell>Details</HeaderCell>
        <HeaderCell>Tx Hash</HeaderCell>
        <HeaderCell>Time</HeaderCell>
      </ActivityGrid>
      <TableBody className="min-w-[900px]" empty={!rows.length} emptyMessage="No action logs found" loading={loading}>
        {rows.map(row => (
          <ActivityGrid key={row.activityId}>
            <TableCell className="text-subText">
              <ShortenedId value={row.tradeId} />
            </TableCell>
            <TableCell className={activityColor(row)}>{getActivityLabel(row)}</TableCell>
            <TableCell>{row.summary || '—'}</TableCell>
            <TableCell className="text-subText">
              <ShortenedId value={row.txHash} />
            </TableCell>
            <TableCell className="text-subText">{formatDateTime(row.occurredAt)}</TableCell>
          </ActivityGrid>
        ))}
      </TableBody>
    </InfiniteScroll>
  </Stack>
)

import type { HTMLAttributes } from 'react'
import { AlertCircle, AlertTriangle } from 'react-feather'
import type { PositionActionKind, PositionSummary } from 'services/copyTrading/types'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import { HStack, Stack } from 'components/Stack'
import { HeaderCell, TableBody, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { formatDate, formatUsd, signedPercent, signedUsd } from 'pages/CopyTrading/helpers'
import { useCopyTradeWrite } from 'pages/CopyTrading/write/WriteContext'
import { cn } from 'utils/cn'

type TableGridWrapperProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

const TradeHistoryGrid = ({ header, className, ...props }: TableGridWrapperProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[1320px] grid-cols-[minmax(0,0.9fr)_minmax(0,0.75fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(0,1.25fr)_minmax(0,0.8fr)] gap-x-4 px-4 py-1',
        header && 'border-b-0 tracking-[0.04em]',
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
        'min-w-[1120px] grid-cols-[minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(0,0.85fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.1fr)] gap-x-3 px-4 py-1',
        header && 'border-b-0 tracking-[0.04em]',
        className,
      )}
      {...props}
    />
  )
}

type PositionTableProps = {
  loading?: boolean
  rows: PositionSummary[]
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

const PositionStatus = ({ status }: { status?: string }) => {
  const normalizedStatus = status?.toLowerCase() || 'active'

  if (normalizedStatus.includes('closing')) {
    return (
      <HStack className="w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-blue/10 px-2.5 py-1 text-xs font-medium text-blue">
        <Loader size="12px" />
        <span>{status}</span>
      </HStack>
    )
  }

  if (normalizedStatus.includes('skipped')) {
    const repeated = Number.parseInt(normalizedStatus, 10) > 1
    const StatusIcon = repeated ? AlertCircle : AlertTriangle

    return (
      <HStack
        className={cn(
          'w-fit items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium',
          repeated ? 'bg-red-20 text-red' : 'bg-warning-20 text-warning',
        )}
      >
        <StatusIcon size={12} />
        <span>{status}</span>
      </HStack>
    )
  }

  return (
    <span className="inline-flex rounded-full bg-primary-12 px-4 py-1 text-xs font-medium text-primary">Active</span>
  )
}

const actionLabels: Partial<Record<PositionActionKind, string>> = {
  POSITION_ACTION_KIND_MANUAL_SELL: 'Manual Sell',
  POSITION_ACTION_KIND_CLOSE_POSITION: 'Close position',
}

const PositionAction = ({ position }: { position: PositionSummary }) => {
  const { openManagePosition } = useCopyTradeWrite()
  const availableAction =
    position.actionKind && position.actionKind !== 'POSITION_ACTION_KIND_UNSPECIFIED'
      ? position.actionKind
      : position.availableActionKinds.find(kind => kind !== 'POSITION_ACTION_KIND_UNSPECIFIED')
  const label = availableAction && actionLabels[availableAction]
  if (!label) return null

  const isClose = availableAction === 'POSITION_ACTION_KIND_CLOSE_POSITION'
  const Button = isClose ? ButtonPrimary : ButtonLight

  return (
    <Button
      type="button"
      padding="7px 12px"
      className="whitespace-nowrap"
      onClick={event => {
        event.stopPropagation()
        openManagePosition(position, isClose ? 'close' : 'sell')
      }}
    >
      {label}
    </Button>
  )
}

export const TradeHistoryTable = ({ loading, rows }: PositionTableProps) => (
  <Stack>
    <TradeHistoryGrid header>
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
      empty={!rows.length}
      emptyIconUrl={copyTradingStatIconMap.positionClose.iconUrl}
      emptyMessage="No closed positions found"
      loading={loading}
    >
      {rows.map(row => {
        const isNegative = Number(row.realizedPnlUsd || 0) < 0

        return (
          <TradeHistoryGrid key={row.positionId}>
            <TableCell className="text-subText">{row.tradeId}</TableCell>
            <TableCell>{row.token.symbol || '—'}</TableCell>
            <TableCell>{formatUsd(row.entryPriceUsd)}</TableCell>
            <TableCell>{formatUsd(row.exitPriceUsd || row.currentPriceUsd)}</TableCell>
            <TableCell className={cn(isNegative ? 'text-red' : 'text-primary')}>
              {signedUsd(row.realizedPnlUsd)}
            </TableCell>
            <TableCell>{formatUsd(row.flatFeeCapturedUsd)}</TableCell>
            <TableCell>{formatUsd(row.cashbackReceivedUsd)}</TableCell>
            <TableCell>{formatUsd(row.netFeeCostUsd)}</TableCell>
            <TableCell className="text-subText">{formatDate(row.openedAt)}</TableCell>
            <TableCell className="text-subText">{formatDate(row.closedAt)}</TableCell>
            <TableCell className="text-subText">
              {formatDuration(row.durationSeconds, row.openedAt, row.closedAt)}
            </TableCell>
          </TradeHistoryGrid>
        )
      })}
    </TableBody>
  </Stack>
)

export const CopyPositionsTable = ({ loading, rows }: PositionTableProps) => (
  <Stack>
    <CopyPositionsGrid header>
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
      empty={!rows.length}
      emptyIconUrl={copyTradingStatIconMap.positionOpen.iconUrl}
      emptyMessage="No open positions found"
      loading={loading}
    >
      {rows.map(row => {
        const isNegative = Number(row.unrealizedPnlUsd || 0) < 0

        return (
          <CopyPositionsGrid key={row.positionId}>
            <TableCell className="text-subText">{row.tradeId}</TableCell>
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
            <TableCell className="text-warning">~{formatUsd(row.estimatedCashbackUsd)}</TableCell>
            <TableCell className="text-subText">{formatDate(row.openedAt)}</TableCell>
            <TableCell>
              <PositionStatus status={row.trackingStatus} />
            </TableCell>
            <TableCell>
              <PositionAction position={row} />
            </TableCell>
          </CopyPositionsGrid>
        )
      })}
    </TableBody>
  </Stack>
)

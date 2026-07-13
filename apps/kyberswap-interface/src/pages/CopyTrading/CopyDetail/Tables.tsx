import type { HTMLAttributes } from 'react'
import { AlertCircle, AlertTriangle } from 'react-feather'
import type { PositionSummary } from 'services/copyTrading/types'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import { HStack, Stack } from 'components/Stack'
import { HeaderCell, TableBody, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { formatDate, formatUsd, signedPercent, signedUsd } from 'pages/CopyTrading/helpers'
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

const formatDuration = (openedAt: string, closedAt?: string) => {
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

const PositionAction = ({ status }: { status?: string }) => {
  const normalizedStatus = status?.toLowerCase() || ''
  if (!normalizedStatus.includes('skipped')) return null

  const repeated = Number.parseInt(normalizedStatus, 10) > 1
  const Button = repeated ? ButtonPrimary : ButtonLight

  return (
    <Button type="button" padding="7px 12px" className="whitespace-nowrap" onClick={event => event.stopPropagation()}>
      {repeated ? 'Close position' : 'Manual Sell'}
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
            <TableCell>{row.token.symbol}</TableCell>
            <TableCell>{formatUsd(row.entryPriceUsd)}</TableCell>
            <TableCell>{formatUsd(row.exitPriceUsd || row.currentPriceUsd)}</TableCell>
            <TableCell className={cn(isNegative ? 'text-red' : 'text-primary')}>
              {signedUsd(row.realizedPnlUsd)}
            </TableCell>
            <TableCell>{formatUsd(row.feeUsd)}</TableCell>
            <TableCell>{formatUsd(row.rebateUsd)}</TableCell>
            <TableCell>{formatUsd(row.valueUsd)}</TableCell>
            <TableCell className="text-subText">{formatDate(row.openedAt)}</TableCell>
            <TableCell className="text-subText">{formatDate(row.closedAt)}</TableCell>
            <TableCell className="text-subText">{formatDuration(row.openedAt, row.closedAt)}</TableCell>
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
            <TableCell>{row.token.symbol}</TableCell>
            <TableCell>{formatUsd(row.entryPriceUsd)}</TableCell>
            <TableCell>{formatUsd(row.currentPriceUsd)}</TableCell>
            <TableCell>{formatUsd(row.valueUsd)}</TableCell>
            <TableCell className={cn(isNegative ? 'text-red' : 'text-primary')}>
              <Stack className="gap-0.5">
                <span>{signedUsd(row.unrealizedPnlUsd)}</span>
                <span className="text-xs">{signedPercent(row.unrealizedPnlPct)}</span>
              </Stack>
            </TableCell>
            <TableCell className="text-warning">~{formatUsd(row.rebateUsd)}</TableCell>
            <TableCell className="text-subText">{formatDate(row.openedAt)}</TableCell>
            <TableCell>
              <PositionStatus status={row.trackingStatus} />
            </TableCell>
            <TableCell>
              <PositionAction status={row.trackingStatus} />
            </TableCell>
          </CopyPositionsGrid>
        )
      })}
    </TableBody>
  </Stack>
)

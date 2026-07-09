import type { HTMLAttributes } from 'react'
import type { PositionSummary } from 'services/copyTrading/types'

import { HStack, Stack } from 'components/Stack'
import { TableBody, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { formatDate, formatTokenAmount, formatUsd, signedPercent, signedUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

type TableGridWrapperProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

const TradeHistoryGrid = ({ header, className, ...props }: TableGridWrapperProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)] gap-x-4 px-4 py-1',
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
        'grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.4fr)] gap-x-4 px-4 py-1',
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

export const TradeHistoryTable = ({ loading, rows }: PositionTableProps) => (
  <Stack>
    <TradeHistoryGrid header>
      {['Trade ID', 'Token', 'Entry Price', 'Exit', 'Amount', 'Realised P&L', 'Fee', 'Cash Back', 'Closed'].map(
        item => (
          <TableCell key={item}>{item}</TableCell>
        ),
      )}
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
            <TableCell>{formatTokenAmount(row.amountDecimal)}</TableCell>
            <TableCell className={cn(isNegative ? 'text-red' : 'text-primary')}>
              {signedUsd(row.realizedPnlUsd)}
            </TableCell>
            <TableCell>{formatUsd(row.feeUsd)}</TableCell>
            <TableCell>{formatUsd(row.rebateUsd)}</TableCell>
            <TableCell className="text-subText">{formatDate(row.closedAt)}</TableCell>
          </TradeHistoryGrid>
        )
      })}
    </TableBody>
  </Stack>
)

export const CopyPositionsTable = ({ loading, rows }: PositionTableProps) => (
  <Stack>
    <CopyPositionsGrid header>
      {['Trade ID', 'Token', 'Entry Price', 'Current', 'Value', 'Unrealised P&L', 'Est. Rebate', 'Open Since'].map(
        item => (
          <TableCell key={item}>{item}</TableCell>
        ),
      )}
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
              <HStack className="items-center gap-2">
                <span>{signedUsd(row.unrealizedPnlUsd)}</span>
                <span className="text-xs">{signedPercent(row.unrealizedPnlPct)}</span>
              </HStack>
            </TableCell>
            <TableCell className="text-warning">{formatUsd(row.rebateUsd)}</TableCell>
            <TableCell className="text-subText">{formatDate(row.openedAt)}</TableCell>
          </CopyPositionsGrid>
        )
      })}
    </TableBody>
  </Stack>
)

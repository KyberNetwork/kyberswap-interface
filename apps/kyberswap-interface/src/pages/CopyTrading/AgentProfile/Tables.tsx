import type { HTMLAttributes } from 'react'
import type { PositionSummary } from 'services/copyTrading/types'

import { HStack, Stack } from 'components/Stack'
import { TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/common'
import { formatDate, formatTokenAmount, formatUsd, signedPercent, signedUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

const OpenPositionsGrid = ({ header, ...props }: HTMLAttributes<HTMLDivElement> & { header?: boolean }) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      columns="minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.15fr) minmax(0, 1.15fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)"
      {...props}
    />
  )
}

const TradeHistoryGrid = ({ header, ...props }: HTMLAttributes<HTMLDivElement> & { header?: boolean }) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      columns="minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.15fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)"
      {...props}
    />
  )
}

export const OpenPositionsTable = ({ rows }: { rows: PositionSummary[] }) => (
  <Stack>
    <OpenPositionsGrid header>
      {['Trade ID', 'Token', 'Entry Price', 'Current Price', 'Amount', 'Value', 'P&L', 'Open Since'].map(item => (
        <TableCell key={item}>{item}</TableCell>
      ))}
    </OpenPositionsGrid>
    {rows.map(row => {
      const pnl = row.unrealizedPnlUsd || row.realizedPnlUsd
      const isNegative = Number(pnl || 0) < 0

      return (
        <OpenPositionsGrid key={row.positionId}>
          <TableCell className="text-subText">{row.tradeId}</TableCell>
          <TableCell>{row.token.symbol}</TableCell>
          <TableCell>{formatUsd(row.entryPriceUsd)}</TableCell>
          <TableCell>{formatUsd(row.currentPriceUsd)}</TableCell>
          <TableCell>{formatTokenAmount(row.amountDecimal)}</TableCell>
          <TableCell>{formatUsd(row.valueUsd)}</TableCell>
          <TableCell className={cn(isNegative ? 'text-red' : 'text-primary')}>
            <HStack className="items-center gap-2">
              <span>{signedUsd(pnl)}</span>
              <span className="text-xs">{signedPercent(row.unrealizedPnlPct)}</span>
            </HStack>
          </TableCell>
          <TableCell className="text-subText">{formatDate(row.openedAt)}</TableCell>
        </OpenPositionsGrid>
      )
    })}
  </Stack>
)

export const TradeHistoryTable = ({ rows }: { rows: PositionSummary[] }) => (
  <Stack>
    <TradeHistoryGrid header>
      {['Trade ID', 'Token', 'Entry Price', 'Exit', 'Amount', 'Realised P&L', 'Fee', 'Cash Back', 'Closed'].map(
        item => (
          <TableCell key={item}>{item}</TableCell>
        ),
      )}
    </TradeHistoryGrid>
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
  </Stack>
)

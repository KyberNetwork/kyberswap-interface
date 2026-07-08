import type { HTMLAttributes } from 'react'
import type { PositionSummary } from 'services/copyTrading/types'

import { Stack } from 'components/Stack'
import { TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/common'
import { formatDate, formatTokenAmount, formatUsd, signedPercent, signedUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

const TradeHistoryGrid = ({ header, ...props }: HTMLAttributes<HTMLDivElement> & { header?: boolean }) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      columns="minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.15fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)"
      {...props}
    />
  )
}

const CopyPositionsGrid = ({ header, ...props }: HTMLAttributes<HTMLDivElement> & { header?: boolean }) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      columns="minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.15fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 1fr)"
      {...props}
    />
  )
}

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

export const CopyPositionsTable = ({ rows }: { rows: PositionSummary[] }) => (
  <Stack>
    <CopyPositionsGrid header>
      {['Trade ID', 'Token', 'Entry Price', 'Current', 'Value', 'Unrealised P&L', 'Est. Rebate', 'Open Since'].map(
        item => (
          <TableCell key={item}>{item}</TableCell>
        ),
      )}
    </CopyPositionsGrid>
    {rows.map(row => {
      const isTracking = row.trackingStatus === 'tracking'

      return (
        <CopyPositionsGrid key={row.positionId}>
          <TableCell className="text-subText">{row.tradeId}</TableCell>
          <TableCell>{row.token.symbol}</TableCell>
          <TableCell>{formatUsd(row.entryPriceUsd)}</TableCell>
          <TableCell>{formatUsd(row.currentPriceUsd)}</TableCell>
          <TableCell>{formatUsd(row.valueUsd)}</TableCell>
          <TableCell className={cn(isTracking ? 'text-primary' : 'text-warning')}>
            {signedUsd(row.unrealizedPnlUsd)} ({signedPercent(row.unrealizedPnlPct)})
          </TableCell>
          <TableCell className="text-warning">{formatUsd(row.rebateUsd)}</TableCell>
          <TableCell className="text-subText">{formatDate(row.openedAt)}</TableCell>
        </CopyPositionsGrid>
      )
    })}
  </Stack>
)

import type { PositionSummary } from 'services/copyTrading/types'

import { Stack } from 'components/Stack'
import { TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { formatDate, formatTokenAmount, formatUsd, signedPercent, signedUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

const openPositionsColumns =
  'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.15fr) minmax(0, 1.15fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)'
const tradeHistoryColumns =
  'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.15fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)'

export const OpenPositionsTable = ({ rows }: { rows: PositionSummary[] }) => (
  <Stack>
    <TableHeader columns={openPositionsColumns}>
      {['Trade ID', 'Token', 'Entry Price', 'Current Price', 'Amount', 'Value', 'P&L', 'Open Since'].map(item => (
        <TableCell key={item}>{item}</TableCell>
      ))}
    </TableHeader>
    {rows.map(row => {
      const pnl = row.unrealizedPnlUsd || row.realizedPnlUsd
      const isNegative = Number(pnl || 0) < 0

      return (
        <TableRow key={row.positionId} columns={openPositionsColumns}>
          <TableCell className="text-subText">{row.tradeId}</TableCell>
          <TableCell>{row.token.symbol}</TableCell>
          <TableCell>{formatUsd(row.entryPriceUsd)}</TableCell>
          <TableCell>{formatUsd(row.currentPriceUsd)}</TableCell>
          <TableCell>{formatTokenAmount(row.amountDecimal)}</TableCell>
          <TableCell>{formatUsd(row.valueUsd)}</TableCell>
          <TableCell className={cn(isNegative ? 'text-red' : 'text-primary')}>
            {signedUsd(pnl)} <span className="ml-2 text-xs">{signedPercent(row.unrealizedPnlPct)}</span>
          </TableCell>
          <TableCell className="text-subText">{formatDate(row.openedAt)}</TableCell>
        </TableRow>
      )
    })}
  </Stack>
)

export const TradeHistoryTable = ({ rows }: { rows: PositionSummary[] }) => (
  <Stack>
    <TableHeader columns={tradeHistoryColumns}>
      {['Trade ID', 'Token', 'Entry Price', 'Exit', 'Amount', 'Realised P&L', 'Fee', 'Cash Back', 'Closed'].map(
        item => (
          <TableCell key={item}>{item}</TableCell>
        ),
      )}
    </TableHeader>
    {rows.map(row => {
      const isNegative = Number(row.realizedPnlUsd || 0) < 0

      return (
        <TableRow key={row.positionId} columns={tradeHistoryColumns}>
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
        </TableRow>
      )
    })}
  </Stack>
)

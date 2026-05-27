import { CopyTradingSubscriptionPosition, CopyTradingTradeHistory } from 'services/copyTrading'

import { Stack } from 'components/Stack'
import { cn } from 'utils/cn'

import { TableCell, TableHeader, TableRow } from '../components/Table'

const tradeHistoryColumns =
  'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.15fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)'
const copyPositionsColumns =
  'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.15fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 1fr)'

export const TradeHistoryTable = ({ rows }: { rows: CopyTradingTradeHistory[] }) => (
  <Stack>
    <TableHeader columns={tradeHistoryColumns}>
      {['Trade ID', 'Token', 'Entry Price', 'Exit', 'Amount', 'Realised P&L', 'Fee', 'Cash Back', 'Closed'].map(
        item => (
          <TableCell key={item}>{item}</TableCell>
        ),
      )}
    </TableHeader>
    {rows.map(row => (
      <TableRow key={row.tradeId} columns={tradeHistoryColumns}>
        <TableCell className="text-subText">{row.tradeId}</TableCell>
        <TableCell>{row.token}</TableCell>
        <TableCell>{row.entryPrice}</TableCell>
        <TableCell>{row.exitPrice}</TableCell>
        <TableCell>{row.amount}</TableCell>
        <TableCell className={cn(row.negative ? 'text-red' : 'text-primary')}>{row.realizedPnl}</TableCell>
        <TableCell>{row.fee}</TableCell>
        <TableCell>{row.cashBack}</TableCell>
        <TableCell className="text-subText">{row.closed}</TableCell>
      </TableRow>
    ))}
  </Stack>
)

export const CopyPositionsTable = ({ rows }: { rows: CopyTradingSubscriptionPosition[] }) => (
  <Stack>
    <TableHeader columns={copyPositionsColumns}>
      {['Trade ID', 'Token', 'Entry Price', 'Current', 'Value', 'Unrealised P&L', 'Est. Rebate', 'Open Since'].map(
        item => (
          <TableCell key={item}>{item}</TableCell>
        ),
      )}
    </TableHeader>
    {rows.map(row => (
      <TableRow key={row.tradeId} columns={copyPositionsColumns}>
        <TableCell className="text-subText">{row.tradeId}</TableCell>
        <TableCell>{row.token}</TableCell>
        <TableCell>{row.entryPrice}</TableCell>
        <TableCell>{row.currentPrice}</TableCell>
        <TableCell>{row.value}</TableCell>
        <TableCell className={cn(row.status ? 'text-warning' : 'text-primary')}>{row.unrealisedPnl}</TableCell>
        <TableCell className="text-warning">{row.estRebate}</TableCell>
        <TableCell className="text-subText">{row.openSince}</TableCell>
      </TableRow>
    ))}
  </Stack>
)

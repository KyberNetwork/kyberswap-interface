import type { HTMLAttributes } from 'react'
import copyTradingApi from 'services/copyTrading'

import { Stack } from 'components/Stack'
import { TableBody, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { formatDate, formatTokenAmount, formatUsd, signedUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

type TabHistoryGridProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

const TabHistoryGrid = ({ header, className, ...props }: TabHistoryGridProps) => {
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

const TabHistory = ({ agentId }: { agentId: string }) => {
  const { data: positions, isFetching } = copyTradingApi.useGetAgentPositionsQuery({ agentId, status: 'closed' })
  const rows = positions?.data || []

  return (
    <Stack>
      <TabHistoryGrid header>
        {['Trade ID', 'Token', 'Entry Price', 'Exit', 'Amount', 'Realised P&L', 'Fee', 'Cash Back', 'Closed'].map(
          item => (
            <TableCell key={item}>{item}</TableCell>
          ),
        )}
      </TabHistoryGrid>
      <TableBody empty={!rows.length} emptyMessage="No trade history found" loading={isFetching}>
        {rows.map(row => {
          const isNegative = Number(row.realizedPnlUsd || 0) < 0

          return (
            <TabHistoryGrid key={row.positionId}>
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
            </TabHistoryGrid>
          )
        })}
      </TableBody>
    </Stack>
  )
}

export default TabHistory

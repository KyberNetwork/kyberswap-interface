import type { HTMLAttributes } from 'react'
import copyTradingApi from 'services/copyTrading'

import { HStack, Stack } from 'components/Stack'
import { TableBody, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { formatDate, formatTokenAmount, formatUsd, signedPercent, signedUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

type TabPositionsGridProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

const TabPositionsGrid = ({ header, className, ...props }: TabPositionsGridProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.4fr)] gap-x-4 px-4 py-1',
        header && 'border-b-0 tracking-[0.04em]',
        className,
      )}
      {...props}
    />
  )
}

const TabPositions = ({ agentId }: { agentId: string }) => {
  const { data: positions, isFetching } = copyTradingApi.useGetAgentPositionsQuery({ agentId, status: 'open' })
  const rows = positions?.data || []

  return (
    <Stack>
      <TabPositionsGrid header>
        {['Trade ID', 'Token', 'Entry Price', 'Current Price', 'Amount', 'Value', 'P&L', 'Open Since'].map(item => (
          <TableCell key={item}>{item}</TableCell>
        ))}
      </TabPositionsGrid>
      <TableBody empty={!rows.length} emptyMessage="No open positions found" loading={isFetching}>
        {rows.map(row => {
          const pnl = row.unrealizedPnlUsd || row.realizedPnlUsd
          const isNegative = Number(pnl || 0) < 0

          return (
            <TabPositionsGrid key={row.positionId}>
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
            </TabPositionsGrid>
          )
        })}
      </TableBody>
    </Stack>
  )
}

export default TabPositions

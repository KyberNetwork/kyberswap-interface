import type { HTMLAttributes } from 'react'
import agentApi from 'services/copyTrading/api/endpoints/agents'

import { Stack } from 'components/Stack'
import InfiniteScroll, { useInfiniteCursorQuery } from 'pages/CopyTrading/components/InfiniteScroll'
import { HeaderCell, TableBody, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { ShortenedId } from 'pages/CopyTrading/components/common/layout'
import { formatTokenAmount, formatUsd, signedUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'
import { formatDateTime } from 'utils/time'

const PAGE_SIZE = 10

type TabHistoryGridProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

const TabHistoryGrid = ({ header, className, ...props }: TabHistoryGridProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[1120px] grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)] gap-x-4',
        !header && 'px-4 py-1',
        className,
      )}
      {...props}
    />
  )
}

const TabHistory = ({ agentId }: { agentId: string }) => {
  const [getAgentPositions] = agentApi.useLazyGetAgentPositionsQuery()

  const {
    infiniteScroll,
    isFetching,
    items: rows,
  } = useInfiniteCursorQuery({
    queryKey: ['copy-trading', 'agent-positions', agentId, 'closed'],
    queryFn: cursor =>
      getAgentPositions({
        agentId,
        status: 'closed',
        cursor,
        limit: PAGE_SIZE,
      }).unwrap(),
  })

  return (
    <Stack>
      <InfiniteScroll {...infiniteScroll}>
        <TabHistoryGrid header className="sticky top-0 z-[1]">
          <HeaderCell>Trade ID</HeaderCell>
          <HeaderCell>Token</HeaderCell>
          <HeaderCell>Entry Price</HeaderCell>
          <HeaderCell>Exit</HeaderCell>
          <HeaderCell>Amount</HeaderCell>
          <HeaderCell>Realised P&amp;L</HeaderCell>
          <HeaderCell>Fee</HeaderCell>
          <HeaderCell>Cash Back</HeaderCell>
          <HeaderCell>Closed</HeaderCell>
        </TabHistoryGrid>
        <TableBody
          className="min-w-[1120px]"
          empty={!rows.length}
          emptyMessage="No trade history found"
          loading={isFetching && !rows.length}
        >
          {rows.map(row => {
            const isNegative = Number(row.realizedPnlUsd || 0) < 0

            return (
              <TabHistoryGrid key={row.positionId}>
                <TableCell className="text-subText">
                  <ShortenedId value={row.tradeId} />
                </TableCell>
                <TableCell>{row.token.symbol || '—'}</TableCell>
                <TableCell>{formatUsd(row.entryPriceUsd)}</TableCell>
                <TableCell>{formatUsd(row.exitPriceUsd || row.currentPriceUsd)}</TableCell>
                <TableCell>{formatTokenAmount(row.amountDecimal)}</TableCell>
                <TableCell className={cn(isNegative ? 'text-red' : 'text-primary')}>
                  {signedUsd(row.realizedPnlUsd)}
                </TableCell>
                <TableCell>{formatUsd(row.flatFeeCapturedUsd)}</TableCell>
                <TableCell>{formatUsd(row.cashbackReceivedUsd)}</TableCell>
                <TableCell className="text-subText">{formatDateTime(row.closedAt)}</TableCell>
              </TabHistoryGrid>
            )
          })}
        </TableBody>
      </InfiniteScroll>
    </Stack>
  )
}

export default TabHistory

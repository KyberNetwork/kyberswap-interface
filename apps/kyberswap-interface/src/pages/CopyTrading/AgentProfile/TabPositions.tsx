import type { HTMLAttributes } from 'react'
import agentApi from 'services/copyTrading/api/endpoints/agents'

import { Stack } from 'components/Stack'
import InfiniteScroll, { useInfiniteCursorQuery } from 'pages/CopyTrading/components/InfiniteScroll'
import { HeaderCell, TableBody, TableCell, TableHeader, TableRow } from 'pages/CopyTrading/components/Table'
import { ShortenedId } from 'pages/CopyTrading/components/common/layout'
import { PositionLifecycleBadge } from 'pages/CopyTrading/components/common/status'
import {
  formatTokenAmount,
  formatUsd,
  getSignedMetricClassName,
  signedPercent,
  signedUsd,
} from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'
import { formatDateTime } from 'utils/time'

const PAGE_SIZE = 10

type TabPositionsGridProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

const TabPositionsGrid = ({ header, className, ...props }: TabPositionsGridProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[1120px] grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.4fr)] gap-x-4',
        !header && 'px-4 py-1',
        className,
      )}
      {...props}
    />
  )
}

const TabPositions = ({ agentId }: { agentId: string }) => {
  const [getAgentPositions] = agentApi.useLazyGetAgentPositionsQuery()

  const {
    infiniteScroll,
    isFetching,
    items: rows,
  } = useInfiniteCursorQuery({
    queryKey: ['copy-trading', 'agent-positions', agentId, 'open'],
    queryFn: cursor =>
      getAgentPositions({
        agentId,
        status: 'open',
        cursor,
        limit: PAGE_SIZE,
      }).unwrap(),
  })

  return (
    <Stack>
      <InfiniteScroll {...infiniteScroll}>
        <TabPositionsGrid header className="sticky top-0 z-[1]">
          <HeaderCell>Trade ID</HeaderCell>
          <HeaderCell>Token</HeaderCell>
          <HeaderCell>Entry Price</HeaderCell>
          <HeaderCell>Current Price</HeaderCell>
          <HeaderCell>Amount</HeaderCell>
          <HeaderCell>Value</HeaderCell>
          <HeaderCell>P&amp;L</HeaderCell>
          <HeaderCell>Status</HeaderCell>
          <HeaderCell>Open Since</HeaderCell>
        </TabPositionsGrid>
        <TableBody
          className="min-w-[1120px]"
          empty={!rows.length}
          emptyMessage="No open positions found"
          loading={isFetching && !rows.length}
        >
          {rows.map(row => {
            const pnl = row.unrealizedPnlUsd || row.realizedPnlUsd

            return (
              <TabPositionsGrid key={row.positionId}>
                <TableCell className="text-subText">
                  <ShortenedId value={row.tradeId} />
                </TableCell>
                <TableCell>{row.token.symbol || '—'}</TableCell>
                <TableCell>{formatUsd(row.entryPriceUsd)}</TableCell>
                <TableCell>{formatUsd(row.currentPriceUsd)}</TableCell>
                <TableCell>{formatTokenAmount(row.amountDecimal)}</TableCell>
                <TableCell>{formatUsd(row.valueUsd)}</TableCell>
                <TableCell className={getSignedMetricClassName(pnl ?? row.unrealizedPnlPct)}>
                  <Stack className="gap-0.5">
                    <span className="whitespace-nowrap">{signedUsd(pnl)}</span>
                    <span className="whitespace-nowrap text-xs">{signedPercent(row.unrealizedPnlPct)}</span>
                  </Stack>
                </TableCell>
                <TableCell>
                  <PositionLifecycleBadge lifecycle={row.lifecycle} quantityState={row.quantityState} />
                </TableCell>
                <TableCell className="text-subText">{formatDateTime(row.openedAt)}</TableCell>
              </TabPositionsGrid>
            )
          })}
        </TableBody>
      </InfiniteScroll>
    </Stack>
  )
}

export default TabPositions

import type { HTMLAttributes } from 'react'
import agentApi from 'services/copyTrading/api/endpoints/agents'

import { Stack } from 'components/Stack'
import InfiniteScroll, { useInfiniteCursorQuery } from 'pages/CopyTrading/components/InfiniteScroll'
import {
  HeaderCell,
  TableBody,
  TableCardField,
  TableCardGrid,
  TableCardValueFallback,
  TableCell,
  TableHeader,
  TableRow,
  TradeCardHeader,
} from 'pages/CopyTrading/components/Table'
import { ShortenedId } from 'pages/CopyTrading/components/common/layout'
import { formatTokenAmount, formatUsd, getSignedMetricClassName, signedUsd } from 'pages/CopyTrading/helpers'
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
        'min-w-[900px] grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.4fr)] gap-x-4',
        !header && 'py-1',
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
        <TabHistoryGrid header className="sticky top-0 z-[1] hidden lg:grid">
          <HeaderCell>Trade ID</HeaderCell>
          <HeaderCell>Token</HeaderCell>
          <HeaderCell className="justify-end text-right">Entry Price</HeaderCell>
          <HeaderCell className="justify-end text-right">Exit</HeaderCell>
          <HeaderCell className="justify-end text-right">Amount</HeaderCell>
          <HeaderCell className="justify-end text-right">Realised P&amp;L</HeaderCell>
          <HeaderCell>Closed</HeaderCell>
        </TabHistoryGrid>
        <TableBody
          className="grid gap-2 bg-transparent lg:block lg:min-w-[900px] lg:bg-buttonBlack-60"
          empty={!rows.length}
          emptyMessage="No trade history found"
          loading={isFetching && !rows.length}
        >
          {rows.map(row => (
            <div key={row.positionId}>
              <TabHistoryGrid className="max-lg:hidden">
                <TableCell className="text-subText">
                  <ShortenedId value={row.tradeId} />
                </TableCell>
                <TableCell>{row.token.symbol || '—'}</TableCell>
                <TableCell className="text-right">{formatUsd(row.entryPriceUsd)}</TableCell>
                <TableCell className="text-right">{formatUsd(row.exitPriceUsd || row.currentPriceUsd)}</TableCell>
                <TableCell className="text-right">{formatTokenAmount(row.amountDecimal)}</TableCell>
                <TableCell className={cn('whitespace-nowrap text-right', getSignedMetricClassName(row.realizedPnlUsd))}>
                  {signedUsd(row.realizedPnlUsd)}
                </TableCell>
                <TableCell className="text-subText">{formatDateTime(row.closedAt)}</TableCell>
              </TabHistoryGrid>

              <Stack className="gap-0 overflow-hidden rounded-xl bg-white-08 lg:hidden">
                <TradeCardHeader
                  metric={
                    <span className={cn('whitespace-nowrap', getSignedMetricClassName(row.realizedPnlUsd))}>
                      {signedUsd(row.realizedPnlUsd)}
                    </span>
                  }
                  metricLabel="Realised P&amp;L"
                  tokenSymbol={row.token.symbol}
                  tradeId={row.tradeId}
                />

                <TableCardGrid className="border-t border-tableHeader p-3">
                  <TableCardField label="Entry Price">{formatUsd(row.entryPriceUsd)}</TableCardField>
                  <TableCardField align="right" label="Exit">
                    {formatUsd(row.exitPriceUsd || row.currentPriceUsd)}
                  </TableCardField>
                  <TableCardField label="Amount">
                    {row.amountDecimal?.trim() ? formatTokenAmount(row.amountDecimal) : <TableCardValueFallback />}
                  </TableCardField>
                  <TableCardField align="right" label="Closed" valueClassName="text-subText">
                    {formatDateTime(row.closedAt)}
                  </TableCardField>
                </TableCardGrid>
              </Stack>
            </div>
          ))}
        </TableBody>
      </InfiniteScroll>
    </Stack>
  )
}

export default TabHistory

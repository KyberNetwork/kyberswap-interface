import type { HTMLAttributes } from 'react'
import agentApi from 'services/copyTrading/api/endpoints/agents'

import { HStack, Stack } from 'components/Stack'
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
        'min-w-[1024px] grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.4fr)] gap-x-4',
        !header && 'py-1',
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
        <TabPositionsGrid header className="sticky top-0 z-[1] hidden lg:grid">
          <HeaderCell>Trade ID</HeaderCell>
          <HeaderCell>Token</HeaderCell>
          <HeaderCell className="justify-end text-right">Entry Price</HeaderCell>
          <HeaderCell className="justify-end text-right">Current Price</HeaderCell>
          <HeaderCell className="justify-end text-right">Amount</HeaderCell>
          <HeaderCell className="justify-end text-right">Value</HeaderCell>
          <HeaderCell className="justify-end text-right">P&amp;L</HeaderCell>
          <HeaderCell>Open Since</HeaderCell>
        </TabPositionsGrid>
        <TableBody
          className="grid gap-2 bg-transparent lg:block lg:min-w-[1024px] lg:bg-buttonBlack-60"
          empty={!rows.length}
          emptyMessage="No open positions found"
          loading={isFetching && !rows.length}
        >
          {rows.map(row => (
            <div key={row.positionId}>
              <TabPositionsGrid className="max-lg:hidden">
                <TableCell className="text-subText">
                  <ShortenedId value={row.tradeId} />
                </TableCell>
                <TableCell>{row.token.symbol || '—'}</TableCell>
                <TableCell className="text-right">{formatUsd(row.entryPriceUsd)}</TableCell>
                <TableCell className="text-right">{formatUsd(row.currentPriceUsd)}</TableCell>
                <TableCell className="text-right">{formatTokenAmount(row.amountDecimal)}</TableCell>
                <TableCell className="text-right">{formatUsd(row.valueUsd)}</TableCell>
                <TableCell className="text-right">
                  <Stack className="items-end gap-0.5">
                    <span className={cn('whitespace-nowrap', getSignedMetricClassName(row.unrealizedPnlUsd))}>
                      {signedUsd(row.unrealizedPnlUsd)}
                    </span>
                    <span className={cn('whitespace-nowrap text-xs', getSignedMetricClassName(row.unrealizedPnlPct))}>
                      {signedPercent(row.unrealizedPnlPct)}
                    </span>
                  </Stack>
                </TableCell>
                <TableCell className="text-subText">{formatDateTime(row.openedAt)}</TableCell>
              </TabPositionsGrid>

              <Stack className="gap-0 overflow-hidden rounded-xl bg-white-08 lg:hidden">
                <TradeCardHeader
                  metric={
                    <HStack className="items-baseline justify-end gap-1 whitespace-nowrap">
                      <span className={getSignedMetricClassName(row.unrealizedPnlUsd)}>
                        {signedUsd(row.unrealizedPnlUsd)}
                      </span>
                      <span className={cn('text-xs', getSignedMetricClassName(row.unrealizedPnlPct))}>
                        {signedPercent(row.unrealizedPnlPct)}
                      </span>
                    </HStack>
                  }
                  metricLabel="P&amp;L"
                  tokenSymbol={row.token.symbol}
                  tradeId={row.tradeId}
                />

                <TableCardGrid className="border-t border-tableHeader p-3">
                  <TableCardField label="Entry Price">{formatUsd(row.entryPriceUsd)}</TableCardField>
                  <TableCardField align="right" label="Current Price">
                    {formatUsd(row.currentPriceUsd)}
                  </TableCardField>
                  <TableCardField label="Amount">
                    {row.amountDecimal?.trim() ? formatTokenAmount(row.amountDecimal) : <TableCardValueFallback />}
                  </TableCardField>
                  <TableCardField align="right" label="Value">
                    {formatUsd(row.valueUsd)}
                  </TableCardField>
                  <TableCardField label="Open Since" valueClassName="text-subText">
                    {formatDateTime(row.openedAt)}
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

export default TabPositions

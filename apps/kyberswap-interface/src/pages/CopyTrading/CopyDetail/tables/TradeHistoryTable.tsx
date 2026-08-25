import type { HTMLAttributes } from 'react'
import type { PositionSummary } from 'services/copyTrading/types/positions'

import { HStack, Stack } from 'components/Stack'
import InfiniteScroll, { type InfiniteScrollState } from 'pages/CopyTrading/components/InfiniteScroll'
import {
  HeaderCell,
  TableBody,
  TableCardField,
  TableCardGrid,
  TableCell,
  TableHeader,
  TableRow,
} from 'pages/CopyTrading/components/Table'
import { ShortenedId } from 'pages/CopyTrading/components/common/layout'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { formatUsd, getSignedMetricClassName, signedUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'
import { formatDateTime } from 'utils/time'

type TableGridWrapperProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

type PositionTableProps = {
  infiniteScroll: InfiniteScrollState
  loading?: boolean
  rows: PositionSummary[]
}

const formatDuration = (durationSeconds?: string, openedAt?: string, closedAt?: string) => {
  const apiDuration = Number(durationSeconds)
  if (durationSeconds !== undefined && Number.isFinite(apiDuration)) {
    const totalMinutes = Math.max(0, Math.floor(apiDuration / 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return hours ? hours + 'h ' + minutes + 'm' : minutes + 'm'
  }

  if (!openedAt || !closedAt) return '-'

  const durationMs = new Date(closedAt).getTime() - new Date(openedAt).getTime()
  if (Number.isNaN(durationMs)) return '-'

  const totalMinutes = Math.max(0, Math.floor(durationMs / 60_000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return hours ? hours + 'h ' + minutes + 'm' : minutes + 'm'
}

const TradeHistoryGrid = ({ header, className, ...props }: TableGridWrapperProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[1320px] grid-cols-[minmax(0,0.9fr)_minmax(0,0.75fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(0,1.25fr)_minmax(0,0.8fr)] gap-x-4',
        !header && 'px-4 py-1',
        className,
      )}
      {...props}
    />
  )
}

export const TradeHistoryTable = ({ infiniteScroll, loading, rows }: PositionTableProps) => {
  return (
    <Stack>
      <InfiniteScroll {...infiniteScroll}>
        <TradeHistoryGrid header className="sticky top-0 z-[1] hidden xl:grid">
          <HeaderCell>Trade ID</HeaderCell>
          <HeaderCell>Token</HeaderCell>
          <HeaderCell>Entry Price</HeaderCell>
          <HeaderCell>Exit</HeaderCell>
          <HeaderCell>P&amp;L</HeaderCell>
          <HeaderCell>Fee</HeaderCell>
          <HeaderCell>Rebate</HeaderCell>
          <HeaderCell>Net Cost</HeaderCell>
          <HeaderCell>Opened</HeaderCell>
          <HeaderCell>Closed</HeaderCell>
          <HeaderCell>Duration</HeaderCell>
        </TradeHistoryGrid>
        <TableBody
          className="grid gap-2 bg-transparent xl:block xl:min-w-[1320px] xl:bg-buttonBlack-60"
          empty={!rows.length}
          emptyIconUrl={copyTradingStatIconMap.positionClose.iconUrl}
          emptyMessage="No closed positions found"
          loading={loading}
        >
          {rows.map(row => (
            <div key={row.positionId}>
              <TradeHistoryGrid className="max-xl:hidden">
                <TableCell className="text-subText">
                  <ShortenedId value={row.tradeId} />
                </TableCell>
                <TableCell>{row.token.symbol || '—'}</TableCell>
                <TableCell>{formatUsd(row.entryPriceUsd)}</TableCell>
                <TableCell>{formatUsd(row.exitPriceUsd || row.currentPriceUsd)}</TableCell>
                <TableCell className={cn('whitespace-nowrap', getSignedMetricClassName(row.realizedPnlUsd))}>
                  {signedUsd(row.realizedPnlUsd)}
                </TableCell>
                <TableCell>{formatUsd(row.flatFeeCapturedUsd)}</TableCell>
                <TableCell>{formatUsd(row.cashbackReceivedUsd)}</TableCell>
                <TableCell>{formatUsd(row.netFeeCostUsd)}</TableCell>
                <TableCell className="text-subText">{formatDateTime(row.openedAt)}</TableCell>
                <TableCell className="text-subText">{formatDateTime(row.closedAt)}</TableCell>
                <TableCell className="text-subText">
                  {formatDuration(row.durationSeconds, row.openedAt, row.closedAt)}
                </TableCell>
              </TradeHistoryGrid>

              <Stack className="gap-3 rounded-xl bg-buttonBlack-60 p-3 xl:hidden">
                <HStack className="items-start justify-between gap-3">
                  <TableCardField label="Token">{row.token.symbol || '—'}</TableCardField>
                  <TableCardField align="right" label="Closed" valueClassName="text-subText">
                    {formatDateTime(row.closedAt)}
                  </TableCardField>
                </HStack>

                <TableCardGrid>
                  <TableCardField span="full" label="Trade ID">
                    <ShortenedId value={row.tradeId} />
                  </TableCardField>
                  <TableCardField label="Entry Price">{formatUsd(row.entryPriceUsd)}</TableCardField>
                  <TableCardField align="right" label="Exit">
                    {formatUsd(row.exitPriceUsd || row.currentPriceUsd)}
                  </TableCardField>
                  <TableCardField
                    label="P&amp;L"
                    valueClassName={cn('whitespace-nowrap', getSignedMetricClassName(row.realizedPnlUsd))}
                  >
                    {signedUsd(row.realizedPnlUsd)}
                  </TableCardField>
                  <TableCardField align="right" label="Duration" valueClassName="text-subText">
                    {formatDuration(row.durationSeconds, row.openedAt, row.closedAt)}
                  </TableCardField>
                  <TableCardField label="Fee">{formatUsd(row.flatFeeCapturedUsd)}</TableCardField>
                  <TableCardField align="right" label="Rebate">
                    {formatUsd(row.cashbackReceivedUsd)}
                  </TableCardField>
                  <TableCardField label="Net Cost">{formatUsd(row.netFeeCostUsd)}</TableCardField>
                  <TableCardField align="right" label="Opened" valueClassName="text-subText">
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

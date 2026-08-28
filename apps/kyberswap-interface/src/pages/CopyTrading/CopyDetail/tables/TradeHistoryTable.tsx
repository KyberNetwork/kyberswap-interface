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
        'min-w-[1120px] grid-cols-[minmax(80px,0.9fr)_minmax(68px,0.75fr)_repeat(2,minmax(104px,1fr))_minmax(120px,1fr)_repeat(2,minmax(88px,0.8fr))_minmax(100px,0.9fr)_minmax(168px,1.25fr)_minmax(84px,0.8fr)] gap-x-2 whitespace-nowrap',
        !header && 'py-1',
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
          <HeaderCell className="justify-end text-right">Entry Price</HeaderCell>
          <HeaderCell className="justify-end text-right">Exit</HeaderCell>
          <HeaderCell className="justify-end text-right">P&amp;L</HeaderCell>
          <HeaderCell className="justify-end text-right">Fee</HeaderCell>
          <HeaderCell className="justify-end text-right">Rebate</HeaderCell>
          <HeaderCell className="justify-end text-right">Net Cost</HeaderCell>
          <HeaderCell className="justify-end text-right">Opened &amp; Closed</HeaderCell>
          <HeaderCell className="justify-end text-right">Duration</HeaderCell>
        </TradeHistoryGrid>
        <TableBody
          className="grid gap-2 bg-transparent xl:block xl:min-w-[1120px] xl:bg-buttonBlack-60"
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
                <TableCell className="text-right">{formatUsd(row.entryPriceUsd, 2)}</TableCell>
                <TableCell className="text-right">{formatUsd(row.exitPriceUsd || row.currentPriceUsd, 2)}</TableCell>
                <TableCell className={cn('whitespace-nowrap text-right', getSignedMetricClassName(row.positionPnlUsd))}>
                  {signedUsd(row.positionPnlUsd, 2)}
                </TableCell>
                <TableCell className="text-right">{formatUsd(row.flatFeeCapturedUsd, 2)}</TableCell>
                <TableCell className="text-right">{formatUsd(row.cashbackReceivedUsd, 2)}</TableCell>
                <TableCell className="text-right">{formatUsd(row.netFeeCostUsd, 2)}</TableCell>
                <TableCell className="flex flex-col text-right text-subText">
                  <span>{formatDateTime(row.openedAt)}</span>
                  <span>{formatDateTime(row.closedAt)}</span>
                </TableCell>
                <TableCell className="text-right text-subText">
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
                  <TableCardField label="Entry Price">{formatUsd(row.entryPriceUsd, 2)}</TableCardField>
                  <TableCardField align="right" label="Exit">
                    {formatUsd(row.exitPriceUsd || row.currentPriceUsd, 2)}
                  </TableCardField>
                  <TableCardField
                    label="P&amp;L"
                    valueClassName={cn('whitespace-nowrap', getSignedMetricClassName(row.positionPnlUsd))}
                  >
                    {signedUsd(row.positionPnlUsd, 2)}
                  </TableCardField>
                  <TableCardField align="right" label="Duration" valueClassName="text-subText">
                    {formatDuration(row.durationSeconds, row.openedAt, row.closedAt)}
                  </TableCardField>
                  <TableCardField label="Fee">{formatUsd(row.flatFeeCapturedUsd, 2)}</TableCardField>
                  <TableCardField align="right" label="Rebate">
                    {formatUsd(row.cashbackReceivedUsd, 2)}
                  </TableCardField>
                  <TableCardField label="Net Cost">{formatUsd(row.netFeeCostUsd, 2)}</TableCardField>
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

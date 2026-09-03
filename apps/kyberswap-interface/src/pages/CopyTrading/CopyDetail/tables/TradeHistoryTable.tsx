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
import { TxHashLink } from 'pages/CopyTrading/components/common/TxHashLink'
import { ShortenedId } from 'pages/CopyTrading/components/common/layout'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { formatTokenAmount, formatUsd, getSignedMetricClassName, signedUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

type TableGridWrapperProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

type PositionTableProps = {
  infiniteScroll: InfiniteScrollState
  loading?: boolean
  rows: PositionSummary[]
}

const formatTokenValue = (value?: string, symbol?: string) => {
  const formattedAmount = formatTokenAmount(value)
  return value?.trim() && symbol ? `${formattedAmount} ${symbol}` : formattedAmount
}

const TradeHistoryGrid = ({ header, className, ...props }: TableGridWrapperProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[1120px] grid-cols-[minmax(84px,0.8fr)_minmax(72px,0.75fr)_repeat(2,minmax(108px,1fr))_minmax(104px,1fr)_minmax(104px,1fr)_repeat(2,minmax(88px,0.8fr))_minmax(128px,1.1fr)_minmax(96px,0.9fr)] gap-x-3 whitespace-nowrap',
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
          <HeaderCell className="justify-end text-right">Closed Price</HeaderCell>
          <HeaderCell className="justify-end text-right">Amount</HeaderCell>
          <HeaderCell className="justify-end text-right">P&amp;L</HeaderCell>
          <HeaderCell className="justify-end text-right">Fee</HeaderCell>
          <HeaderCell className="justify-end text-right">Rebate</HeaderCell>
          <HeaderCell className="justify-end text-right">Received</HeaderCell>
          <HeaderCell className="justify-end text-right">Tx Hash</HeaderCell>
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
                <TableCell className="text-right">{formatUsd(row.exitPriceUsd, 2)}</TableCell>
                <TableCell className="text-right">{formatTokenAmount(row.totalBaseSoldDecimal)}</TableCell>
                <TableCell className={cn('whitespace-nowrap text-right', getSignedMetricClassName(row.realizedPnlUsd))}>
                  {signedUsd(row.realizedPnlUsd, 2)}
                </TableCell>
                <TableCell className="text-right">{formatUsd(row.flatFeeCapturedUsd, 2)}</TableCell>
                <TableCell className="text-right text-blue">{formatUsd(row.cashbackReceivedUsd, 2)}</TableCell>
                <TableCell className="text-right">
                  {formatTokenValue(row.totalQuoteReceivedDecimal, row.quoteToken?.symbol)}
                </TableCell>
                <TableCell className="flex justify-end text-subText">
                  <TxHashLink chainId={row.chainId} txHash={row.latestTxHash} />
                </TableCell>
              </TradeHistoryGrid>

              <Stack className="gap-3 rounded-xl bg-buttonBlack p-3 xl:hidden">
                <HStack className="items-start justify-between gap-3">
                  <TableCardField label="Token">{row.token.symbol || '—'}</TableCardField>
                  <TableCardField align="right" label="Tx Hash" valueClassName="text-subText">
                    <TxHashLink chainId={row.chainId} txHash={row.latestTxHash} />
                  </TableCardField>
                </HStack>

                <TableCardGrid>
                  <TableCardField span="full" label="Trade ID">
                    <ShortenedId value={row.tradeId} />
                  </TableCardField>
                  <TableCardField label="Entry Price">{formatUsd(row.entryPriceUsd, 2)}</TableCardField>
                  <TableCardField align="right" label="Closed Price">
                    {formatUsd(row.exitPriceUsd, 2)}
                  </TableCardField>
                  <TableCardField label="Amount">{formatTokenAmount(row.totalBaseSoldDecimal)}</TableCardField>
                  <TableCardField
                    align="right"
                    label="P&amp;L"
                    valueClassName={cn('whitespace-nowrap', getSignedMetricClassName(row.realizedPnlUsd))}
                  >
                    {signedUsd(row.realizedPnlUsd, 2)}
                  </TableCardField>
                  <TableCardField label="Fee">{formatUsd(row.flatFeeCapturedUsd, 2)}</TableCardField>
                  <TableCardField align="right" label="Rebate" valueClassName="text-blue">
                    {formatUsd(row.cashbackReceivedUsd, 2)}
                  </TableCardField>
                  <TableCardField span="full" label="Received" valueClassName="whitespace-nowrap">
                    {formatTokenValue(row.totalQuoteReceivedDecimal, row.quoteToken?.symbol)}
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

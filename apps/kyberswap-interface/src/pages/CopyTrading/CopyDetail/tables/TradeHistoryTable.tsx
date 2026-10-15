import type { HTMLAttributes } from 'react'
import { isValuationRenderable } from 'services/copyTrading/adapters/shared'
import type { PositionSummary } from 'services/copyTrading/types/positions'

import { Stack } from 'components/Stack'
import InfiniteScroll, { type InfiniteScrollState } from 'pages/CopyTrading/components/InfiniteScroll'
import {
  HeaderCell,
  TableBody,
  TableCardField,
  TableCardGrid,
  TableCell,
  TableHeader,
  TableRow,
  TradeCardHeader,
} from 'pages/CopyTrading/components/Table'
import { TxHashLink } from 'pages/CopyTrading/components/common/TxHashLink'
import { ShortenedId } from 'pages/CopyTrading/components/common/layout'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { formatTokenAmount, formatUsd, getSignedMetricClassName, signedUsd } from 'pages/CopyTrading/helpers'
import { shortenAddress } from 'utils/address'
import { cn } from 'utils/cn'

const formatTokenValue = (value?: string, symbol?: string) => {
  const formattedAmount = formatTokenAmount(value)
  return value?.trim() && symbol ? `${formattedAmount} ${symbol}` : formattedAmount
}

type TableGridWrapperProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

const TradeHistoryGrid = ({ header, className, ...props }: TableGridWrapperProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[1252px] grid-cols-[minmax(84px,0.8fr)_160px_repeat(2,minmax(108px,1fr))_minmax(104px,1fr)_repeat(3,minmax(88px,0.8fr))_minmax(192px,1.4fr)_minmax(96px,0.9fr)] gap-x-3 whitespace-nowrap',
        !header && 'py-1',
        className,
      )}
      {...props}
    />
  )
}

type TradeHistoryTableProps = {
  infiniteScroll: InfiniteScrollState
  loading?: boolean
  rows: PositionSummary[]
}

export const TradeHistoryTable = ({ infiniteScroll, loading, rows }: TradeHistoryTableProps) => {
  return (
    <Stack>
      <InfiniteScroll {...infiniteScroll}>
        <TradeHistoryGrid header className="sticky top-0 z-[1] hidden lg:grid">
          <HeaderCell>Trade ID</HeaderCell>
          <HeaderCell>Token</HeaderCell>
          <HeaderCell className="justify-end text-right">Entry Price</HeaderCell>
          <HeaderCell className="justify-end text-right">EXIT</HeaderCell>
          <HeaderCell className="justify-end text-right">P&amp;L</HeaderCell>
          <HeaderCell className="justify-end text-right">Fee</HeaderCell>
          <HeaderCell className="justify-end text-right">Rebate</HeaderCell>
          <HeaderCell className="justify-end text-right">NET COST</HeaderCell>
          <HeaderCell className="justify-end text-right">Received</HeaderCell>
          <HeaderCell className="justify-end text-right">Tx Hash</HeaderCell>
        </TradeHistoryGrid>
        <TableBody
          className="grid gap-2 bg-transparent lg:block lg:min-w-[1252px] lg:bg-buttonBlack-60"
          empty={!rows.length}
          emptyIconUrl={copyTradingStatIconMap.positionClose.iconUrl}
          emptyMessage="No closed positions found"
          loading={loading}
        >
          {rows.map(row => {
            const isWithdrawal = row.exitKind === 'POSITION_EXIT_KIND_WITHDRAWAL_CLOSE'
            const pnl = isWithdrawal ? row.positionPnlUsd : row.realizedPnlUsd
            const rebate = isWithdrawal ? '0' : row.cashbackReceivedUsd
            const settledValueUsd = isValuationRenderable(row.exitValuation) ? row.exitValuation?.valueUsd : undefined
            const received = isWithdrawal
              ? formatTokenValue(
                  row.withdrawnBaseDecimal,
                  row.token.symbol || shortenAddress(row.chainId, row.token.address, 4, false),
                )
              : formatTokenValue(row.totalQuoteReceivedDecimal, row.quoteToken?.symbol)
            const withdrawnBadge =
              row.tokensWithdrawn === true ? (
                <span className="shrink-0 rounded bg-warning/20 px-1.5 py-0.5 text-xs font-medium text-warning">
                  Withdrawn
                </span>
              ) : undefined

            return (
              <div key={row.positionId}>
                <TradeHistoryGrid className="max-lg:hidden">
                  <TableCell className="text-subText">
                    <ShortenedId value={row.positionId} />
                  </TableCell>
                  <TableCell className="flex items-center gap-1.5">
                    <span className="min-w-0 truncate" title={row.token.symbol}>
                      {row.token.symbol || '—'}
                    </span>
                    {withdrawnBadge}
                  </TableCell>
                  <TableCell className="text-right">{formatUsd(row.entryPriceUsd, 2)}</TableCell>
                  <TableCell className="text-right">{formatUsd(row.exitPriceUsd, 2)}</TableCell>
                  <TableCell className={cn('whitespace-nowrap text-right', getSignedMetricClassName(pnl))}>
                    {signedUsd(pnl, 2)}
                  </TableCell>
                  <TableCell className="text-right">{formatUsd(row.flatFeeCapturedUsd, 2)}</TableCell>
                  <TableCell className="text-right text-blue">{formatUsd(rebate, 2)}</TableCell>
                  <TableCell className="text-right">{formatUsd(row.netFeeCostUsd, 2)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    {received}
                    {isWithdrawal && (
                      <span className="ml-1 text-xs text-subText">({formatUsd(settledValueUsd, 2)})</span>
                    )}
                  </TableCell>
                  <TableCell className="flex justify-end text-subText">
                    <TxHashLink chainId={row.chainId} txHash={row.latestTxHash} />
                  </TableCell>
                </TradeHistoryGrid>

                <Stack className="gap-0 overflow-hidden rounded-xl bg-white-08 lg:hidden">
                  <TradeCardHeader
                    metric={
                      <span className={cn('whitespace-nowrap', getSignedMetricClassName(pnl))}>
                        {signedUsd(pnl, 2)}
                      </span>
                    }
                    metricLabel="P&amp;L"
                    tokenSymbol={row.token.symbol}
                    tokenBadge={withdrawnBadge}
                    positionId={row.positionId}
                  />

                  <TableCardGrid className="border-t border-tableHeader p-3">
                    <TableCardField label="Entry Price">{formatUsd(row.entryPriceUsd, 2)}</TableCardField>
                    <TableCardField align="right" label="EXIT">
                      {formatUsd(row.exitPriceUsd, 2)}
                    </TableCardField>
                    <TableCardField label="Fee">{formatUsd(row.flatFeeCapturedUsd, 2)}</TableCardField>
                    <TableCardField align="right" label="Rebate" valueClassName="text-blue">
                      {formatUsd(rebate, 2)}
                    </TableCardField>
                    <TableCardField label="NET COST">{formatUsd(row.netFeeCostUsd, 2)}</TableCardField>
                    <TableCardField
                      align="right"
                      label="Received"
                      valueClassName="flex w-full min-w-0 items-baseline justify-end gap-1 whitespace-nowrap"
                    >
                      <span className="min-w-0 truncate" title={received}>
                        {received}
                      </span>
                      {isWithdrawal && (
                        <span className="shrink-0 text-xs text-subText">({formatUsd(settledValueUsd, 2)})</span>
                      )}
                    </TableCardField>
                    <TableCardField span="full" label="Tx Hash" valueClassName="text-subText">
                      <TxHashLink chainId={row.chainId} txHash={row.latestTxHash?.trim()} />
                    </TableCardField>
                  </TableCardGrid>
                </Stack>
              </div>
            )
          })}
        </TableBody>
      </InfiniteScroll>
    </Stack>
  )
}

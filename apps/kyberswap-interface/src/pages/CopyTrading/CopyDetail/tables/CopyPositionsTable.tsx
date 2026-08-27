import type { HTMLAttributes } from 'react'
import type { PositionSummary } from 'services/copyTrading/types/positions'
import type { CopyRunStatus } from 'services/copyTrading/types/primitives'

import { ButtonLight } from 'components/Button'
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
import { PositionLifecycleBadge } from 'pages/CopyTrading/components/common/status'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import {
  formatApproximateUsd,
  formatUsd,
  getSignedMetricClassName,
  signedPercent,
  signedUsd,
} from 'pages/CopyTrading/helpers'
import {
  POSITION_SELL_FLOW_CONFIG,
  getPositionRecoveryFlow,
} from 'pages/CopyTrading/modals/ManagePositionModal/positionSellFlow'
import { useCopyTradingModal } from 'pages/CopyTrading/modals/context'
import { cn } from 'utils/cn'
import { formatDateTime } from 'utils/time'

type TableGridWrapperProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

type PositionTableProps = {
  copyRunStatus: CopyRunStatus
  infiniteScroll: InfiniteScrollState
  loading?: boolean
  rows: PositionSummary[]
}

const PositionAction = ({ copyRunStatus, position }: { copyRunStatus: CopyRunStatus; position: PositionSummary }) => {
  const { openManagePosition } = useCopyTradingModal()
  const recoveryFlow = getPositionRecoveryFlow(position, copyRunStatus)
  if (!recoveryFlow) return null

  const flowConfig = POSITION_SELL_FLOW_CONFIG[recoveryFlow]

  return (
    <ButtonLight
      type="button"
      padding="7px 12px"
      color={flowConfig.sellContext === 'POSITION_SELL_CONTEXT_STOP_COPY' ? 'var(--ks-red)' : 'var(--ks-warning)'}
      className="whitespace-nowrap"
      onClick={event => {
        event.stopPropagation()
        openManagePosition(position, recoveryFlow)
      }}
    >
      {flowConfig.actionLabel}
    </ButtonLight>
  )
}

const CopyPositionsGrid = ({ header, className, ...props }: TableGridWrapperProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[1100px] grid-cols-[minmax(84px,0.8fr)_minmax(72px,0.7fr)_repeat(2,minmax(108px,0.9fr))_minmax(96px,0.9fr)_minmax(128px,1.25fr)_minmax(96px,0.85fr)_minmax(104px,0.9fr)_minmax(144px,1.1fr)] gap-x-3 whitespace-nowrap',
        !header && 'py-1',
        className,
      )}
      {...props}
    />
  )
}

export const CopyPositionsTable = ({ copyRunStatus, infiniteScroll, loading, rows }: PositionTableProps) => {
  return (
    <Stack>
      <InfiniteScroll {...infiniteScroll}>
        <CopyPositionsGrid header className="sticky top-0 z-20 hidden lg:grid">
          <HeaderCell>Trade ID</HeaderCell>
          <HeaderCell>Token</HeaderCell>
          <HeaderCell className="justify-end text-right">Entry Price</HeaderCell>
          <HeaderCell className="justify-end text-right">Current</HeaderCell>
          <HeaderCell className="justify-end text-right">Value</HeaderCell>
          <HeaderCell className="justify-end text-right">Unrealised P&amp;L</HeaderCell>
          <HeaderCell className="justify-end text-right">Est. Rebate</HeaderCell>
          <HeaderCell className="justify-end text-right">Open Since</HeaderCell>
          <HeaderCell className="justify-end text-right">Action</HeaderCell>
        </CopyPositionsGrid>
        <TableBody
          className="grid gap-2 bg-transparent lg:block lg:min-w-[1100px] lg:bg-buttonBlack-60"
          empty={!rows.length}
          emptyIconUrl={copyTradingStatIconMap.positionOpen.iconUrl}
          emptyMessage="No open positions found"
          loading={loading}
        >
          {rows.map(row => (
            <div key={row.positionId}>
              <CopyPositionsGrid className="max-lg:hidden">
                <TableCell className="text-subText">
                  <ShortenedId value={row.tradeId} />
                </TableCell>
                <TableCell>{row.token.symbol || '—'}</TableCell>
                <TableCell className="text-right">{formatUsd(row.entryPriceUsd, 2)}</TableCell>
                <TableCell className="text-right">{formatUsd(row.currentPriceUsd, 2)}</TableCell>
                <TableCell className="text-right">{formatUsd(row.valueUsd, 2)}</TableCell>
                <TableCell
                  className={cn('text-right', getSignedMetricClassName(row.unrealizedPnlUsd ?? row.unrealizedPnlPct))}
                >
                  <Stack className="items-end gap-0.5">
                    <span className="whitespace-nowrap">{signedUsd(row.unrealizedPnlUsd, 2)}</span>
                    <span className="whitespace-nowrap text-xs">{signedPercent(row.unrealizedPnlPct)}</span>
                  </Stack>
                </TableCell>
                <TableCell className="text-right text-warning">
                  {formatApproximateUsd(row.estimatedCashbackUsd, 2)}
                </TableCell>
                <TableCell className="whitespace-normal text-right text-subText">
                  {formatDateTime(row.openedAt)}
                </TableCell>
                <TableCell className="flex justify-end">
                  <PositionAction copyRunStatus={copyRunStatus} position={row} />
                </TableCell>
              </CopyPositionsGrid>

              <Stack className="gap-3 rounded-xl bg-buttonBlack-60 p-3 lg:hidden">
                <HStack className="items-end justify-between gap-3">
                  <TableCardField label="Token">{row.token.symbol || '—'}</TableCardField>
                  <PositionLifecycleBadge lifecycle={row.lifecycle} quantityState={row.quantityState} />
                </HStack>

                <TableCardGrid>
                  <TableCardField span="full" label="Trade ID">
                    <ShortenedId value={row.tradeId} />
                  </TableCardField>
                  <TableCardField label="Entry Price">{formatUsd(row.entryPriceUsd, 2)}</TableCardField>
                  <TableCardField align="right" label="Current">
                    {formatUsd(row.currentPriceUsd, 2)}
                  </TableCardField>
                  <TableCardField label="Value">{formatUsd(row.valueUsd, 2)}</TableCardField>
                  <TableCardField
                    align="right"
                    label="Unrealised P&amp;L"
                    valueClassName={getSignedMetricClassName(row.unrealizedPnlUsd ?? row.unrealizedPnlPct)}
                  >
                    <Stack className="gap-0.5">
                      <span className="whitespace-nowrap">{signedUsd(row.unrealizedPnlUsd, 2)}</span>
                      <span className="whitespace-nowrap text-xs">{signedPercent(row.unrealizedPnlPct)}</span>
                    </Stack>
                  </TableCardField>
                  <TableCardField label="Est. Rebate" valueClassName="text-warning">
                    {formatApproximateUsd(row.estimatedCashbackUsd, 2)}
                  </TableCardField>
                  <TableCardField align="right" label="Open Since" valueClassName="text-subText">
                    {formatDateTime(row.openedAt)}
                  </TableCardField>
                </TableCardGrid>

                <PositionAction copyRunStatus={copyRunStatus} position={row} />
              </Stack>
            </div>
          ))}
        </TableBody>
      </InfiniteScroll>
    </Stack>
  )
}

import type { HTMLAttributes } from 'react'
import type { PositionSummary } from 'services/copyTrading/types/positions'

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
  type PositionRecoveryContext,
  getPositionRecoveryAction,
} from 'pages/CopyTrading/modals/ManagePositionModal/positionData'
import { useCopyTradingModal } from 'pages/CopyTrading/modals/context'
import { cn } from 'utils/cn'
import { formatDateTime } from 'utils/time'

type TableGridWrapperProps = HTMLAttributes<HTMLDivElement> & {
  header?: boolean
}

type PositionTableProps = {
  infiniteScroll: InfiniteScrollState
  loading?: boolean
  positionContext?: PositionRecoveryContext
  rows: PositionSummary[]
}

const PositionAction = ({
  position,
  positionContext,
}: {
  position: PositionSummary
  positionContext: PositionRecoveryContext
}) => {
  const { openManagePosition } = useCopyTradingModal()
  const availableAction = getPositionRecoveryAction(position, positionContext)
  if (!availableAction) return null

  const isStoppedClose = positionContext === 'leftover'
  const label = isStoppedClose ? 'Close Position' : 'Manual Sell'

  return (
    <ButtonLight
      type="button"
      padding="7px 12px"
      color={isStoppedClose ? 'var(--ks-red)' : 'var(--ks-warning)'}
      className="whitespace-nowrap"
      onClick={event => {
        event.stopPropagation()
        openManagePosition(position, isStoppedClose ? 'closePosition' : 'manualSell')
      }}
    >
      {label}
    </ButtonLight>
  )
}

const CopyPositionsGrid = ({ header, className, ...props }: TableGridWrapperProps) => {
  const Grid = header ? TableHeader : TableRow

  return (
    <Grid
      className={cn(
        'min-w-[1120px] grid-cols-[minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(0,0.85fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(144px,1.1fr)] gap-x-3',
        !header && 'px-4 py-1',
        className,
      )}
      {...props}
    />
  )
}

export const CopyPositionsTable = ({
  infiniteScroll,
  loading,
  positionContext = 'active',
  rows,
}: PositionTableProps) => {
  return (
    <Stack>
      <InfiniteScroll {...infiniteScroll}>
        <CopyPositionsGrid header className="sticky top-0 z-[1] hidden lg:grid">
          <HeaderCell>Trade ID</HeaderCell>
          <HeaderCell>Token</HeaderCell>
          <HeaderCell>Entry Price</HeaderCell>
          <HeaderCell>Current</HeaderCell>
          <HeaderCell>Value</HeaderCell>
          <HeaderCell>Unrealised P&amp;L</HeaderCell>
          <HeaderCell>Est. Rebate</HeaderCell>
          <HeaderCell>Open Since</HeaderCell>
          <HeaderCell>Status</HeaderCell>
          <HeaderCell>Action</HeaderCell>
        </CopyPositionsGrid>
        <TableBody
          className="grid gap-2 bg-transparent lg:block lg:min-w-[1120px] lg:bg-buttonBlack-60"
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
                <TableCell>{formatUsd(row.entryPriceUsd)}</TableCell>
                <TableCell>{formatUsd(row.currentPriceUsd)}</TableCell>
                <TableCell>{formatUsd(row.valueUsd)}</TableCell>
                <TableCell className={getSignedMetricClassName(row.unrealizedPnlUsd ?? row.unrealizedPnlPct)}>
                  <Stack className="gap-0.5">
                    <span className="whitespace-nowrap">{signedUsd(row.unrealizedPnlUsd)}</span>
                    <span className="whitespace-nowrap text-xs">{signedPercent(row.unrealizedPnlPct)}</span>
                  </Stack>
                </TableCell>
                <TableCell className="text-warning">{formatApproximateUsd(row.estimatedCashbackUsd)}</TableCell>
                <TableCell className="text-subText">{formatDateTime(row.openedAt)}</TableCell>
                <TableCell>
                  <PositionLifecycleBadge lifecycle={row.lifecycle} quantityState={row.quantityState} />
                </TableCell>
                <TableCell>
                  <PositionAction position={row} positionContext={positionContext} />
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
                  <TableCardField label="Entry Price">{formatUsd(row.entryPriceUsd)}</TableCardField>
                  <TableCardField align="right" label="Current">
                    {formatUsd(row.currentPriceUsd)}
                  </TableCardField>
                  <TableCardField label="Value">{formatUsd(row.valueUsd)}</TableCardField>
                  <TableCardField
                    align="right"
                    label="Unrealised P&amp;L"
                    valueClassName={getSignedMetricClassName(row.unrealizedPnlUsd ?? row.unrealizedPnlPct)}
                  >
                    <Stack className="gap-0.5">
                      <span className="whitespace-nowrap">{signedUsd(row.unrealizedPnlUsd)}</span>
                      <span className="whitespace-nowrap text-xs">{signedPercent(row.unrealizedPnlPct)}</span>
                    </Stack>
                  </TableCardField>
                  <TableCardField label="Est. Rebate" valueClassName="text-warning">
                    {formatApproximateUsd(row.estimatedCashbackUsd)}
                  </TableCardField>
                  <TableCardField align="right" label="Open Since" valueClassName="text-subText">
                    {formatDateTime(row.openedAt)}
                  </TableCardField>
                </TableCardGrid>

                <PositionAction position={row} positionContext={positionContext} />
              </Stack>
            </div>
          ))}
        </TableBody>
      </InfiniteScroll>
    </Stack>
  )
}

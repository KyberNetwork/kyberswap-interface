import { Trans } from '@lingui/macro'
import React from 'react'
import { ExternalLink, Trash2 } from 'react-feather'

import { TableCell, TableRow, getSmartExitTableGridTemplateColumns } from 'components/Listing/Table'
import ConditionContent from 'pages/Earns/SmartExitOrders/components/ConditionContent'
import TitleContent from 'pages/Earns/SmartExitOrders/components/TitleContent'
import type { ParsedSmartExitOrder } from 'pages/Earns/SmartExitOrders/useSmartExitOrdersData'
import { Badge, BadgeType } from 'pages/Earns/UserPositions/styles'
import { ExecutionStatus, OrderStatus, SmartExitOrder } from 'pages/Earns/types'
import { cn } from 'utils/cn'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'

type OrderItemProps = {
  order: ParsedSmartExitOrder
  index: number
  /** 0-based position within the current page — drives the staggered fade-in delay. */
  rowIndex: number
  upToMedium: boolean
  onDelete: (order: ParsedSmartExitOrder) => void
}

const MobileField = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-10 items-center justify-between gap-2 p-2">{children}</div>
)

const StatusContent = ({ order }: { order: SmartExitOrder }) => (
  <div className="flex items-center justify-start gap-1">
    <Badge
      className="h-max"
      type={
        order.status === OrderStatus.OrderStatusOpen
          ? BadgeType.PRIMARY
          : order.status === OrderStatus.OrderStatusDone
          ? BadgeType.SECONDARY
          : order.status === OrderStatus.OrderStatusCancelled
          ? BadgeType.DISABLED
          : BadgeType.WARNING
      }
    >
      {order.status === OrderStatus.OrderStatusOpen
        ? 'Active'
        : order.status === OrderStatus.OrderStatusDone
        ? 'Executed'
        : order.status === OrderStatus.OrderStatusCancelled
        ? 'Cancelled'
        : order.status === OrderStatus.OrderStatusExpired
        ? 'Expired'
        : order.status}
    </Badge>
    {order.status === OrderStatus.OrderStatusDone &&
    order.executions.some(execution => execution.status === ExecutionStatus.Success) ? (
      <div
        onClick={() => {
          window.open(
            `${getEtherscanLink(
              order.chainId,
              order.executions.find(execution => execution.status === ExecutionStatus.Success)?.hash || '',
              'transaction',
            )}`,
            '_blank',
          )
        }}
        className="flex aspect-square size-6 cursor-pointer items-center justify-center rounded-2xl bg-text-04 text-subText hover:bg-text-08"
      >
        <ExternalLink size={12} />
      </div>
    ) : null}
  </div>
)

const OrderItem = React.memo(({ order, index, rowIndex, upToMedium, onDelete }: OrderItemProps) => {
  // Stagger each row's fade-in by 50ms (capped at 300ms), matching the My Positions list.
  const animationDelay = `${Math.min(rowIndex * 50, 300)}ms`
  const tokenId = order.positionId.split('-')[1]
  const executedAmounts = order.executions[0]?.extraData?.executedAmounts
  const receivedAmounts = order.executions[0]?.extraData?.receivedAmounts
  const tokensInfo = order.executions[0]?.extraData?.tokensInfo

  const currentValue = (
    <span className="flex h-6 items-center text-left text-sm text-subText">
      {executedAmounts
        ? formatDisplayNumber((+executedAmounts[0]?.amountUsd || 0) + (+executedAmounts[1]?.amountUsd || 0), {
            significantDigits: 6,
            style: 'currency',
          })
        : order.position?.currentValue !== undefined
        ? formatDisplayNumber(order.position.currentValue, { significantDigits: 6, style: 'currency' })
        : '-'}
    </span>
  )

  const receivedAmount = receivedAmounts ? (
    <div className={cn('flex flex-col gap-1', upToMedium ? 'items-end' : 'items-start')}>
      <span className="flex h-6 items-center text-sm" style={{ color: '#05966B' }}>
        +{formatDisplayNumber(receivedAmounts[0]?.amount, { significantDigits: 6 })} {tokensInfo?.[0]?.symbol}
      </span>
      <span className="flex h-6 items-center text-sm" style={{ color: '#05966B' }}>
        +{formatDisplayNumber(receivedAmounts[1]?.amount, { significantDigits: 6 })} {tokensInfo?.[1]?.symbol}
      </span>
    </div>
  ) : (
    <div />
  )

  const maxGas = (
    <span className="flex h-6 items-center text-left text-sm text-subText">
      {formatDisplayNumber(order.maxGasPercentage, { significantDigits: 4 })}%
    </span>
  )

  const actionDelete =
    order.status === OrderStatus.OrderStatusOpen ? (
      <div
        role="button"
        onClick={() => onDelete(order)}
        className="flex size-8 cursor-pointer items-center justify-center rounded-xl bg-tableHeader p-1 text-subText hover:text-red"
      >
        <Trash2 size={18} />
      </div>
    ) : (
      <div />
    )

  const condition = (
    <ConditionContent
      logical={order.condition.logical}
      position={order.position}
      status={order.status}
      logs={order.logs}
    />
  )
  const status = <StatusContent order={order} />
  const title = <TitleContent order={order} tokenId={tokenId} />

  if (upToMedium)
    return (
      <div
        className="flex animate-[fadeInUp_0.3s_ease-out_both] flex-col rounded-xl bg-background p-2 motion-reduce:animate-none"
        style={{ animationDelay }}
      >
        <div className="p-2">{title}</div>
        <div className="p-2">{condition}</div>
        <MobileField>
          <span className="text-sm text-subText">
            <Trans>Est. liquidity & earned fee</Trans>:
          </span>
          {currentValue}
        </MobileField>
        {receivedAmounts ? (
          <MobileField>
            <span className="text-sm text-subText">
              <Trans>Received amount</Trans>:
            </span>
            {receivedAmount}
          </MobileField>
        ) : null}
        <MobileField>
          <span className="text-sm text-subText">
            <Trans>Max gas</Trans>:
          </span>
          {maxGas}
        </MobileField>
        <div className="flex min-h-12 items-center justify-between gap-2 p-2">
          {status}
          {actionDelete}
        </div>
      </div>
    )

  return (
    <TableRow
      className="animate-[fadeInUp_0.3s_ease-out_both] text-base text-text hover:bg-primary-10 motion-reduce:animate-none"
      style={{ gridTemplateColumns: getSmartExitTableGridTemplateColumns(), animationDelay }}
    >
      <TableCell>
        <span className="text-subText">{index}</span>
      </TableCell>
      <TableCell>
        <div className="w-full">{title}</div>
      </TableCell>
      <TableCell>
        <div className="w-full">{condition}</div>
      </TableCell>
      <TableCell>{currentValue}</TableCell>
      <TableCell>{receivedAmount}</TableCell>
      <TableCell>{maxGas}</TableCell>
      <TableCell>{status}</TableCell>
      <TableCell className="items-end px-1">{actionDelete}</TableCell>
    </TableRow>
  )
})

OrderItem.displayName = 'OrderItem'

export default OrderItem

import { Trans } from '@lingui/macro'
import React from 'react'
import { ExternalLink, Trash2 } from 'react-feather'

import ConditionContent from 'pages/Earns/SmartExitOrders/components/ConditionContent'
import TitleContent from 'pages/Earns/SmartExitOrders/components/TitleContent'
import { ORDERS_TABLE_GRID_COLUMNS } from 'pages/Earns/SmartExitOrders/constants'
import type { ParsedSmartExitOrder } from 'pages/Earns/SmartExitOrders/useSmartExitOrdersData'
import { Badge, BadgeType } from 'pages/Earns/UserPositions/styles'
import { ExecutionStatus, OrderStatus, SmartExitOrder } from 'pages/Earns/types'
import { getEtherscanLink } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

type OrderItemProps = {
  order: ParsedSmartExitOrder
  index: number
  upToMedium: boolean
  onDelete: (order: ParsedSmartExitOrder) => void
}

const StatusContent = ({ order }: { order: SmartExitOrder }) => (
  <div className="flex items-center justify-start gap-1">
    <Badge
      style={{ height: 'max-content' }}
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

const OrderItem = React.memo(({ order, index, upToMedium, onDelete }: OrderItemProps) => {
  const tokenId = order.positionId.split('-')[1]
  const executedAmounts = order.executions[0]?.extraData?.executedAmounts
  const receivedAmounts = order.executions[0]?.extraData?.receivedAmounts
  const tokensInfo = order.executions[0]?.extraData?.tokensInfo

  const currentValue = (
    <span className="text-left text-sm text-subText">
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
    <div className={`flex flex-col gap-1 ${upToMedium ? 'items-end' : 'items-start'}`}>
      <span className="text-sm" style={{ color: '#05966B' }}>
        + {formatDisplayNumber(receivedAmounts[0]?.amount, { significantDigits: 6 })} {tokensInfo?.[0]?.symbol}
      </span>
      <span className="text-sm" style={{ color: '#05966B' }}>
        + {formatDisplayNumber(receivedAmounts[1]?.amount, { significantDigits: 6 })} {tokensInfo?.[1]?.symbol}
      </span>
    </div>
  ) : (
    <div />
  )

  const maxGas = (
    <span className="text-left text-sm text-subText">
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
      <div key={order.id} className="mb-4 flex flex-col gap-3 rounded-xl bg-background p-4">
        <div>{title}</div>
        {condition}
        <div className="-mt-1 flex items-center justify-between gap-1">
          <span className="text-sm text-subText">
            <Trans>Est. liquidity & earned fee</Trans>:
          </span>
          {currentValue}
        </div>
        {receivedAmounts ? (
          <div className="-mt-1 flex items-center justify-between gap-1">
            <span className="text-sm text-subText">
              <Trans>Received amount</Trans>:
            </span>
            {receivedAmount}
          </div>
        ) : null}
        <div className="-mt-1 flex items-center justify-between gap-1">
          <span className="text-sm text-subText">
            <Trans>Max gas</Trans>:
          </span>
          {maxGas}
        </div>
        <div className="flex items-center justify-between">
          {status}
          {actionDelete}
        </div>
      </div>
    )

  return (
    <div
      key={order.id}
      className="grid items-center gap-4 py-4 text-text"
      style={{ gridTemplateColumns: ORDERS_TABLE_GRID_COLUMNS }}
    >
      <span className="text-subText">{index}</span>
      <div>{title}</div>
      {condition}
      {currentValue}
      {receivedAmount}
      {maxGas}
      {status}
      {actionDelete}
    </div>
  )
})

OrderItem.displayName = 'OrderItem'

export default OrderItem

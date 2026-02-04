import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import React from 'react'
import { ExternalLink, Trash2 } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import ConditionContent from 'pages/Earns/SmartExitOrders/components/ConditionContent'
import TitleContent from 'pages/Earns/SmartExitOrders/components/TitleContent'
import { ORDERS_TABLE_GRID_COLUMNS } from 'pages/Earns/SmartExitOrders/constants'
import type { ParsedSmartExitOrder } from 'pages/Earns/SmartExitOrders/useSmartExitOrdersData'
import { Badge, BadgeType } from 'pages/Earns/UserPositions/styles'
import { OrderStatus, SmartExitOrder } from 'pages/Earns/types'
import { getEtherscanLink } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

const TrashWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.tableHeader};
  border-radius: 12px;
  width: 32px;
  height: 32px;
  padding: 4px;

  cursor: pointer;
  color: ${({ theme }) => theme.subText};

  :hover {
    color: ${({ theme }) => theme.red};
  }
`

const ExternalLinkWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => rgba(theme.text, 0.04)};
  color: ${({ theme }) => theme.subText};
  border-radius: 16px;
  width: 24px;
  height: 24px;
  aspect-ratio: 1/1;
  cursor: pointer;

  :hover {
    background-color: ${({ theme }) => rgba(theme.text, 0.08)};
  }
`

const TableRow = styled.div`
  display: grid;
  grid-template-columns: ${ORDERS_TABLE_GRID_COLUMNS};
  color: ${({ theme }) => theme.text};
  padding: 16px 0;
  gap: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  align-items: center;
`

type OrderItemProps = {
  order: ParsedSmartExitOrder
  index: number
  upToMedium: boolean
  onDelete: (order: ParsedSmartExitOrder) => void
}

const StatusContent = ({ order }: { order: SmartExitOrder }) => (
  <Flex justifyContent="flex-start" alignItems="center" sx={{ gap: '4px' }}>
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
    {order.status === OrderStatus.OrderStatusDone && order.executions.length > 0 ? (
      <ExternalLinkWrapper
        onClick={() => {
          window.open(`${getEtherscanLink(order.chainId, order.executions[0].hash, 'transaction')}`, '_blank')
        }}
      >
        <ExternalLink size={12} />
      </ExternalLinkWrapper>
    ) : null}
  </Flex>
)

const OrderItem = React.memo(({ order, index, upToMedium, onDelete }: OrderItemProps) => {
  const theme = useTheme()
  const tokenId = order.positionId.split('-')[1]
  const executedAmounts = order.executions[0]?.extraData?.executedAmounts
  const receivedAmounts = order.executions[0]?.extraData?.receivedAmounts
  const tokensInfo = order.executions[0]?.extraData?.tokensInfo

  const currentValue = (
    <Text textAlign="left" color={theme.subText} fontSize="14px">
      {executedAmounts
        ? formatDisplayNumber((+executedAmounts[0]?.amountUsd || 0) + (+executedAmounts[1]?.amountUsd || 0), {
            significantDigits: 6,
            style: 'currency',
          })
        : order.position?.currentValue !== undefined
        ? formatDisplayNumber(order.position.currentValue, { significantDigits: 6, style: 'currency' })
        : '-'}
    </Text>
  )

  const receivedAmount = receivedAmounts ? (
    <Flex flexDirection={'column'} sx={{ gap: '4px' }} alignItems={upToMedium ? 'flex-end' : 'flex-start'}>
      <Text color={'#05966B'} fontSize="14px">
        + {formatDisplayNumber(receivedAmounts[0]?.amount, { significantDigits: 6 })} {tokensInfo?.[0]?.symbol}
      </Text>
      <Text color={'#05966B'} fontSize="14px">
        + {formatDisplayNumber(receivedAmounts[1]?.amount, { significantDigits: 6 })} {tokensInfo?.[1]?.symbol}
      </Text>
    </Flex>
  ) : (
    <div />
  )

  const maxGas = (
    <Text textAlign="left" color={theme.subText} fontSize="14px">
      {formatDisplayNumber(order.maxGasPercentage, { significantDigits: 4 })}%
    </Text>
  )

  const actionDelete =
    order.status === OrderStatus.OrderStatusOpen ? (
      <TrashWrapper
        onClick={() => {
          onDelete(order)
        }}
        role="button"
      >
        <Trash2 size={18} />
      </TrashWrapper>
    ) : (
      <div />
    )

  const condition = (
    <ConditionContent logical={order.condition.logical} position={order.position} upToMedium={upToMedium} />
  )
  const status = <StatusContent order={order} />
  const title = <TitleContent order={order} tokenId={tokenId} />

  if (upToMedium)
    return (
      <Flex
        backgroundColor={theme.background}
        key={order.id}
        flexDirection="column"
        padding="1rem"
        mb="1rem"
        sx={{ borderRadius: '12px', gap: '12px' }}
      >
        <div>{title}</div>
        {condition}
        <Flex alignItems="center" sx={{ gap: '4px' }} justifyContent="space-between" mt="-4px">
          <Text color={theme.subText} fontSize="14px">
            <Trans>Est. liquidity & earned fee</Trans>:
          </Text>
          {currentValue}
        </Flex>
        {receivedAmounts ? (
          <Flex alignItems="center" sx={{ gap: '4px' }} justifyContent="space-between" mt="-4px">
            <Text color={theme.subText} fontSize="14px">
              <Trans>Received amount</Trans>:
            </Text>
            {receivedAmount}
          </Flex>
        ) : null}
        <Flex alignItems="center" sx={{ gap: '4px' }} justifyContent="space-between" mt="-4px">
          <Text color={theme.subText} fontSize="14px">
            <Trans>Max gas</Trans>:
          </Text>
          {maxGas}
        </Flex>
        <Flex justifyContent="space-between" alignItems="center">
          {status}
          {actionDelete}
        </Flex>
      </Flex>
    )

  return (
    <TableRow key={order.id}>
      <Text color={theme.subText}>{index}</Text>
      <div>{title}</div>
      {condition}
      {currentValue}
      {receivedAmount}
      {maxGas}
      {status}
      {actionDelete}
    </TableRow>
  )
})

OrderItem.displayName = 'OrderItem'

export default OrderItem

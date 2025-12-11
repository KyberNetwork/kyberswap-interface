import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import React from 'react'
import { ExternalLink, Trash2 } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { Badge, BadgeType, ImageContainer } from 'pages/Earns/UserPositions/styles'
import { Exchange } from 'pages/Earns/constants'
import { OrderStatus, PositionStatus, SmartExitOrder } from 'pages/Earns/types'
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
  grid-template-columns: 1fr 1fr 0.5fr 0.5fr 40px;
  color: ${({ theme }) => theme.text};
  padding: 16px 0;
  gap: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  align-items: center;
`

export type PositionDetail = {
  id: string
  currentAmounts: { token: { symbol: string; logo?: string } }[]
  chainLogo?: string
  pool: { exchange: Exchange; tickSpacing: number; projectLogo?: string }
  status?: PositionStatus
}

type ConditionLogical = SmartExitOrder['condition']['logical']

type OrderItemProps = {
  order: SmartExitOrder
  posDetail: PositionDetail
  upToMedium: boolean
  onDelete: (order: SmartExitOrder) => void
}

const getProtocolLabel = (exchange: Exchange) => {
  switch (exchange) {
    case Exchange.DEX_UNISWAPV3:
    case Exchange.DEX_PANCAKESWAPV3:
      return 'V3'
    case Exchange.DEX_UNISWAP_V4:
      return 'V4'
    case Exchange.DEX_UNISWAP_V4_FAIRFLOW:
    case Exchange.DEX_PANCAKE_INFINITY_CL_FAIRFLOW:
      return 'FairFlow'
    default:
      return exchange
  }
}

const ConditionContent = ({ logical }: { logical: ConditionLogical }) => {
  const theme = useTheme()
  const { conditions, op } = logical

  return (
    <Flex flexDirection="column" sx={{ gap: '4px', fontSize: '14px' }}>
      {conditions.map((c, i) => {
        if (c.field.type === 'fee_yield')
          return (
            <Text color={theme.subText} key={`${c.field.type}-${i}`}>
              The{' '}
              <Text as="span" color={theme.text}>
                fee yield ≥ {Number(c.field.value.gte.toFixed(2))}%
              </Text>{' '}
              {i !== conditions.length - 1 && (
                <Text as="span" fontWeight={500} color={theme.text}>
                  {op.toUpperCase()}
                </Text>
              )}
            </Text>
          )

        if (c.field.type === 'pool_price')
          return (
            <Text color={theme.subText} key={`${c.field.type}-${i}`}>
              Pool price is {c.field.value.lte ? '≤' : '≥'}{' '}
              <Text as="span" color={theme.text}>
                {formatDisplayNumber(c.field.value.gte || c.field.value.lte, { significantDigits: 6 })}
              </Text>{' '}
              {i !== conditions.length - 1 && (
                <Text as="span" fontWeight={500} color={theme.text}>
                  {op.toUpperCase()}
                </Text>
              )}
            </Text>
          )

        if (c.field.type === 'time')
          return (
            <React.Fragment key={`${c.field.type}-${i}`}>
              <Text color={theme.subText} sx={{ gap: '4px' }}>
                {c.field.value.lte > 0 && c.field.value.lte < 4914460753 ? (
                  <>
                    <Trans>Before</Trans>{' '}
                    <Text as="span" color={theme.text}>
                      {dayjs(c.field.value.lte * 1000).format('DD/MM/YYYY HH:mm:ss')}
                    </Text>
                  </>
                ) : null}

                {c.field.value.gte > 0 && c.field.value.gte < 4914460753 ? (
                  <Text>
                    <Trans>After</Trans>{' '}
                    <Text as="span" color={theme.text}>
                      {dayjs(c.field.value.gte * 1000).format('DD/MM/YYYY HH:mm:ss')}
                    </Text>
                  </Text>
                ) : null}
              </Text>
              {i !== conditions.length - 1 && (
                <Text fontWeight={500} color={theme.text} mt="4px">
                  {op.toUpperCase()}
                </Text>
              )}
            </React.Fragment>
          )
        return null
      })}
    </Flex>
  )
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

const TitleContent = ({
  posDetail,
  token0,
  token1,
  tokenId,
}: {
  posDetail: PositionDetail
  token0: { symbol: string; logo?: string }
  token1: { symbol: string; logo?: string }
  tokenId: string
}) => {
  const theme = useTheme()
  const protocol = getProtocolLabel(posDetail.pool.exchange)
  const posStatus = posDetail.status || PositionStatus.IN_RANGE

  return (
    <>
      <Flex alignItems="center">
        <ImageContainer>
          <TokenLogo src={token0.logo} />
          <TokenLogo src={token1.logo} translateLeft />
          <TokenLogo src={posDetail.chainLogo} size={12} translateLeft translateTop />
        </ImageContainer>
        <Text mr="8px">
          {token0.symbol}/{token1.symbol}
        </Text>
        <Badge>Fee {posDetail?.pool.tickSpacing / 10_0}%</Badge>
      </Flex>
      <Flex alignItems="center" sx={{ gap: '4px' }} mt="4px" ml="1rem">
        <TokenLogo src={posDetail.pool.projectLogo} size={16} />
        <Text color={theme.subText}>
          {protocol} #{tokenId}
        </Text>
        <Badge
          type={
            posStatus === PositionStatus.IN_RANGE
              ? BadgeType.PRIMARY
              : posStatus === PositionStatus.OUT_RANGE
              ? BadgeType.WARNING
              : BadgeType.DISABLED
          }
        >
          ●{' '}
          {posStatus === PositionStatus.IN_RANGE
            ? t`In range`
            : posStatus === PositionStatus.OUT_RANGE
            ? t`Out of range`
            : t`Closed`}
        </Badge>
      </Flex>
    </>
  )
}

const OrderItem = ({ order, posDetail, upToMedium, onDelete }: OrderItemProps) => {
  const theme = useTheme()
  const token0 = posDetail.currentAmounts[0].token
  const token1 = posDetail.currentAmounts[1].token
  const tokenId = order.positionId.split('-')[1]

  const maxGas = (
    <Text textAlign="left" color={theme.subText} fontSize="14px">
      {formatDisplayNumber(order.maxFeesPercentage[0], { significantDigits: 4 })}%
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

  const condition = <ConditionContent logical={order.condition.logical} />
  const status = <StatusContent order={order} />
  const title = <TitleContent posDetail={posDetail} token0={token0} token1={token1} tokenId={tokenId} />

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
        <Flex alignItems="center" sx={{ gap: '4px' }} justifyContent="flex-start" mt="-4px">
          <Text color={theme.subText} fontSize="14px">
            <Trans>Max Gas</Trans>:
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
      <div>{title}</div>
      {condition}
      {maxGas}
      {status}
      {actionDelete}
    </TableRow>
  )
}

export default OrderItem

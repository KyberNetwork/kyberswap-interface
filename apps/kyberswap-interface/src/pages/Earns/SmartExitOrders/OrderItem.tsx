import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import React from 'react'
import { ExternalLink, Trash2 } from 'react-feather'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import UnknownToken from 'assets/svg/kyber/unknown-token.svg'
import TokenLogo from 'components/TokenLogo'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import type { ParsedSmartExitOrder } from 'pages/Earns/SmartExitOrders/useSmartExitOrdersData'
import { Badge, BadgeType, ImageContainer } from 'pages/Earns/UserPositions/styles'
import { SmartExitDexType } from 'pages/Earns/components/SmartExit/constants'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { OrderStatus, PositionStatus, SmartExitOrder } from 'pages/Earns/types'
import { getDexVersion } from 'pages/Earns/utils/position'
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
  grid-template-columns: 1.2fr 1fr 0.6fr 0.7fr 0.5fr 0.5fr 40px;
  color: ${({ theme }) => theme.text};
  padding: 16px 0;
  gap: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  align-items: center;
`

type ConditionLogical = SmartExitOrder['condition']['logical']

type OrderItemProps = {
  order: ParsedSmartExitOrder
  upToMedium: boolean
  onDelete: (order: ParsedSmartExitOrder) => void
}

// Map SmartExitDexType to Exchange - memoized once
const DEX_TYPE_TO_EXCHANGE_MAP = Object.entries(EARN_DEXES).reduce((acc, [exchange, dexInfo]) => {
  if (dexInfo.smartExitDexType) {
    acc[dexInfo.smartExitDexType] = exchange as Exchange
  }
  return acc
}, {} as Record<SmartExitDexType, Exchange>)

// Map SmartExitDexType to Exchange and get dex info
const getDexInfoFromDexType = (dexType: string) => {
  const exchange = DEX_TYPE_TO_EXCHANGE_MAP[dexType as SmartExitDexType]
  if (!exchange) return null

  const dexInfo = EARN_DEXES[exchange]
  return { exchange, dexInfo }
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

const TitleContent = ({ order, tokenId }: { order: ParsedSmartExitOrder; tokenId: string }) => {
  const theme = useTheme()

  if (!order.position) {
    // Show placeholder with order info when position is not available
    const chainInfo = NETWORKS_INFO[order.chainId as ChainId]
    const dexMapping = getDexInfoFromDexType(order.dexType)
    const dexVersion = dexMapping ? getDexVersion(dexMapping.exchange) : ''

    return (
      <>
        <Flex alignItems="center" sx={{ opacity: 0.6 }}>
          <ImageContainer>
            <TokenLogo src={UnknownToken} size={24} style={{ opacity: 0.6 }} />
            <TokenLogo src={UnknownToken} size={24} translateLeft style={{ opacity: 0.6 }} />
            {chainInfo?.icon && (
              <TokenLogo src={chainInfo.icon} size={12} translateLeft translateTop style={{ opacity: 0.6 }} />
            )}
          </ImageContainer>
          <Text mr="8px" color={theme.subText} fontStyle="italic">
            <Trans>Position</Trans> #{tokenId}
          </Text>
        </Flex>
        <Flex alignItems="center" sx={{ gap: '4px', opacity: 0.6 }} mt="4px" ml="1rem">
          {dexMapping?.dexInfo.logo && <TokenLogo src={dexMapping.dexInfo.logo} size={16} style={{ opacity: 0.6 }} />}
          {dexVersion && (
            <Text color={theme.subText} fontStyle="italic" fontSize={14}>
              {dexVersion}
            </Text>
          )}
        </Flex>
      </>
    )
  }

  const posDetail = order.position
  const protocol = getDexVersion(posDetail.dex.id)
  const posStatus = posDetail.status || PositionStatus.IN_RANGE

  // Build position detail URL
  const positionDetailUrl = APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', order.positionId)
    .replace(':chainId', order.chainId.toString())
    .replace(':exchange', posDetail.dex.id)

  return (
    <>
      <Flex alignItems="center">
        <ImageContainer>
          <TokenLogo src={posDetail.token0.logo} />
          <TokenLogo src={posDetail.token1.logo} translateLeft />
          <TokenLogo src={posDetail.chain.logo} size={12} translateLeft translateTop />
        </ImageContainer>
        <Link to={positionDetailUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Text mr="8px" sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
            {posDetail.token0.symbol}/{posDetail.token1.symbol}
          </Text>
        </Link>
        <Badge>Fee {posDetail.poolFee}%</Badge>
      </Flex>
      <Flex alignItems="center" sx={{ gap: '4px' }} mt="4px" ml="1rem">
        <TokenLogo src={posDetail.dex.logo} size={16} />
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

const OrderItem = React.memo(({ order, upToMedium, onDelete }: OrderItemProps) => {
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

  const condition = <ConditionContent logical={order.condition.logical} />
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

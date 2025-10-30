import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import React, { useState } from 'react'
import { Trash2, X } from 'react-feather'
import { useNavigate } from 'react-router'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import {
  SmartExitOrder,
  useCancelSmartExitOrderMutation,
  useGetSmartExitCancelSignMessageMutation,
  useGetSmartExitOrdersQuery,
} from 'services/smartExit'
import { useUserPositionsQuery } from 'services/zapEarn'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import LocalLoader from 'components/LocalLoader'
import Modal from 'components/Modal'
import Pagination from 'components/Pagination'
import TokenLogo from 'components/TokenLogo'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { PoolPageWrapper, TableWrapper } from 'pages/Earns/PoolExplorer/styles'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import Filter from 'pages/Earns/SmartExit/Filter'
import useSmartExitFilter, { OrderStatus } from 'pages/Earns/SmartExit/useSmartExitFilter'
import { Badge, BadgeType, ImageContainer } from 'pages/Earns/UserPositions/styles'
import { EarnChain, Exchange } from 'pages/Earns/constants'
import { PositionStatus } from 'pages/Earns/types'
import { useNotify } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { enumToArrayOfValues } from 'utils'
import { friendlyError } from 'utils/errorMessage'

const Trash = styled.div`
  width: 20px;
  height: 20px;
  cursor: pointer;
  color: ${({ theme }) => theme.subText};

  :hover {
    color: ${({ theme }) => theme.red};
  }
`

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 0.5fr 40px;
  color: ${({ theme }) => theme.subText};
  padding: 16px 0;
  gap: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`

const TableRow = styled(TableHeader)`
  align-items: center;
  color: ${({ theme }) => theme.text};
`

const SmartExit = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const notify = useNotify()

  const { filters, updateFilters } = useSmartExitFilter()

  const [showCancelConfirm, setShowCancelConfirm] = useState<SmartExitOrder | null>(null)
  const [removing, setRemoving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const pageSize = 10 // Fixed page size

  const [getCancelSignMsg] = useGetSmartExitCancelSignMessageMutation()
  const [cancelOrder] = useCancelSmartExitOrderMutation()

  const { changeNetwork } = useChangeNetwork()
  const handleRemove = async () => {
    if (!showCancelConfirm || !account || !library) return

    if (showCancelConfirm?.chainId && +chainId !== +showCancelConfirm.chainId) {
      changeNetwork(+showCancelConfirm.chainId)
      return
    }

    setRemoving(true)

    try {
      // Step 1: Get sign message from API
      const signMessageResult = await getCancelSignMsg({
        chainId: showCancelConfirm.chainId,
        userWallet: account,
        orderId: +showCancelConfirm.id,
      }).unwrap()

      const typedData = signMessageResult.message

      if (!typedData || !typedData.domain || !typedData.types || !typedData.message) {
        throw new Error('Failed to get valid typed data from API')
      }

      // Step 2: Sign the typed data
      console.log('Signing cancel typed data:', typedData)
      const signature = await library.send('eth_signTypedData_v4', [account, JSON.stringify(typedData)])

      // Step 3: Cancel the order with signature
      await cancelOrder({
        orderId: +showCancelConfirm.id,
        chainId: showCancelConfirm.chainId,
        userWallet: account,
        signature,
      }).unwrap()

      notify({
        type: NotificationType.SUCCESS,
        title: t`Smart Exit Order Cancelled`,
        summary: t`Your smart exit order has been successfully cancelled.`,
      })

      setShowCancelConfirm(null)
    } catch (error) {
      const message = friendlyError(error)
      console.error('Cancel smart exit order error:', { message, error })

      notify({
        title: t`Cancel Smart Exit Error`,
        summary: message,
        type: NotificationType.ERROR,
      })
    } finally {
      setRemoving(false)
    }
  }

  // Fetch smart exit orders
  const {
    data: ordersData,
    isLoading: smartExitLoading,
    isFetching,
    error: ordersError,
  } = useGetSmartExitOrdersQuery(
    {
      chainIds: filters.chainIds || undefined,
      userWallet: account || '',
      status: filters.status || undefined,
      dexTypes: filters.dexTypes || undefined,
      page: currentPage,
      pageSize,
    },
    {
      skip: !account,
      pollingInterval: 30000, // Poll every 30 seconds
    },
  )

  const orders = ordersData?.orders || []
  const totalItems = ordersData?.totalItems || 0

  const earnSupportedChains = enumToArrayOfValues(EarnChain, 'number')
  const earnSupportedExchanges = enumToArrayOfValues(Exchange)
  const { data: userPosition, isLoading: userPosLoading } = useUserPositionsQuery(
    {
      chainIds: earnSupportedChains.join(','),
      addresses: account || '',
      protocols: earnSupportedExchanges.join(','),
      positionStatus: 'all',
    },
    {
      skip: !account,
      pollingInterval: 15_000,
    },
  )

  const loading = smartExitLoading || userPosLoading || isFetching

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  return (
    <PoolPageWrapper>
      <Flex alignItems="center" sx={{ gap: 3 }}>
        <IconArrowLeft onClick={() => navigate(-1)} />
        <Text as="h1" fontSize={24} fontWeight="500">
          <Trans>Smart Exit Orders</Trans>
        </Text>
      </Flex>

      <Filter
        filters={filters}
        updateFilters={(...args) => {
          updateFilters(...args)
        }}
      />

      <TableWrapper style={{ padding: '16px 20px 0', background: upToMedium ? 'transparent' : undefined }}>
        {!upToMedium && (
          <TableHeader>
            <Text>
              <Trans>Position</Trans>
            </Text>
            <Text>
              <Trans>Conditional</Trans>
            </Text>
            <Text textAlign="center">
              <Trans>Status</Trans>
            </Text>
            <div></div>
          </TableHeader>
        )}

        {loading ? (
          <Flex justifyContent="center" padding="20px">
            <LocalLoader />
          </Flex>
        ) : ordersError || orders?.length === 0 ? (
          <Flex justifyContent="center" padding="20px">
            <Text color="subText">
              <Trans>No smart exit orders found</Trans>
            </Text>
          </Flex>
        ) : (
          orders.map(order => {
            const posDetail = userPosition?.find(us => order.positionId === us.id)
            if (!posDetail) return null
            const token0 = posDetail.currentAmounts[0].token
            const token1 = posDetail.currentAmounts[1].token
            const tokenId = order.positionId.split('-')[1]

            const { conditions, op } = order.condition.logical

            const protocol = (() => {
              switch (posDetail.pool.exchange) {
                case Exchange.DEX_UNISWAPV3:
                case Exchange.DEX_PANCAKESWAPV3:
                  return 'V3'
                case Exchange.DEX_UNISWAP_V4:
                  return 'V4'
                case Exchange.DEX_UNISWAP_V4_FAIRFLOW:
                case Exchange.DEX_PANCAKE_INFINITY_CL_FAIRFLOW:
                  return 'FairFlow'
                default:
                  return posDetail.pool.exchange
              }
            })()
            const posStatus = posDetail.status || PositionStatus.IN_RANGE
            const title = (
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

            const condition = (
              <Flex flexDirection="column" sx={{ gap: '4px', fontSize: '14px' }}>
                {conditions.map((c, i) => {
                  if (c.field.type === 'fee_yield')
                    return (
                      <Text color={theme.subText} key={i}>
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
                      <Text color={theme.subText} key={i}>
                        Pool price is between{' '}
                        <Text as="span" color={theme.text}>
                          {c.field.value.gte}
                        </Text>{' '}
                        and{' '}
                        <Text as="span" color={theme.text}>
                          {c.field.value.lte}
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
                      <React.Fragment key={i}>
                        <Text key={i} color={theme.subText} sx={{ gap: '4px' }}>
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
            const status = (
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
            )

            const actionDelete = (
              <Flex
                sx={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  backgroundColor: theme.subText + '33',
                  padding: '8px',
                  width: '32px',
                  height: '32px',
                }}
                onClick={() => {
                  setShowCancelConfirm(order)
                }}
                role="button"
              >
                <Trash>
                  <Trash2 size={18} />
                </Trash>
              </Flex>
            )

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
                  <Flex justifyContent="space-between" alignItems="center">
                    {status}
                    {order.status === OrderStatus.OrderStatusOpen ? actionDelete : <div />}
                  </Flex>
                </Flex>
              )

            return (
              <TableRow key={order.id}>
                <div>{title}</div>

                {condition}

                <Flex justifyContent="center">{status}</Flex>
                {order.status === OrderStatus.OrderStatusOpen ? actionDelete : <div />}
              </TableRow>
            )
          })
        )}

        <Pagination
          onPageChange={setCurrentPage}
          totalCount={loading ? 0 : totalItems}
          currentPage={currentPage}
          pageSize={pageSize}
        />
      </TableWrapper>

      <Modal isOpen={!!showCancelConfirm} onDismiss={() => setShowCancelConfirm(null)}>
        <Flex width="100%" flexDirection="column" padding="20px" sx={{ gap: '24px' }}>
          <Flex justifyContent="space-between" alignItems="center">
            <Text fontSize={20} fontWeight={500}>
              <Trans>Removing a Smart Exit</Trans>
            </Text>
            <X onClick={() => setShowCancelConfirm(null)} />
          </Flex>
          <Trans>Are you sure you want to remove this Smart Exit?</Trans>
          <Flex sx={{ gap: '1rem' }}>
            <ButtonOutlined onClick={() => setShowCancelConfirm(null)}>
              <Trans>Cancel</Trans>
            </ButtonOutlined>
            <ButtonPrimary onClick={handleRemove} disabled={removing}>
              {removing ? (
                <Trans>Removing...</Trans>
              ) : showCancelConfirm?.chainId && +chainId !== +showCancelConfirm.chainId ? (
                <Trans>Switch Chain</Trans>
              ) : (
                <Trans>Remove</Trans>
              )}
            </ButtonPrimary>
          </Flex>
        </Flex>
      </Modal>
    </PoolPageWrapper>
  )
}

export default SmartExit

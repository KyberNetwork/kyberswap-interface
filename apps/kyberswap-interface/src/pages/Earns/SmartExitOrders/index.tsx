import { Trans, t } from '@lingui/macro'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'react-feather'
import { useNavigate } from 'react-router'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import {
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
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { PoolPageWrapper, TableWrapper } from 'pages/Earns/PoolExplorer/styles'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import Filter from 'pages/Earns/SmartExitOrders/Filter'
import OrderItem, { PositionDetail } from 'pages/Earns/SmartExitOrders/OrderItem'
import useSmartExitFilter from 'pages/Earns/SmartExitOrders/useSmartExitFilter'
import { DEX_TYPE_MAPPING, DexType } from 'pages/Earns/components/SmartExit/constants'
import { Exchange } from 'pages/Earns/constants'
import { SmartExitOrder } from 'pages/Earns/types'
import { useNotify } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { friendlyError } from 'utils/errorMessage'

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 0.5fr 0.5fr 40px;
  color: ${({ theme }) => theme.subText};
  padding: 16px 0;
  gap: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`

const SmartExit = () => {
  const navigate = useNavigate()
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const notify = useNotify()

  const { filters, updateFilters } = useSmartExitFilter()

  const [showCancelConfirm, setShowCancelConfirm] = useState<SmartExitOrder | null>(null)
  const [removing, setRemoving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageLoading, setPageLoading] = useState(false)
  const lastUserPositionsRef = useRef<typeof userPosition>()
  const lastFilteredOrdersRef = useRef<SmartExitOrder[]>([])

  const pageSize = 10 // Fixed page size

  const [getCancelSignMsg] = useGetSmartExitCancelSignMessageMutation()
  const [cancelOrder] = useCancelSmartExitOrderMutation()

  const { changeNetwork } = useChangeNetwork()
  const handleRemove = useCallback(async () => {
    if (!showCancelConfirm || !account || !library) return

    if (showCancelConfirm?.chainId && +chainId !== +showCancelConfirm.chainId) {
      changeNetwork(+showCancelConfirm.chainId)
      return
    }

    setRemoving(true)

    try {
      const signMessageResult = await getCancelSignMsg({
        chainId: showCancelConfirm.chainId,
        userWallet: account,
        orderId: +showCancelConfirm.id,
      }).unwrap()

      const typedData = signMessageResult.message

      if (!typedData || !typedData.domain || !typedData.types || !typedData.message) {
        throw new Error('Failed to get valid typed data from API')
      }

      const signature = await library.send('eth_signTypedData_v4', [account, JSON.stringify(typedData)])

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
  }, [account, cancelOrder, changeNetwork, chainId, getCancelSignMsg, library, notify, showCancelConfirm])

  // Fetch smart exit orders
  const {
    data: ordersData,
    isLoading: smartExitLoading,
    isFetching: smartExitFetching,
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

  const orders = useMemo(() => ordersData?.orders || [], [ordersData])
  const totalItems = ordersData?.totalItems || 0

  const listUniqueChainIds = useMemo(() => [...new Set(orders.map(order => order.chainId))], [orders])
  const listUniqueExchanges = useMemo(() => {
    const dexTypeToExchange = Object.entries(DEX_TYPE_MAPPING).reduce((acc, [exchange, dexType]) => {
      if (dexType) {
        acc[dexType] = exchange as Exchange
      }
      return acc
    }, {} as Record<DexType, Exchange>)

    return [
      ...new Set(
        orders
          .map(order => dexTypeToExchange[order.dexType as DexType])
          .filter((exchange): exchange is Exchange => Boolean(exchange)),
      ),
    ]
  }, [orders])
  const listPositionIds = useMemo(() => [...new Set(orders.map(order => order.positionId))], [orders])

  const {
    data: userPosition,
    isLoading: userPosLoading,
    isFetching: userPosFetching,
  } = useUserPositionsQuery(
    {
      chainIds: listUniqueChainIds.join(','),
      addresses: account || '',
      protocols: listUniqueExchanges.join(','),
      positionIds: listPositionIds.join(','),
      positionStatus: 'all',
    },
    {
      skip: !account,
    },
  )

  const isInitialOrdersLoading = smartExitLoading && !ordersData
  const isInitialUserPosLoading = userPosLoading && !userPosition
  const tableLoading = isInitialOrdersLoading || isInitialUserPosLoading
  const overlayLoading = pageLoading && !tableLoading
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  useEffect(() => {
    if (userPosition && userPosition.length) {
      lastUserPositionsRef.current = userPosition
    }
  }, [userPosition])

  useEffect(() => {
    if (!pageLoading) return
    if (!smartExitFetching && !userPosFetching) {
      setPageLoading(false)
    }
  }, [pageLoading, smartExitFetching, userPosFetching])

  const positionsById = useMemo(() => {
    const positions = userPosition && userPosition.length ? userPosition : lastUserPositionsRef.current || []
    return positions.reduce((acc, pos) => {
      acc[pos.id] = pos
      return acc
    }, {} as Record<string, PositionDetail>)
  }, [userPosition])

  const filteredOrders = useMemo(() => orders.filter(order => positionsById[order.positionId]), [orders, positionsById])

  useEffect(() => {
    if (filteredOrders.length) {
      lastFilteredOrdersRef.current = filteredOrders
    }
  }, [filteredOrders])
  const handleDeleteRequest = useCallback((order: SmartExitOrder) => setShowCancelConfirm(order), [])
  const handleDismissModal = useCallback(() => setShowCancelConfirm(null), [])
  const handlePageChange = useCallback((page: number) => {
    setPageLoading(true)
    setCurrentPage(page)
  }, [])
  const ordersEmptyMessage = useMemo(
    () => (ordersError ? friendlyError(ordersError as unknown as Error) : t`No smart exit orders found`),
    [ordersError],
  )

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

      <TableWrapper
        style={{
          padding: '16px 20px 0',
          background: upToMedium ? 'transparent' : undefined,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {!upToMedium && (
          <TableHeader>
            <Text>
              <Trans>Position</Trans>
            </Text>
            <Text>
              <Trans>Conditional</Trans>
            </Text>
            <Text textAlign="left">
              <Trans>Max Gas</Trans>
            </Text>
            <Text textAlign="left">
              <Trans>Status</Trans>
            </Text>
            <div></div>
          </TableHeader>
        )}

        {tableLoading ? (
          <Flex justifyContent="center" padding="20px">
            <LocalLoader />
          </Flex>
        ) : ordersError || (filteredOrders.length === 0 && !overlayLoading && !userPosFetching) ? (
          <Flex justifyContent="center" padding="20px">
            <Text color="subText">{ordersEmptyMessage}</Text>
          </Flex>
        ) : (
          (filteredOrders.length ? filteredOrders : lastFilteredOrdersRef.current).map(order => {
            const posDetail = positionsById[order.positionId]
            if (!posDetail) return null

            return (
              <OrderItem
                key={order.id}
                order={order}
                posDetail={posDetail}
                upToMedium={upToMedium}
                onDelete={handleDeleteRequest}
              />
            )
          })
        )}

        {overlayLoading && (
          <Flex
            justifyContent="center"
            alignItems="center"
            backgroundColor="rgba(0, 0, 0, 0.4)"
            sx={{ position: 'absolute', inset: 0, backdropFilter: 'blur(1px)' }}
          >
            <LocalLoader />
          </Flex>
        )}

        <Pagination
          onPageChange={handlePageChange}
          totalCount={tableLoading ? 0 : totalItems}
          currentPage={currentPage}
          pageSize={pageSize}
        />
      </TableWrapper>

      <Modal isOpen={!!showCancelConfirm} onDismiss={handleDismissModal}>
        <Flex width="100%" flexDirection="column" padding="20px" sx={{ gap: '24px' }}>
          <Flex justifyContent="space-between" alignItems="center">
            <Text fontSize={20} fontWeight={500}>
              <Trans>Removing a Smart Exit</Trans>
            </Text>
            <X onClick={handleDismissModal} />
          </Flex>
          <Trans>Are you sure you want to remove this Smart Exit?</Trans>
          <Flex sx={{ gap: '1rem' }}>
            <ButtonOutlined onClick={handleDismissModal}>
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

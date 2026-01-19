import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useMemo, useState } from 'react'
import { X } from 'react-feather'
import { useNavigate } from 'react-router'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useCancelSmartExitOrderMutation, useGetSmartExitCancelSignMessageMutation } from 'services/smartExit'
import styled from 'styled-components'

import { ReactComponent as IconUserEarnPosition } from 'assets/svg/earn/ic_user_earn_position.svg'
import { NotificationType } from 'components/Announcement/type'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import LocalLoader from 'components/LocalLoader'
import Modal from 'components/Modal'
import Pagination from 'components/Pagination'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { NavigateButton, PoolPageWrapper, TableWrapper } from 'pages/Earns/PoolExplorer/styles'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import Filter from 'pages/Earns/SmartExitOrders/Filter'
import OrderItem from 'pages/Earns/SmartExitOrders/OrderItem'
import useSmartExitFilter from 'pages/Earns/SmartExitOrders/useSmartExitFilter'
import { useSmartExitOrdersData } from 'pages/Earns/SmartExitOrders/useSmartExitOrdersData'
import { SmartExitOrder } from 'pages/Earns/types'
import { useNotify } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { friendlyError } from 'utils/errorMessage'

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr 0.6fr 0.7fr 0.5fr 0.5fr 40px;
  color: ${({ theme }) => theme.subText};
  padding: 16px 0;
  gap: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`

const SMART_EXIT_ORDERS_PAGE_SIZE = 10

const SmartExit = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const notify = useNotify()

  const { filters, updateFilters } = useSmartExitFilter()

  const [showCancelConfirm, setShowCancelConfirm] = useState<SmartExitOrder | null>(null)
  const [removing, setRemoving] = useState(false)

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

  const {
    currentPage,
    totalItems,
    tableLoading,
    overlayLoading,
    renderedOrders,
    handlePageChange,
    ordersEmptyMessage,
    shouldShowEmptyState,
  } = useSmartExitOrdersData({ account, filters, pageSize: SMART_EXIT_ORDERS_PAGE_SIZE, updateFilters })
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const handleDeleteRequest = useCallback((order: SmartExitOrder) => setShowCancelConfirm(order), [])
  const handleDismissModal = useCallback(() => setShowCancelConfirm(null), [])

  const tableWrapperStyle = useMemo(
    () => ({
      padding: '16px 20px 0',
      background: upToMedium ? 'transparent' : undefined,
      position: 'relative' as const,
      overflow: 'hidden' as const,
    }),
    [upToMedium],
  )

  const overlayStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      inset: 0,
      backdropFilter: overlayLoading ? 'blur(1px)' : 'none',
      opacity: overlayLoading ? 1 : 0,
      pointerEvents: overlayLoading ? ('auto' as const) : ('none' as const),
      transition: 'opacity 150ms ease-in-out, background-color 150ms ease-in-out',
    }),
    [overlayLoading],
  )

  const overlayBackgroundColor = useMemo(
    () => (overlayLoading ? rgba(theme.black, 0.4) : rgba(theme.black, 0)),
    [overlayLoading, theme.black],
  )

  return (
    <PoolPageWrapper>
      <Flex alignItems="center" justifyContent="space-between" flexWrap={'wrap'} sx={{ gap: 2 }}>
        <Flex alignItems="center" sx={{ gap: 3 }}>
          <IconArrowLeft onClick={() => navigate(-1)} />
          <Text as="h1" fontSize={24} fontWeight="500">
            <Trans>Smart Exit Orders</Trans>
          </Text>
        </Flex>
        <NavigateButton
          mobileFullWidth
          icon={<IconUserEarnPosition />}
          text={t`My Positions`}
          to={APP_PATHS.EARN_POSITIONS}
        />
      </Flex>

      <Filter filters={filters} updateFilters={updateFilters} />

      <TableWrapper style={tableWrapperStyle}>
        {!upToMedium && (
          <TableHeader>
            <Text>
              <Trans>Position</Trans>
            </Text>
            <Text>
              <Trans>Conditional</Trans>
            </Text>
            <Text textAlign="left" lineHeight="1.45">
              <Trans>
                Est. liquidity & <br /> earned fee
              </Trans>
            </Text>
            <Text textAlign="left" lineHeight="1.45">
              <Trans>
                Received <br /> amount
              </Trans>
            </Text>
            <Text textAlign="left">
              <Trans>Max gas</Trans>
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
        ) : shouldShowEmptyState ? (
          <Flex justifyContent="center" padding="20px">
            <Text color="subText">{ordersEmptyMessage}</Text>
          </Flex>
        ) : (
          renderedOrders.map(order => (
            <OrderItem key={order.id} order={order} upToMedium={upToMedium} onDelete={handleDeleteRequest} />
          ))
        )}

        <Flex justifyContent="center" alignItems="center" backgroundColor={overlayBackgroundColor} sx={overlayStyle}>
          <LocalLoader />
        </Flex>

        <Pagination
          onPageChange={handlePageChange}
          totalCount={tableLoading ? 0 : totalItems}
          currentPage={currentPage}
          pageSize={SMART_EXIT_ORDERS_PAGE_SIZE}
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

import TokenSelectorModal, { EarnPosition } from '@kyber/token-selector'
import { Trans, t } from '@lingui/macro'
import Portal from '@reach/portal'
import { rgba } from 'polished'
import { useCallback, useMemo, useState } from 'react'
import { X } from 'react-feather'
import { useNavigate } from 'react-router'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import {
  useCancelSmartExitOrderMutation,
  useGetSmartExitCancelSignMessageMutation,
  useGetSmartExitOrdersQuery,
} from 'services/smartExit'
import styled from 'styled-components'

import { ReactComponent as IconListSmartExit } from 'assets/svg/earn/ic_list_smart_exit.svg'
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
import { NavigateButton, PoolPageWrapper, StyledNavigateButton, TableWrapper } from 'pages/Earns/PoolExplorer/styles'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import Filter from 'pages/Earns/SmartExitOrders/Filter'
import OrderItem from 'pages/Earns/SmartExitOrders/OrderItem'
import useSmartExitFilter from 'pages/Earns/SmartExitOrders/useSmartExitFilter'
import { useSmartExitOrdersData } from 'pages/Earns/SmartExitOrders/useSmartExitOrdersData'
import { SmartExit as SmartExitModal } from 'pages/Earns/components/SmartExit'
import { OrderStatus, ParsedPosition, SmartExitOrder, UserPosition } from 'pages/Earns/types'
import { parsePosition } from 'pages/Earns/utils/position'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
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

const EmptyStateWrapper = styled(Flex)`
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
`

const SetUpButtonOutline = styled(StyledNavigateButton)`
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.primary};

  :hover {
    background-color: ${({ theme }) => rgba(theme.primary, 0.1)};
  }
`

const EmptyStateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
`

const MyPositionsButton = styled(EmptyStateButton)`
  background-color: ${({ theme }) => rgba(theme.white, 0.08)};
  color: ${({ theme }) => rgba(theme.white, 0.7)};
`

const SetUpSmartExitButton = styled(EmptyStateButton)`
  background-color: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.textReverse};

  :hover {
    filter: brightness(0.9);
  }
`

const SMART_EXIT_ORDERS_PAGE_SIZE = 10

const SmartExit = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const notify = useNotify()
  const toggleWalletModal = useWalletModalToggle()

  const { filters, updateFilters } = useSmartExitFilter()

  const [showCancelConfirm, setShowCancelConfirm] = useState<SmartExitOrder | null>(null)
  const [removing, setRemoving] = useState(false)
  const [showTokenSelector, setShowTokenSelector] = useState(false)
  const [smartExitPosition, setSmartExitPosition] = useState<ParsedPosition | null>(null)

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
    shouldShowEmptyState,
  } = useSmartExitOrdersData({ account, filters, pageSize: SMART_EXIT_ORDERS_PAGE_SIZE, updateFilters })
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  // Fetch all active orders to get position IDs that should be excluded from position selector
  const { data: activeOrdersData } = useGetSmartExitOrdersQuery(
    {
      userWallet: account || '',
      status: OrderStatus.OrderStatusOpen,
      pageSize: 1000, // Get all active orders
    },
    { skip: !account },
  )

  // Extract position IDs from active orders to exclude from position selector
  const excludePositionIds = useMemo(() => {
    if (!activeOrdersData?.orders) return []
    return activeOrdersData.orders.map(order => order.positionId)
  }, [activeOrdersData])

  const handleDeleteRequest = useCallback((order: SmartExitOrder) => setShowCancelConfirm(order), [])
  const handleDismissModal = useCallback(() => setShowCancelConfirm(null), [])

  const handleOpenTokenSelector = useCallback(() => setShowTokenSelector(true), [])
  const handleCloseTokenSelector = useCallback(() => setShowTokenSelector(false), [])

  const handleSelectPosition = useCallback(
    (
      _position: { exchange: string; poolId: string; positionId: string | number },
      _initialSlippage?: number,
      earnPosition?: EarnPosition,
    ) => {
      setShowTokenSelector(false)
      if (earnPosition) {
        // Cast EarnPosition to UserPosition (they have the same structure)
        const parsed = parsePosition({ position: earnPosition as unknown as UserPosition })
        setSmartExitPosition(parsed)
      }
    },
    [],
  )

  const handleDismissSmartExit = useCallback(() => {
    setSmartExitPosition(null)
  }, [])

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

      <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap" sx={{ gap: '12px' }}>
        <Filter filters={filters} updateFilters={updateFilters} />
        <SetUpButtonOutline onClick={handleOpenTokenSelector}>
          <Trans>Set Up Smart Exit</Trans>
        </SetUpButtonOutline>
      </Flex>

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
          <EmptyStateWrapper>
            <IconListSmartExit width={80} height={80} color="#134E4B" />
            <Text color={theme.subText} fontSize={16} fontWeight={500} fontStyle="italic">
              <Trans>No Smart Exit orders yet</Trans>
            </Text>
            <Text color={theme.gray} fontSize={14} textAlign="center" fontStyle="italic">
              <Trans>Automate your exit by setting conditions based on price, time, or earnings.</Trans>
            </Text>
            <Flex sx={{ gap: '12px' }} marginTop="8px">
              <MyPositionsButton onClick={() => navigate(APP_PATHS.EARN_POSITIONS)}>
                <Trans>My Positions</Trans>
              </MyPositionsButton>
              <SetUpSmartExitButton onClick={handleOpenTokenSelector}>
                <Trans>Set Up Smart Exit</Trans>
              </SetUpSmartExitButton>
            </Flex>
          </EmptyStateWrapper>
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

      {showTokenSelector && (
        <Portal>
          <TokenSelectorModal
            chainId={chainId as number}
            account={account}
            title={t`Select Position`}
            showUserPositions
            positionsOnly
            excludePositionIds={excludePositionIds}
            onSelectLiquiditySource={handleSelectPosition}
            onConnectWallet={toggleWalletModal}
            onClose={handleCloseTokenSelector}
          />
        </Portal>
      )}

      {smartExitPosition && <SmartExitModal position={smartExitPosition} onDismiss={handleDismissSmartExit} />}
    </PoolPageWrapper>
  )
}

export default SmartExit

import TokenSelectorModal, { EarnPosition } from '@kyber/token-selector'
import { Trans, t } from '@lingui/macro'
import Portal from '@reach/portal'
import { useCallback, useMemo, useState } from 'react'
import { X } from 'react-feather'
import { useNavigate } from 'react-router'
import { useMedia } from 'react-use'
import {
  useCancelSmartExitOrderMutation,
  useGetSmartExitCancelSignMessageMutation,
  useGetSmartExitOrdersQuery,
} from 'services/smartExit'

import { ReactComponent as IconListSmartExit } from 'assets/svg/earn/ic_list_smart_exit.svg'
import { ReactComponent as IconUserEarnPosition } from 'assets/svg/earn/ic_user_earn_position.svg'
import { NotificationType } from 'components/Announcement/type'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import Pagination from 'components/Pagination'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { NavigateButton, PoolPageWrapper, StyledNavigateButton, TableWrapper } from 'pages/Earns/PoolExplorer/styles'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import Filter from 'pages/Earns/SmartExitOrders/Filter'
import OrderItem from 'pages/Earns/SmartExitOrders/OrderItem'
import SmartExitOrdersSkeleton from 'pages/Earns/SmartExitOrders/SmartExitOrdersSkeleton'
import { ORDERS_TABLE_GRID_COLUMNS } from 'pages/Earns/SmartExitOrders/constants'
import useSmartExitFilter from 'pages/Earns/SmartExitOrders/useSmartExitFilter'
import { useSmartExitOrdersData } from 'pages/Earns/SmartExitOrders/useSmartExitOrdersData'
import RefetchIndicator from 'pages/Earns/components/RefetchIndicator'
import { SmartExit as SmartExitModal } from 'pages/Earns/components/SmartExit'
import { SMART_EXIT_SUPPORTED_CHAINS, SMART_EXIT_SUPPORTED_EXCHANGES } from 'pages/Earns/constants'
import { OrderStatus, ParsedPosition, SmartExitOrder, UserPosition } from 'pages/Earns/types'
import { parsePosition } from 'pages/Earns/utils/position'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { friendlyError } from 'utils/errorMessage'
import { Address } from 'utils/viem'
import { signTypedDataRaw } from 'utils/walletClient'

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <div
    className="grid gap-4 border-b border-border py-4 text-subText"
    style={{ gridTemplateColumns: ORDERS_TABLE_GRID_COLUMNS }}
  >
    {children}
  </div>
)

const SMART_EXIT_ORDERS_PAGE_SIZE = 10

const SmartExit = () => {
  const navigate = useNavigate()
  const { account, chainId } = useActiveWeb3React()
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
    if (!showCancelConfirm || !account) return

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

      const signature = await signTypedDataRaw({
        chainId: chainId,
        account: account as Address,
        typedData,
      })

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
  }, [account, cancelOrder, changeNetwork, chainId, getCancelSignMsg, notify, showCancelConfirm])

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
      pageSize: 100, // Get all active orders
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

  return (
    <PoolPageWrapper>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <IconArrowLeft onClick={() => navigate(-1)} />
          <h1 className="text-2xl font-medium">
            <Trans>Smart Exit Orders</Trans>
          </h1>
        </div>
        <NavigateButton
          mobileFullWidth
          icon={<IconUserEarnPosition />}
          text={t`My Positions`}
          to={APP_PATHS.EARN_POSITIONS}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Filter filters={filters} updateFilters={updateFilters} />
        <StyledNavigateButton
          onClick={handleOpenTokenSelector}
          className="border border-primary bg-transparent text-primary hover:bg-primary/10 hover:brightness-100"
        >
          <Trans>Set Up Smart Exit</Trans>
        </StyledNavigateButton>
      </div>

      <TableWrapper style={tableWrapperStyle}>
        <RefetchIndicator visible={overlayLoading} />

        {!upToMedium && (
          <TableHeader>
            <span>#</span>
            <span>
              <Trans>Position</Trans>
            </span>
            <span>
              <Trans>Condition(s)</Trans>
            </span>
            <span className="text-left leading-[1.45]">
              <Trans>
                Est. liquidity & <br /> earned fee
              </Trans>
            </span>
            <span className="text-left leading-[1.45]">
              <Trans>
                Received <br /> amount
              </Trans>
            </span>
            <span className="text-left">
              <Trans>Max gas</Trans>
            </span>
            <span className="text-left">
              <Trans>Status</Trans>
            </span>
            <div></div>
          </TableHeader>
        )}

        {tableLoading ? (
          <SmartExitOrdersSkeleton upToMedium={upToMedium} />
        ) : shouldShowEmptyState ? (
          <div className="flex flex-col items-center justify-center gap-4 px-5 py-[60px]">
            <IconListSmartExit width={80} height={80} color="#134E4B" />
            <span className="text-base font-medium italic text-subText">
              <Trans>No Smart Exit orders yet</Trans>
            </span>
            <span className="text-center text-sm italic text-gray">
              <Trans>Automate your exit by setting conditions based on price, time, or earnings.</Trans>
            </span>
            <div className="mt-2 flex gap-3">
              <button
                onClick={() => navigate(APP_PATHS.EARN_POSITIONS)}
                className="flex cursor-pointer items-center justify-center rounded-2xl border-0 bg-white/[0.08] px-[18px] py-2.5 text-sm font-medium text-white/70 transition-all duration-200"
              >
                <Trans>My Positions</Trans>
              </button>
              <button
                onClick={handleOpenTokenSelector}
                className="flex cursor-pointer items-center justify-center rounded-2xl border-0 bg-primary px-[18px] py-2.5 text-sm font-medium text-textReverse transition-all duration-200 hover:brightness-90"
              >
                <Trans>Set Up Smart Exit</Trans>
              </button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              '[&>*]:border-b [&>*]:border-border',
              totalItems <= SMART_EXIT_ORDERS_PAGE_SIZE && '[&>:last-child]:border-b-0',
            )}
          >
            {renderedOrders.map((order, index) => (
              <OrderItem
                key={order.id}
                order={order}
                index={(currentPage - 1) * SMART_EXIT_ORDERS_PAGE_SIZE + index + 1}
                rowIndex={index}
                upToMedium={upToMedium}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        )}

        <Pagination
          onPageChange={handlePageChange}
          totalCount={tableLoading ? 0 : totalItems}
          currentPage={currentPage}
          pageSize={SMART_EXIT_ORDERS_PAGE_SIZE}
          style={{ margin: '0 -20px', width: 'calc(100% + 40px)' }}
        />
      </TableWrapper>

      <Modal isOpen={!!showCancelConfirm} onDismiss={handleDismissModal}>
        <div className="flex w-full flex-col gap-6 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xl font-medium">
              <Trans>Removing a Smart Exit</Trans>
            </span>
            <X onClick={handleDismissModal} />
          </div>
          <Trans>Are you sure you want to remove this Smart Exit?</Trans>
          <div className="flex gap-4">
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
          </div>
        </div>
      </Modal>

      {showTokenSelector && (
        <Portal>
          <TokenSelectorModal
            title={t`Select Position`}
            onClose={handleCloseTokenSelector}
            wallet={{
              account,
              onConnectWallet: toggleWalletModal,
            }}
            positionOptions={{
              showUserPositions: true,
              positionsOnly: true,
              variant: 'smart-exit',
              excludePositionIds,
              filterExchanges: SMART_EXIT_SUPPORTED_EXCHANGES,
              filterChains: SMART_EXIT_SUPPORTED_CHAINS,
              onSelectLiquiditySource: handleSelectPosition,
            }}
          />
        </Portal>
      )}

      {smartExitPosition && <SmartExitModal position={smartExitPosition} onDismiss={handleDismissSmartExit} />}
    </PoolPageWrapper>
  )
}

export default SmartExit

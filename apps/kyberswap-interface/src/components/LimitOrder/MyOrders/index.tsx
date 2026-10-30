import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { useGetListOrdersQuery } from 'services/limitOrder'

import DropdownMenu, { type MenuOption } from 'components/DropdownMenu'
import HistoryPagination from 'components/HistoryPagination'
import CancelOrderModal from 'components/LimitOrder/CancelOrder/CancelOrderModal'
import { useCancellingOrders } from 'components/LimitOrder/CancelOrder/useCancellingOrders'
import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import OrderRow from 'components/LimitOrder/MyOrders/OrderRow'
import RowsSkeleton from 'components/LimitOrder/MyOrders/RowsSkeleton'
import TableHeader from 'components/LimitOrder/MyOrders/TableHeader'
import {
  INITIAL_HISTORY_PAGER_STATE,
  canGoToNextHistoryPage,
  canGoToPreviousHistoryPage,
  getHistoryPagerCursor,
  goToNextHistoryPage,
  goToNumberedPage,
  goToPreviousHistoryPage,
} from 'components/LimitOrder/MyOrders/historyPager'
import { useMyOrdersNotifications } from 'components/LimitOrder/MyOrders/useMyOrdersNotifications'
import {
  getCloseOrderOptions,
  getOrdersApiSearchKeyword,
  getSearchParamsWithKeyword,
} from 'components/LimitOrder/MyOrders/utils'
import { CancelAllButton, EmptyOrders, OrderListFilters } from 'components/LimitOrder/OrderList/OrderListComponents'
import { useLimitOrderTracking } from 'components/LimitOrder/hooks/useLimitOrderTracking'
import {
  LIMIT_ORDERS_PAGE_SIZE,
  getInitialListOrdersArgs,
  useSupportedLimitOrderChains,
} from 'components/LimitOrder/listOrdersArgs'
import { LimitOrder, LimitOrderStatus } from 'components/LimitOrder/types'
import Pagination from 'components/Pagination'
import RefetchIndicator from 'components/RefetchIndicator'
import { RTK_QUERY_TAGS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useInvalidateTagLimitOrder } from 'hooks/useInvalidateTags'

const ALL_CHAINS_VALUE = 'all'
const EMPTY_LIMIT_ORDERS: LimitOrder[] = []
/**
 * An omitted `chainIds` is the backend's all-chains path. It matters on the history statuses only: there
 * every explicit chain multiplies the backend's index branches (statuses x chains x 2 tables) and a long
 * list tips it into a slow sorted query. The active status is one indexed query either way, and keeping
 * the explicit list there keeps `totalItems` exact for the numbered pager (no rows on chains this build
 * does not support).
 */
const ALL_CHAINS_API_CHAIN_IDS: ChainId[] = []

type MyOrdersProps = {
  isActiveTab: boolean
  toolbarActionsContainer: HTMLElement | null
  onSelectPair: (order: LimitOrder) => void
}

const MyOrders = ({ isActiveTab: isTabActive, toolbarActionsContainer, onSelectPair }: MyOrdersProps) => {
  const { account } = useActiveWeb3React()
  const limitOrderTracking = useLimitOrderTracking()
  const { chainId, networkName } = useLimitOrderContext()
  const { options: supportedLimitOrderChainOptions, chainIds: supportedLimitOrderChains } =
    useSupportedLimitOrderChains()

  const [searchParams, setSearchParams] = useSearchParams()
  const invalidateTag = useInvalidateTagLimitOrder()

  const [pager, setPager] = useState(INITIAL_HISTORY_PAGER_STATE)
  const [closedOrderType, setClosedOrderType] = useState(LimitOrderStatus.CLOSED)
  const orderType = isTabActive ? LimitOrderStatus.ACTIVE : closedOrderType
  const [selectedChainValue, setSelectedChainValue] = useState<string>(ALL_CHAINS_VALUE)
  const [currentOrder, setCurrentOrder] = useState<LimitOrder>()
  const [isOpenCancel, setIsOpenCancel] = useState(false)
  const [isCancelAll, setIsCancelAll] = useState(false)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  /** Cursor already bounced back to page 1, so a repeated 400 on it does not loop. */
  const rejectedCursorRef = useRef<string | undefined>(undefined)

  const accountKey = account?.toLowerCase() || ''
  const [selectionAccount, setSelectionAccount] = useState(accountKey)
  // Reset only wallet-owned state before rendering a modal for the new account.
  // Search and filter preferences belong to the list and survive wallet changes.
  if (selectionAccount !== accountKey) {
    setSelectionAccount(accountKey)
    setCurrentOrder(undefined)
    setIsOpenCancel(false)
    setIsCancelAll(false)
    setPager(INITIAL_HISTORY_PAGER_STATE)
  }
  useEffect(() => {
    clearTimeout(dismissTimer.current)
    rejectedCursorRef.current = undefined
  }, [accountKey])

  const keyword = searchParams.get('search') || ''

  const closedOrderTypeOptions: MenuOption[] = getCloseOrderOptions().map(option => ({
    label: option.label,
    value: option.value,
  }))

  const chainOptions = useMemo<MenuOption[]>(
    () => [{ label: t`All Chains`, value: ALL_CHAINS_VALUE }, ...supportedLimitOrderChainOptions],
    [supportedLimitOrderChainOptions],
  )

  const selectedChainId = Number(selectedChainValue) as ChainId
  const isSelectedChainSupported = supportedLimitOrderChains.includes(selectedChainId)
  const isAllChainsSelected = selectedChainValue === ALL_CHAINS_VALUE || !isSelectedChainSupported
  // Every chain this build supports — what the keyword mapping and the cancel flow reason about.
  const selectedOrderChainIds = isAllChainsSelected ? supportedLimitOrderChains : [selectedChainId]
  // What the list endpoint is asked for: on history tabs, all chains is an omitted filter, not an enumeration.
  const apiChainIds = isAllChainsSelected && !isTabActive ? ALL_CHAINS_API_CHAIN_IDS : selectedOrderChainIds

  const cancellingChainId = isAllChainsSelected ? chainId : selectedOrderChainIds[0]
  const ordersApiSearchKeyword = getOrdersApiSearchKeyword(keyword, selectedOrderChainIds)

  const { isOrderCancelling, setCancellingOrders } = useCancellingOrders({ chainId: cancellingChainId })

  const curPage = pager.page
  // The active tab keeps numbered paging: the backend rejects a cursor on an active status.
  const cursor = isTabActive ? undefined : getHistoryPagerCursor(pager)

  const {
    currentData: currentListOrdersData,
    isFetching,
    isError: isOrdersError,
    error: ordersError,
    isSuccess: isOrdersLoaded,
  } = useGetListOrdersQuery(
    {
      ...getInitialListOrdersArgs(apiChainIds, account),
      status: orderType,
      query: ordersApiSearchKeyword,
      page: curPage,
      cursor,
    },
    { skip: !account, pollingInterval: 10_000, skipPollingIfUnfocused: true, refetchOnFocus: true },
  )

  const orders = currentListOrdersData?.orders ?? EMPTY_LIMIT_ORDERS
  const totalOrder = currentListOrdersData?.totalOrder ?? 0
  const isInitialLoading = !!account && !currentListOrdersData && !isOrdersError
  const hasMoreOrders = currentListOrdersData?.hasMore ?? false
  const hasOrders = orders.length > 0
  const canGoPreviousPage = canGoToPreviousHistoryPage(pager)
  const hasNextHistoryPage = canGoToNextHistoryPage(pager, hasMoreOrders, LIMIT_ORDERS_PAGE_SIZE)
  // RTK Query retains the previous page's `data` while the current page is loading.
  const canGoNextPage = !isFetching && !isOrdersError && hasNextHistoryPage
  const showPagination = isTabActive && hasOrders && totalOrder > LIMIT_ORDERS_PAGE_SIZE
  // A page can be empty after filtering unsupported chains even when the backend has more orders.
  const showHistoryPagination = !isTabActive && (canGoPreviousPage || hasNextHistoryPage)
  const showCancelAll = hasOrders && isTabActive
  const showNoOrders = !isInitialLoading && !hasOrders && (isOrdersLoaded || isOrdersError || !account)

  const {
    currentData: cancelAllOrdersData,
    isError: isCancelAllOrdersError,
    isFetching: isFetchingCancelAllOrders,
    isSuccess: isCancelAllOrdersLoaded,
  } = useGetListOrdersQuery(
    {
      chainIds: selectedOrderChainIds,
      maker: account,
      status: LimitOrderStatus.ACTIVE,
      pageSize: 100,
    },
    { skip: !account || !showCancelAll },
  )

  const cancelAllOrders = cancelAllOrdersData?.orders ?? EMPTY_LIMIT_ORDERS
  const isLoadingCancelAllOrders =
    showCancelAll && !isCancelAllOrdersError && (!isCancelAllOrdersLoaded || isFetchingCancelAllOrders)

  const cancelableCancelAllOrders = useMemo(
    () => cancelAllOrders.filter(order => !isOrderCancelling(order)),
    [cancelAllOrders, isOrderCancelling],
  )
  const disabledCancelAll = isLoadingCancelAllOrders || cancelableCancelAllOrders.length === 0

  const selectedCancelOrders = useMemo(
    () => (isCancelAll ? cancelAllOrders : currentOrder ? [currentOrder] : []),
    [cancelAllOrders, currentOrder, isCancelAll],
  )

  const onReset = useCallback(() => {
    setPager(INITIAL_HISTORY_PAGER_STATE)
  }, [])

  const refetchOrders = useCallback(() => {
    invalidateTag(RTK_QUERY_TAGS.GET_LIMIT_ORDER_LIST)
  }, [invalidateTag])

  const refreshListOrder = useCallback(() => {
    try {
      onReset()
      refetchOrders()
    } catch (error) {}
  }, [onReset, refetchOrders])

  useMyOrdersNotifications({ account, chainId, limitOrderTracking, networkName, refreshListOrder })

  const setKeyword = useCallback(
    (val: string) => {
      setSearchParams(getSearchParamsWithKeyword(searchParams, val), { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const onSelectOrderType = (type: string | number) => {
    setClosedOrderType(type as LimitOrderStatus)
    onReset()
  }

  const onSelectChain = (value: string | number) => {
    const nextSelectedChainValue = value.toString()
    setSelectedChainValue(nextSelectedChainValue)
    onReset()
  }

  const onPageChange = (page: number) => {
    setPager(goToNumberedPage(page))
  }

  const onNextHistoryPage = () => {
    if (!canGoNextPage) return
    // Without a cursor the backend still serves the next numbered page, inside its 1,000-row window.
    setPager(state => goToNextHistoryPage(state, currentListOrdersData?.nextCursor))
  }

  const onPreviousHistoryPage = () => {
    setPager(goToPreviousHistoryPage)
  }

  const onChangeKeyword = (val: string) => {
    setKeyword(val)
    onReset()
  }

  const hideConfirmCancel = useCallback(() => {
    setIsOpenCancel(false)
    setIsCancelAll(false)
    clearTimeout(dismissTimer.current)
    dismissTimer.current = setTimeout(() => {
      setCurrentOrder(undefined)
    }, 300)
  }, [])

  const openCancelModal = useCallback(
    (order?: LimitOrder) => {
      clearTimeout(dismissTimer.current)
      setCurrentOrder(order)
      setIsOpenCancel(true)
      setIsCancelAll(false)
      if (order) {
        limitOrderTracking.trackMyOrderCancelClick(order, networkName)
      }
    },
    [limitOrderTracking, networkName],
  )

  const onCancelAllOrder = () => {
    if (disabledCancelAll) return

    openCancelModal()
    setIsCancelAll(true)
  }

  useEffect(() => () => clearTimeout(dismissTimer.current), [])

  // Account changes reset the pager above; a different status starts a new keyset too.
  useEffect(() => {
    onReset()
  }, [orderType, onReset])

  // A tampered or expired cursor comes back as a 400 that would otherwise be re-sent every poll.
  useEffect(() => {
    if (!cursor || !isOrdersError) return
    if (!ordersError || !('status' in ordersError) || ordersError.status !== 400) return
    if (rejectedCursorRef.current === cursor) return

    rejectedCursorRef.current = cursor
    onReset()
  }, [cursor, isOrdersError, ordersError, onReset])

  // Limit history starts on All Closed Orders after a visit to Active, as before.
  useEffect(() => {
    if (isTabActive) setClosedOrderType(LimitOrderStatus.CLOSED)
  }, [isTabActive])

  return (
    <div className="flex w-full flex-col">
      {toolbarActionsContainer &&
        showCancelAll &&
        createPortal(
          <CancelAllButton
            dataTestId="limit-order-cancel-all-button"
            disabled={disabledCancelAll}
            isLoading={isLoadingCancelAllOrders}
            onClick={onCancelAllOrder}
          />,
          toolbarActionsContainer,
        )}

      <OrderListFilters
        onSearchChange={onChangeKeyword}
        searchDataTestId="limit-order-search-input"
        searchPlaceholder={t`Search by token symbol or token address`}
        searchValue={keyword}
      >
        {/* The Active tab always lists every live order — unfilled and partially filled alike — so only
              History offers a status to narrow by. */}
        {!isTabActive && (
          <DropdownMenu
            options={closedOrderTypeOptions}
            value={orderType}
            width={130}
            mobileHalfWidth
            data-testid="limit-order-status-filter"
            // The panel is clipped by the order list's rounded `overflow-hidden` shell, which cuts the
            // last options off whenever the table is short. A portalled menu escapes that box.
            usePortal
            onChange={onSelectOrderType}
          />
        )}
        <DropdownMenu
          options={chainOptions}
          value={selectedChainValue}
          width={130}
          mobileHalfWidth
          data-testid="limit-order-chain-filter"
          usePortal
          onChange={onSelectChain}
        />
      </OrderListFilters>

      <TableHeader isActiveTab={isTabActive} />
      <div className="relative min-h-20">
        <RefetchIndicator visible={isFetching && !isInitialLoading} />
        {isInitialLoading && <RowsSkeleton isActiveTab={isTabActive} />}
        {orders.map(order => (
          <OrderRow
            isOrderCancelling={isOrderCancelling}
            isActiveTab={isTabActive}
            key={order.id}
            order={order}
            onCancelOrder={openCancelModal}
            onSelectPair={onSelectPair}
          />
        ))}
        {showNoOrders && <EmptyOrders isActiveTab={isTabActive} keyword={keyword} />}
      </div>
      {showPagination && (
        <div className="flex items-center justify-center bg-background px-4 py-2">
          <Pagination
            haveBg={false}
            onPageChange={onPageChange}
            totalCount={totalOrder}
            currentPage={curPage}
            pageSize={LIMIT_ORDERS_PAGE_SIZE}
            style={{ padding: '0' }}
          />
        </div>
      )}
      {showHistoryPagination && (
        <div className="flex items-center justify-center bg-background px-4 py-2">
          <HistoryPagination
            currentPage={curPage}
            canGoPrevious={canGoPreviousPage}
            canGoNext={canGoNextPage}
            onPrevious={onPreviousHistoryPage}
            onNext={onNextHistoryPage}
          />
        </div>
      )}

      <CancelOrderModal
        key={accountKey}
        isOpen={isOpenCancel}
        onDismiss={hideConfirmCancel}
        isCancelAll={isCancelAll}
        orders={selectedCancelOrders}
        onOrdersCancelling={setCancellingOrders}
      />
    </div>
  )
}

export default MyOrders

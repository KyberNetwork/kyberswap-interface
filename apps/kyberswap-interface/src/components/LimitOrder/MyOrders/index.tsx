import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useGetListOrdersQuery } from 'services/limitOrder'

import DropdownMenu, { type MenuOption } from 'components/DropdownMenu'
import CancelOrderModal from 'components/LimitOrder/CancelOrder/CancelOrderModal'
import { useCancellingOrders } from 'components/LimitOrder/CancelOrder/useCancellingOrders'
import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import HistoryPagination from 'components/LimitOrder/MyOrders/HistoryPagination'
import OrderRow from 'components/LimitOrder/MyOrders/OrderRow'
import TableHeader from 'components/LimitOrder/MyOrders/TableHeader'
import { CancelAllButton, EmptyOrders, TabSelector } from 'components/LimitOrder/MyOrders/components'
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
  LIST_ORDER_TABS,
  getActiveTabByOrderType,
  getCloseOrderOptions,
  getOrdersApiSearchKeyword,
  getSearchParamsWithKeyword,
} from 'components/LimitOrder/MyOrders/utils'
import { useLimitOrderTracking } from 'components/LimitOrder/hooks/useLimitOrderTracking'
import {
  LIMIT_ORDERS_PAGE_SIZE,
  getInitialListOrdersArgs,
  useSupportedLimitOrderChains,
} from 'components/LimitOrder/listOrdersArgs'
import { LimitOrder, LimitOrderStatus } from 'components/LimitOrder/types'
import { isActiveStatus } from 'components/LimitOrder/utils'
import Pagination from 'components/Pagination'
import RefetchIndicator from 'components/RefetchIndicator'
import SearchInput from 'components/SearchInput'
import { RTK_QUERY_TAGS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useInvalidateTagLimitOrder } from 'hooks/useInvalidateTags'
import usePageLocation from 'hooks/usePageLocation'
import useTab from 'hooks/useTab'

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

const MyOrders = () => {
  const { account } = useActiveWeb3React()
  const limitOrderTracking = useLimitOrderTracking()
  const { isEmbeddedSwap } = usePageLocation()
  const { chainId, networkName } = useLimitOrderContext()
  const { options: supportedLimitOrderChainOptions, chainIds: supportedLimitOrderChains } =
    useSupportedLimitOrderChains()

  const [searchParams, setSearchParams] = useSearchParams()
  const invalidateTag = useInvalidateTagLimitOrder()

  const { activeTab: orderTab, setActiveTab: setOrderTab } = useTab<LimitOrderStatus>({
    tabs: LIST_ORDER_TABS,
    queryKey: 'orderTab',
    defaultTab: LimitOrderStatus.ACTIVE,
    syncQuery: !isEmbeddedSwap,
  })

  const [pager, setPager] = useState(INITIAL_HISTORY_PAGER_STATE)
  const [orderType, setOrderType] = useState<LimitOrderStatus>(orderTab || LimitOrderStatus.ACTIVE)
  const [selectedChainValue, setSelectedChainValue] = useState<string>(ALL_CHAINS_VALUE)
  const [currentOrder, setCurrentOrder] = useState<LimitOrder>()
  const [isOpenCancel, setIsOpenCancel] = useState(false)
  const [isCancelAll, setIsCancelAll] = useState(false)
  /** Cursor already bounced back to page 1, so a repeated 400 on it does not loop. */
  const rejectedCursorRef = useRef<string | undefined>(undefined)

  const keyword = searchParams.get('search') || ''

  const isTabActive = isActiveStatus(orderType)
  const activeTab = getActiveTabByOrderType(orderType)
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
    data: listOrdersData,
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
    { skip: !account, pollingInterval: 10_000, refetchOnFocus: true },
  )

  const orders = listOrdersData?.orders ?? EMPTY_LIMIT_ORDERS
  const totalOrder = listOrdersData?.totalOrder ?? 0
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
  const showNoOrders = !hasOrders && (isOrdersLoaded || isOrdersError || !account)

  const {
    data: cancelAllOrdersData,
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

  const onSelectTab = (type: LimitOrderStatus) => {
    setOrderType(type)
    setOrderTab(type)
    onReset()
  }

  const onSelectOrderType = (type: string | number) => {
    const nextOrderType = type as LimitOrderStatus
    setOrderType(nextOrderType)
    setOrderTab(isActiveStatus(nextOrderType) ? LimitOrderStatus.ACTIVE : LimitOrderStatus.CLOSED)
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
    setTimeout(() => {
      setCurrentOrder(undefined)
    }, 300)
  }, [])

  const openCancelModal = useCallback(
    (order?: LimitOrder) => {
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

  // A cursor is scoped to one maker's keyset, so it cannot survive a wallet switch.
  useEffect(() => {
    onReset()
  }, [orderType, account, onReset])

  // A tampered or expired cursor comes back as a 400 that would otherwise be re-sent every poll.
  useEffect(() => {
    if (!cursor || !isOrdersError) return
    if (!ordersError || !('status' in ordersError) || ordersError.status !== 400) return
    if (rejectedCursorRef.current === cursor) return

    rejectedCursorRef.current = cursor
    onReset()
  }, [cursor, isOrdersError, ordersError, onReset])

  useEffect(() => {
    if (!orderTab) return
    setOrderType(orderType => {
      if (isActiveStatus(orderType) === isActiveStatus(orderTab)) {
        return orderType
      }
      return orderTab
    })
    onReset()
  }, [orderTab, onReset])

  return (
    <div className="flex w-full flex-col">
      <div className="flex min-w-0 items-center border-b border-darkBorder">
        <TabSelector setActiveTab={onSelectTab} activeTab={activeTab} />
        {showCancelAll && (
          <div className="flex shrink-0 items-center px-4">
            <CancelAllButton
              onClick={onCancelAllOrder}
              disabled={disabledCancelAll}
              isLoading={isLoadingCancelAllOrders}
            />
          </div>
        )}
      </div>

      <div className="flex justify-between gap-2 px-4 py-2 max-sm:flex-col">
        <div className="flex min-w-0 items-center gap-2 max-sm:w-full">
          {/* The Active tab always lists every live order — unfilled and partially filled alike — so only
              History offers a status to narrow by. */}
          {!isTabActive && (
            <DropdownMenu
              options={closedOrderTypeOptions}
              value={orderType}
              width={130}
              mobileHalfWidth
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
            usePortal
            onChange={onSelectChain}
          />
        </div>
        <SearchInput
          className="h-9 min-h-9 max-w-[280px] flex-1 rounded-[40px] py-1 max-sm:w-full max-sm:max-w-none max-sm:flex-none"
          placeholder={t`Search by token symbol or address`}
          maxLength={255}
          value={keyword}
          onChange={onChangeKeyword}
        />
      </div>

      <TableHeader isActiveTab={isTabActive} />
      <div className="relative min-h-20">
        <RefetchIndicator visible={isFetching} />
        {orders.map(order => (
          <OrderRow
            isOrderCancelling={isOrderCancelling}
            isActiveTab={isTabActive}
            key={order.id}
            order={order}
            onCancelOrder={openCancelModal}
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

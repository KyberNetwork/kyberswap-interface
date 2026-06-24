import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { HTMLAttributes, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Trash } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useGetListOrdersQuery } from 'services/limitOrder'

import { ReactComponent as NoDataIcon } from 'assets/svg/no_data.svg'
import { ButtonLight } from 'components/Button'
import DropdownMenu, { MenuOption } from 'components/DropdownMenu'
import CancelOrderModal from 'components/LimitOrder/CancelOrder/CancelOrderModal'
import { useCancellingOrders } from 'components/LimitOrder/CancelOrder/useCancellingOrders'
import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import OrderItem from 'components/LimitOrder/MyOrders/OrderItem'
import TableHeader from 'components/LimitOrder/MyOrders/TableHeader'
import {
  LIST_ORDER_TABS,
  PAGE_SIZE,
  getActiveTabByOrderType,
  getCancelledOrderTrackingPayload,
  getFilledOrderTrackingPayload,
  getOrderTypeOptions,
  getSearchParamsWithKeyword,
} from 'components/LimitOrder/MyOrders/utils'
import { LimitOrder, LimitOrderStatus } from 'components/LimitOrder/types'
import { getPayloadTracking, isActiveStatus } from 'components/LimitOrder/utils'
import Loader from 'components/Loader'
import Pagination from 'components/Pagination'
import RefetchIndicator from 'components/RefetchIndicator'
import SearchInput from 'components/SearchInput'
import { RTK_QUERY_TAGS } from 'constants/index'
import { MAINNET_NETWORKS, NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useInvalidateTagLimitOrder } from 'hooks/useInvalidateTags'
import usePageLocation from 'hooks/usePageLocation'
import useTab from 'hooks/useTab'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { cn } from 'utils/cn'
import {
  subscribeNotificationOrderCancelled,
  subscribeNotificationOrderExpired,
  subscribeNotificationOrderFilled,
} from 'utils/firebase'

type NotificationOrderCallback = Parameters<typeof subscribeNotificationOrderExpired>[2]

const NoResultWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex min-h-[220px] flex-col items-center justify-center gap-2 text-sm font-medium text-subText',
      className,
    )}
    {...rest}
  />
)

type TabSelectorProps = {
  activeTab: LimitOrderStatus
  rightContent?: ReactNode
  setActiveTab: (n: LimitOrderStatus) => void
}

const TabSelector = ({ activeTab, rightContent, setActiveTab }: TabSelectorProps) => (
  <div className="flex min-w-0 items-center border-b border-darkBorder">
    <div className="flex min-w-0 flex-1 items-center overflow-x-auto" role="tablist">
      {LIST_ORDER_TABS.map((tab, index) => {
        const active = tab === activeTab
        const isLast = index === LIST_ORDER_TABS.length - 1
        return (
          <button
            key={tab}
            aria-selected={active}
            className={cn(
              'relative flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 border-0 px-4 py-3 text-sm font-medium',
              !isLast && 'border-r border-darkBorder',
              active
                ? 'bg-transparent text-primary hover:bg-transparent hover:text-primary'
                : 'bg-transparent text-subText hover:bg-transparent hover:text-text',
            )}
            onClick={() => setActiveTab(tab)}
            role="tab"
            type="button"
          >
            <span className="text-base font-medium leading-[normal]" style={{ color: 'inherit' }}>
              {tab === LimitOrderStatus.ACTIVE ? <Trans>Active Orders</Trans> : <Trans>Order History</Trans>}
            </span>
          </button>
        )
      })}
    </div>
    {rightContent && <div className="flex shrink-0 items-center px-4">{rightContent}</div>}
  </div>
)

const MyOrders = () => {
  const { account } = useActiveWeb3React()
  const { trackingHandler } = useTracking()
  const { isEmbeddedSwap } = usePageLocation()
  const { chainId, networkName } = useLimitOrderContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const invalidateTag = useInvalidateTagLimitOrder()

  const { activeTab: orderTab, setActiveTab: setOrderTab } = useTab<LimitOrderStatus>({
    tabs: LIST_ORDER_TABS,
    queryKey: 'orderTab',
    defaultTab: LimitOrderStatus.ACTIVE,
    syncQuery: !isEmbeddedSwap,
  })

  const [curPage, setCurPage] = useState(1)
  const [orderType, setOrderType] = useState<LimitOrderStatus>(orderTab || LimitOrderStatus.ACTIVE)
  const [selectedChainValue, setSelectedChainValue] = useState<string>(() => chainId.toString())
  const [currentOrder, setCurrentOrder] = useState<LimitOrder>()
  const [isOpenCancel, setIsOpenCancel] = useState(false)
  const [isCancelAll, setIsCancelAll] = useState(false)

  const keyword = searchParams.get('search') || ''
  const isTabActive = isActiveStatus(orderType)
  const activeTab = getActiveTabByOrderType(orderType)
  const orderTypeOptions = getOrderTypeOptions(orderType)
  const selectedOrderChainId = selectedChainValue ? (Number(selectedChainValue) as ChainId) : undefined
  const { isOrderCancelling, setCancellingOrders } = useCancellingOrders({ chainId: selectedOrderChainId ?? chainId })

  const orderTypeDropdownOptions = useMemo<MenuOption[]>(
    () => orderTypeOptions.map(option => ({ label: option.label, value: option.value })),
    [orderTypeOptions],
  )

  const chainOptions = useMemo<MenuOption[]>(
    () => [
      { label: t`All Chains`, value: '' },
      ...MAINNET_NETWORKS.filter(chainId => Boolean(NETWORKS_INFO[chainId].limitOrder)).map(chainId => ({
        label: NETWORKS_INFO[chainId].name,
        value: chainId.toString(),
        icon: NETWORKS_INFO[chainId].icon,
      })),
    ],
    [],
  )

  const {
    data: { orders = [], totalOrder = 0 } = {},
    isFetching,
    isError: isOrdersError,
    isSuccess: isOrdersLoaded,
  } = useGetListOrdersQuery(
    {
      chainId: selectedOrderChainId,
      maker: account,
      status: orderType,
      query: keyword,
      page: curPage,
      pageSize: PAGE_SIZE,
    },
    { skip: !account, pollingInterval: 10_000, refetchOnFocus: true },
  )

  const hasOrders = orders.length > 0
  const showPagination = hasOrders && totalOrder > PAGE_SIZE
  const showCancelAll = hasOrders && isTabActive
  const showNoOrders = !hasOrders && (isOrdersLoaded || isOrdersError || !account)

  const {
    data: { orders: cancelAllOrders = [] } = {},
    isError: isCancelAllOrdersError,
    isFetching: isFetchingCancelAllOrders,
    isSuccess: isCancelAllOrdersLoaded,
  } = useGetListOrdersQuery(
    { chainId: selectedOrderChainId, maker: account, status: LimitOrderStatus.ACTIVE, pageSize: 100 },
    { skip: !account || !showCancelAll },
  )

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
    setCurPage(1)
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
    setSelectedChainValue(value.toString())
    onReset()
  }

  const onPageChange = (page: number) => {
    setCurPage(page)
  }

  const onChangeKeyword = (val: string) => {
    setKeyword(val)
    setCurPage(1)
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
        trackingHandler(TRACKING_EVENT_TYPE.LO_CLICK_CANCEL_ORDER, getPayloadTracking(order, networkName))
      }
    },
    [trackingHandler, networkName],
  )

  const onCancelAllOrder = () => {
    if (disabledCancelAll) return

    openCancelModal()
    setIsCancelAll(true)
  }

  const trackCancelledOrder = useCallback(
    (order: LimitOrder) => {
      trackingHandler(TRACKING_EVENT_TYPE.LO_ORDER_CANCELLED, getCancelledOrderTrackingPayload(order, networkName))
    },
    [networkName, trackingHandler],
  )

  const trackFilledOrder = useCallback(
    (order: LimitOrder) => {
      trackingHandler(TRACKING_EVENT_TYPE.LO_ORDER_FILLED, getFilledOrderTrackingPayload(order, networkName))
    },
    [networkName, trackingHandler],
  )

  useEffect(() => {
    if (!account) return

    const callback: NotificationOrderCallback = data => {
      const orders: LimitOrder[] = data?.orders ?? []
      if (orders.length) refreshListOrder()
    }

    const unsubscribeCancelled = subscribeNotificationOrderCancelled(account, chainId, data => {
      refreshListOrder()
      const cancelledOrders: LimitOrder[] = data?.orders ?? []
      cancelledOrders.forEach(trackCancelledOrder)
    })
    const unsubscribeExpired = subscribeNotificationOrderExpired(account, chainId, callback)
    const unsubscribeFilled = subscribeNotificationOrderFilled(account, chainId, data => {
      const filledOrders: LimitOrder[] = data?.orders ?? []
      if (filledOrders.length) refreshListOrder()
      filledOrders.forEach(trackFilledOrder)
    })

    return () => {
      unsubscribeCancelled?.()
      unsubscribeExpired?.()
      unsubscribeFilled?.()
    }
  }, [account, chainId, refreshListOrder, trackCancelledOrder, trackFilledOrder])

  useEffect(() => {
    onReset()
  }, [chainId, onReset, orderType])

  useEffect(() => {
    if (!orderTab) return
    setOrderType(orderType => (isActiveStatus(orderType) === isActiveStatus(orderTab) ? orderType : orderTab))
    onReset()
  }, [onReset, orderTab])

  const cancelAllButton = showCancelAll && (
    <ButtonLight
      color="var(--ks-red)"
      onClick={onCancelAllOrder}
      disabled={disabledCancelAll}
      className="w-fit gap-1.5 px-3 py-1 text-sm"
    >
      {isLoadingCancelAllOrders ? <Loader size="14px" /> : <Trash size={14} />}
      <Trans>Cancel All</Trans>
    </ButtonLight>
  )

  return (
    <div className="flex w-full flex-col">
      <TabSelector setActiveTab={onSelectTab} activeTab={activeTab} rightContent={cancelAllButton} />

      <div className="flex justify-between gap-4 px-4 py-2 max-sm:flex-col">
        <div className="flex min-w-0 items-center gap-2 max-sm:w-full">
          <DropdownMenu
            options={orderTypeDropdownOptions}
            value={orderType}
            width={130}
            mobileHalfWidth
            onChange={onSelectOrderType}
          />
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
          placeholder={t`Search by token symbol or token address`}
          maxLength={255}
          value={keyword}
          onChange={onChangeKeyword}
        />
      </div>
      <TableHeader />
      <div className="relative h-0">
        <RefetchIndicator visible={isFetching} />
      </div>
      <div>
        {orders.map(order => (
          <OrderItem
            isOrderCancelling={isOrderCancelling}
            key={order.id}
            order={order}
            onCancelOrder={openCancelModal}
          />
        ))}
      </div>
      {showPagination && (
        <div className="flex items-center justify-center bg-background px-4 py-2">
          <Pagination
            haveBg={false}
            onPageChange={onPageChange}
            totalCount={totalOrder}
            currentPage={curPage}
            pageSize={PAGE_SIZE}
            style={{ padding: '0' }}
          />
        </div>
      )}
      {showNoOrders && (
        <NoResultWrapper>
          <NoDataIcon />
          <span>
            {keyword ? (
              <Trans>No orders found.</Trans>
            ) : isTabActive ? (
              <Trans>You don&apos;t have any open orders yet.</Trans>
            ) : (
              <Trans>You don&apos;t have any order history.</Trans>
            )}
          </span>
        </NoResultWrapper>
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

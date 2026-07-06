import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useGetListOrdersQuery } from 'services/limitOrder'

import DropdownMenu, { type MenuOption } from 'components/DropdownMenu'
import CancelOrderModal from 'components/LimitOrder/CancelOrder/CancelOrderModal'
import { useCancellingOrders } from 'components/LimitOrder/CancelOrder/useCancellingOrders'
import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import OrderRow from 'components/LimitOrder/MyOrders/OrderRow'
import TableHeader from 'components/LimitOrder/MyOrders/TableHeader'
import { CancelAllButton, EmptyOrders, TabSelector } from 'components/LimitOrder/MyOrders/components'
import { useMyOrdersNotifications } from 'components/LimitOrder/MyOrders/useMyOrdersNotifications'
import {
  LIST_ORDER_TABS,
  PAGE_SIZE,
  getActiveTabByOrderType,
  getOrderTypeOptions,
  getOrdersApiSearchKeyword,
  getSearchParamsWithKeyword,
} from 'components/LimitOrder/MyOrders/utils'
import { useLimitOrderTracking } from 'components/LimitOrder/hooks/useLimitOrderTracking'
import { LimitOrder, LimitOrderStatus } from 'components/LimitOrder/types'
import { isActiveStatus } from 'components/LimitOrder/utils'
import Pagination from 'components/Pagination'
import RefetchIndicator from 'components/RefetchIndicator'
import SearchInput from 'components/SearchInput'
import { RTK_QUERY_TAGS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useChainsConfig from 'hooks/useChainsConfig'
import { useInvalidateTagLimitOrder } from 'hooks/useInvalidateTags'
import usePageLocation from 'hooks/usePageLocation'
import useTab from 'hooks/useTab'
import { sortChainOptionsByPriority } from 'pages/Earns/hooks/useSupportedDexesAndChains'
import { isSupportLimitOrder } from 'utils/index'

const ALL_CHAINS_VALUE = 'all'
const EMPTY_LIMIT_ORDERS: LimitOrder[] = []

const MyOrders = () => {
  const { account } = useActiveWeb3React()
  const limitOrderTracking = useLimitOrderTracking()
  const { isEmbeddedSwap } = usePageLocation()
  const { chainId, networkName } = useLimitOrderContext()
  const { supportedChains } = useChainsConfig()

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
  const [selectedChainValue, setSelectedChainValue] = useState<string>(ALL_CHAINS_VALUE)
  const [currentOrder, setCurrentOrder] = useState<LimitOrder>()
  const [isOpenCancel, setIsOpenCancel] = useState(false)
  const [isCancelAll, setIsCancelAll] = useState(false)

  const keyword = searchParams.get('search') || ''

  const isTabActive = isActiveStatus(orderType)
  const activeTab = getActiveTabByOrderType(orderType)
  const orderTypeOptions = getOrderTypeOptions(orderType)
  const orderTypeDropdownOptions = useMemo<MenuOption[]>(
    () => orderTypeOptions.map(option => ({ label: option.label, value: option.value })),
    [orderTypeOptions],
  )

  const supportedLimitOrderChainOptions = useMemo<MenuOption[]>(
    () =>
      supportedChains
        .filter(chain => isSupportLimitOrder(chain.chainId))
        .map(chain => ({
          label: chain.name,
          value: chain.chainId.toString(),
          icon: chain.icon,
        }))
        .sort(sortChainOptionsByPriority),
    [supportedChains],
  )
  const chainOptions = useMemo<MenuOption[]>(
    () => [{ label: t`All Chains`, value: ALL_CHAINS_VALUE }, ...supportedLimitOrderChainOptions],
    [supportedLimitOrderChainOptions],
  )
  const supportedLimitOrderChains = useMemo(
    () => supportedLimitOrderChainOptions.map(option => Number(option.value) as ChainId),
    [supportedLimitOrderChainOptions],
  )

  const selectedChainId = Number(selectedChainValue) as ChainId
  const isSelectedChainSupported = supportedLimitOrderChains.includes(selectedChainId)
  const isAllChainsSelected = selectedChainValue === ALL_CHAINS_VALUE || !isSelectedChainSupported
  const selectedOrderChainIds = isAllChainsSelected ? supportedLimitOrderChains : [selectedChainId]

  const cancellingChainId = isAllChainsSelected ? chainId : selectedOrderChainIds[0]
  const ordersApiSearchKeyword = getOrdersApiSearchKeyword(keyword, selectedOrderChainIds)

  const { isOrderCancelling, setCancellingOrders } = useCancellingOrders({ chainId: cancellingChainId })

  const {
    data: listOrdersData,
    isFetching,
    isError: isOrdersError,
    isSuccess: isOrdersLoaded,
  } = useGetListOrdersQuery(
    {
      chainIds: selectedOrderChainIds,
      maker: account,
      status: orderType,
      query: ordersApiSearchKeyword,
      page: curPage,
      pageSize: PAGE_SIZE,
    },
    { skip: !account, pollingInterval: 10_000, refetchOnFocus: true },
  )

  const orders = listOrdersData?.orders ?? EMPTY_LIMIT_ORDERS
  const totalOrder = listOrdersData?.totalOrder ?? 0
  const hasOrders = orders.length > 0
  const showPagination = hasOrders && totalOrder > PAGE_SIZE
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

  useEffect(() => {
    onReset()
  }, [orderType, onReset])

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
          placeholder={t`Search by token symbol or address`}
          maxLength={255}
          value={keyword}
          onChange={onChangeKeyword}
        />
      </div>

      <TableHeader isActiveTab={isTabActive} />
      <div className="relative h-0">
        <RefetchIndicator visible={isFetching} />
      </div>
      <div>
        {orders.map(order => (
          <OrderRow
            isOrderCancelling={isOrderCancelling}
            isActiveTab={isTabActive}
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
      {showNoOrders && <EmptyOrders isActiveTab={isTabActive} keyword={keyword} />}

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

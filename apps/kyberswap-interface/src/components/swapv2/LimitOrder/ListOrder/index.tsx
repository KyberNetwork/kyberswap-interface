import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { HTMLAttributes, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Trash } from 'react-feather'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGetListOrdersQuery } from 'services/limitOrder'

import { ReactComponent as NoDataIcon } from 'assets/svg/no_data.svg'
import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import Pagination from 'components/Pagination'
import Row from 'components/Row'
import SearchInput from 'components/SearchInput'
import Select from 'components/Select'
import EditOrderModal from 'components/swapv2/LimitOrder/EditOrderModal'
import ListOrderSkeleton from 'components/swapv2/LimitOrder/ListOrder/ListOrderSkeleton'
import OrderItem from 'components/swapv2/LimitOrder/ListOrder/OrderItem'
import TabSelector from 'components/swapv2/LimitOrder/ListOrder/TabSelector'
import TableHeader from 'components/swapv2/LimitOrder/ListOrder/TableHeader'
import useRequestCancelOrder from 'components/swapv2/LimitOrder/ListOrder/useRequestCancelOrder'
import CancelOrderModal from 'components/swapv2/LimitOrder/Modals/CancelOrderModal'
import { ACTIVE_ORDER_OPTIONS, CLOSE_ORDER_OPTIONS } from 'components/swapv2/LimitOrder/const'
import {
  calcPercentFilledOrder,
  formatAmountOrder,
  formatRateLimitOrder,
  getPayloadTracking,
  isActiveStatus,
} from 'components/swapv2/LimitOrder/helpers'
import { LIMIT_ORDERS_PAGE_SIZE } from 'components/swapv2/LimitOrder/listOrdersArgs'
import { LimitOrder, LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import useCancellingOrders from 'components/swapv2/LimitOrder/useCancellingOrders'
import { EMPTY_ARRAY, RTK_QUERY_TAGS, TRANSACTION_STATE_DEFAULT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useInvalidateTagLimitOrder } from 'hooks/useInvalidateTags'
import usePageLocation from 'hooks/usePageLocation'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useLimitState } from 'state/limit/hooks'
import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'
import { cn } from 'utils/cn'
import {
  subscribeNotificationOrderCancelled,
  subscribeNotificationOrderExpired,
  subscribeNotificationOrderFilled,
} from 'utils/firebase'

// Shared with the nav-intent prefetch (utils/prefetch) so the page's initial query key can't drift.
const PAGE_SIZE = LIMIT_ORDERS_PAGE_SIZE

export const NoResultWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex min-h-[140px] flex-col items-center justify-center text-subText', className)} {...rest} />
)

const TableFooter = ({ children = [], isTabActive }: { children: ReactNode[]; isTabActive: boolean }) => {
  const totalChild = children.filter(Boolean).length
  return totalChild ? (
    <div
      className="flex items-center gap-4 bg-subText-20 px-3 py-2.5 max-sm:flex-col-reverse"
      style={{ justifyContent: totalChild === 1 && !isTabActive ? 'center' : 'space-between' }}
    >
      {children}
    </div>
  ) : null
}

export default function ListMyOrder({ customChainId }: { customChainId?: ChainId }) {
  const { account, chainId: walletChainId, networkInfo } = useActiveWeb3React()
  const chainId = customChainId || walletChainId
  const [curPage, setCurPage] = useState(1)

  const { tab, ...qs } = useParsedQueryString<{ tab: LimitOrderStatus }>()
  const [orderType, setOrderType] = useState<LimitOrderStatus>(LimitOrderStatus.ACTIVE)

  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get('search') || ''

  const setKeyword = useCallback(
    (val: string) => {
      searchParams.set('search', val)
      setSearchParams(searchParams, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const [isOpenCancel, setIsOpenCancel] = useState(false)
  const [isOpenEdit, setIsOpenEdit] = useState(false)
  const { ordersNeedCreated: ordersUpdating } = useLimitState()

  const { isOrderCancelling } = useCancellingOrders()
  const { trackingHandler } = useTracking()

  const { data: { orders = [], totalOrder = 0 } = {}, isFetching } = useGetListOrdersQuery(
    {
      chainId,
      maker: account,
      status: orderType,
      query: keyword,
      page: curPage,
      pageSize: PAGE_SIZE,
    },
    { skip: !account, refetchOnFocus: true },
  )

  const loading = useShowLoadingAtLeastTime(isFetching)

  const [currentOrder, setCurrentOrder] = useState<LimitOrder>()
  const [isCancelAll, setIsCancelAll] = useState(false)

  const tokenAddresses = useMemo(() => {
    const activeOrders = orders.filter(e => isActiveStatus(e.status))
    if (!activeOrders.length) {
      return EMPTY_ARRAY
    }
    return activeOrders.flatMap(order => [order.takerAsset, order.makerAsset])
  }, [orders])

  const { refetch, data: tokenPrices } = useTokenPricesWithLoading(tokenAddresses, chainId)

  useEffect(() => {
    // Refresh token prices each 10 seconds
    const interval = setInterval(refetch, 10_000)
    return () => {
      clearInterval(interval)
    }
  }, [refetch])

  const onPageChange = (page: number) => {
    setCurPage(page)
  }

  const onReset = useCallback(() => {
    setCurPage(1)
  }, [])

  const { isEmbeddedSwap } = usePageLocation()
  const navigate = useNavigate()
  const onSelectTab = (type: LimitOrderStatus) => {
    setOrderType(type)
    onReset()
    if (!isEmbeddedSwap) {
      navigate({ search: new URLSearchParams(qs).toString() }, { replace: true })
    }
  }

  const onChangeKeyword = (val: string) => {
    setKeyword(val)
    setCurPage(1)
  }

  useEffect(() => {
    onReset()
  }, [chainId, onReset, orderType])

  const invalidateTag = useInvalidateTagLimitOrder()
  const refetchOrders = useCallback(() => {
    invalidateTag(RTK_QUERY_TAGS.GET_LIST_ORDERS)
  }, [invalidateTag])

  const refreshListOrder = useCallback(() => {
    try {
      onReset()
      refetchOrders()
    } catch (error) {}
  }, [onReset, refetchOrders])

  useEffect(() => {
    if (!account) return
    const callback = (data: any) => {
      const orders: LimitOrder[] = data?.orders ?? []
      if (orders.length) refreshListOrder()
    }
    const unsubscribeCancelled = subscribeNotificationOrderCancelled(account, chainId, data => {
      refreshListOrder()
      const cancelledOrders: LimitOrder[] = data?.orders ?? []
      cancelledOrders.forEach(order => {
        trackingHandler(TRACKING_EVENT_TYPE.LO_ORDER_CANCELLED, {
          order_id: order.id,
          side: 'sell',
          from_token: order.makerAssetSymbol,
          to_token: order.takerAssetSymbol,
          pair: `${order.makerAssetSymbol}/${order.takerAssetSymbol}`,
          limit_price: formatRateLimitOrder(order, false),
          amount_in: formatAmountOrder(order.makingAmount, order.makerAssetDecimals),
          time_active_minutes: Math.round((Date.now() / 1000 - order.createdAt) / 60),
          chain: networkInfo.name,
        })
      })
    })
    const unsubscribeExpired = subscribeNotificationOrderExpired(account, chainId, callback)
    const unsubscribeFilled = subscribeNotificationOrderFilled(account, chainId, data => {
      const filledOrders: LimitOrder[] = data?.orders ?? []
      if (filledOrders.length) refreshListOrder()
      filledOrders.forEach(order => {
        const lastTx = order.transactions?.[order.transactions.length - 1]
        trackingHandler(TRACKING_EVENT_TYPE.LO_ORDER_FILLED, {
          order_id: order.id,
          side: 'sell',
          from_token: order.makerAssetSymbol,
          to_token: order.takerAssetSymbol,
          pair: `${order.makerAssetSymbol}/${order.takerAssetSymbol}`,
          limit_price: formatRateLimitOrder(order, false),
          fill_price: formatRateLimitOrder(order, false),
          amount_in: formatAmountOrder(order.makingAmount, order.makerAssetDecimals),
          amount_out_actual: formatAmountOrder(order.filledTakingAmount, order.takerAssetDecimals),
          tx_hash: lastTx?.txHash,
          chain: networkInfo.name,
        })
      })
    })
    return () => {
      unsubscribeCancelled?.()
      unsubscribeExpired?.()
      unsubscribeFilled?.()
    }
  }, [account, chainId, refreshListOrder, trackingHandler, networkInfo.name])

  const { flowState, setFlowState, onCancelOrder } = useRequestCancelOrder({
    orders,
    isCancelAll,
    totalOrder,
  })

  const hideConfirmCancel = useCallback(() => {
    setFlowState(TRANSACTION_STATE_DEFAULT)
    setIsOpenCancel(false)
    setTimeout(() => {
      setCurrentOrder(undefined)
    }, 300)
  }, [setFlowState])

  const hideEditModal = useCallback(() => {
    setFlowState(TRANSACTION_STATE_DEFAULT)
    setCurrentOrder(undefined)
    setIsOpenEdit(false)
  }, [setFlowState])

  const showConfirmCancel = useCallback(
    (order?: LimitOrder) => {
      setCurrentOrder(order)
      setFlowState({ ...TRANSACTION_STATE_DEFAULT, showConfirm: true })
      setIsOpenCancel(true)
      setIsCancelAll(false)
      if (order) {
        trackingHandler(TRACKING_EVENT_TYPE.LO_CLICK_CANCEL_ORDER, getPayloadTracking(order, networkInfo.name))
      }
    },
    [trackingHandler, setFlowState, networkInfo],
  )

  const showEditOrderModal = useCallback(
    (order: LimitOrder) => {
      setFlowState({ ...TRANSACTION_STATE_DEFAULT })
      setCurrentOrder(order)
      setIsOpenEdit(true)
      setIsCancelAll(false)
      trackingHandler(TRACKING_EVENT_TYPE.LO_CLICK_EDIT_ORDER, getPayloadTracking(order, networkInfo.name))
    },
    [trackingHandler, networkInfo.name, setFlowState],
  )

  const totalOrderNotCancelling = useMemo(() => {
    return orders.filter(e => !isOrderCancelling(e)).length
  }, [orders, isOrderCancelling])

  const onCancelAllOrder = () => {
    showConfirmCancel()
    setIsCancelAll(true)
  }

  const disabledBtnCancelAll = totalOrderNotCancelling === 0
  const isTabActive = isActiveStatus(orderType)

  useEffect(() => {
    const orderCancelling = orders.length - totalOrderNotCancelling
    window.onbeforeunload = () => (orderCancelling > 0 && ordersUpdating.length > 0 ? '' : null) // return null will not show confirm, else will show
  }, [totalOrderNotCancelling, orders, ordersUpdating])

  const filledPercent =
    currentOrder &&
    calcPercentFilledOrder(currentOrder.filledTakingAmount, currentOrder.takingAmount, currentOrder.takerAssetDecimals)

  return (
    <div className="flex flex-col gap-4 max-sm:w-screen">
      <div className="flex items-center justify-between border-y border-background">
        <TabSelector
          setActiveTab={onSelectTab}
          activeTab={isTabActive ? LimitOrderStatus.ACTIVE : LimitOrderStatus.CLOSED}
        />
      </div>

      <div className="flex justify-between gap-4 px-3 max-sm:flex-col">
        <Row className="w-fit items-center justify-between gap-2 max-sm:w-full">
          <Select
            className="h-9 min-w-full max-w-[50%] rounded-[40px] bg-background text-sm max-sm:min-w-0"
            key={orderType}
            options={isTabActive ? ACTIVE_ORDER_OPTIONS() : CLOSE_ORDER_OPTIONS()}
            value={orderType}
            onChange={setOrderType}
          />
        </Row>
        <SearchInput
          className="h-9 max-w-[330px] flex-1 max-sm:w-full max-sm:max-w-none"
          placeholder={t`Search by token symbol or token address`}
          maxLength={255}
          value={keyword}
          onChange={onChangeKeyword}
        />
      </div>
      {loading ? (
        <ListOrderSkeleton />
      ) : (
        <div>
          <TableHeader />
          <Column>
            {orders.map((order, index) => (
              <OrderItem
                isLast={index === orders.length - 1}
                isOrderCancelling={isOrderCancelling}
                index={index + (curPage - 1) * PAGE_SIZE}
                key={order.id}
                order={order}
                onCancelOrder={showConfirmCancel}
                onEditOrder={showEditOrderModal}
                tokenPrices={tokenPrices}
                hasOrderCancelling={orders.some(isOrderCancelling)}
              />
            ))}
          </Column>
          {orders.length !== 0 ? (
            <TableFooter isTabActive={isTabActive}>
              {isTabActive && (
                <ButtonLight
                  color="var(--ks-red)"
                  onClick={onCancelAllOrder}
                  disabled={disabledBtnCancelAll}
                  className="w-fit px-3.5 py-2 text-sm max-sm:w-full max-sm:p-2.5"
                >
                  <Trash size={15} />
                  <span className="ml-[5px]">
                    <Trans>Cancel All</Trans>
                  </span>
                </ButtonLight>
              )}
              {totalOrder > PAGE_SIZE && (
                <Pagination
                  haveBg={false}
                  onPageChange={onPageChange}
                  totalCount={totalOrder}
                  currentPage={curPage}
                  pageSize={PAGE_SIZE}
                  style={{ padding: '0' }}
                />
              )}
            </TableFooter>
          ) : (
            <NoResultWrapper>
              <NoDataIcon />
              <span className="mt-2.5">
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
        </div>
      )}

      <CancelOrderModal
        isOpen={isOpenCancel}
        flowState={flowState}
        onDismiss={hideConfirmCancel}
        onSubmit={onCancelOrder}
        customChainId={customChainId}
        order={currentOrder}
        isCancelAll={isCancelAll}
      />

      {currentOrder && isOpenEdit && (
        <EditOrderModal
          flowState={flowState}
          setFlowState={setFlowState}
          customChainId={customChainId}
          isOpen={isOpenEdit}
          onDismiss={hideEditModal}
          onSubmit={onCancelOrder}
          order={currentOrder}
          note={`${t`Note: Your existing order will be automatically cancelled and a new order will be created.`} ${
            currentOrder.status === LimitOrderStatus.PARTIALLY_FILLED
              ? t` Your currently existing order is ${filledPercent}% filled.`
              : ''
          }`}
        />
      )}
    </div>
  )
}

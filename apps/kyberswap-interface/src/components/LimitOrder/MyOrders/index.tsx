import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { HTMLAttributes, useCallback, useEffect, useState } from 'react'
import { Trash } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useGetListOrdersQuery } from 'services/limitOrder'

import { ReactComponent as NoDataIcon } from 'assets/svg/no_data.svg'
import { ButtonLight } from 'components/Button'
import InfoHelper from 'components/InfoHelper'
import CancelOrderModal from 'components/LimitOrder/CancelOrder/CancelOrderModal'
import { useCancellingOrders } from 'components/LimitOrder/CancelOrder/hooks/useCancellingOrders'
import OrderItem from 'components/LimitOrder/MyOrders/OrderItem'
import {
  formatAmountOrder,
  formatRateLimitOrder,
  getPayloadTracking,
  isActiveStatus,
} from 'components/LimitOrder/helpers'
import { LimitOrder, LimitOrderStatus } from 'components/LimitOrder/types'
import Pagination from 'components/Pagination'
import SearchInput from 'components/SearchInput'
import Select from 'components/Select'
import { RTK_QUERY_TAGS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useInvalidateTagLimitOrder } from 'hooks/useInvalidateTags'
import usePageLocation from 'hooks/usePageLocation'
import useTab from 'hooks/useTab'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import RefetchIndicator from 'pages/Earns/components/RefetchIndicator'
import { cn } from 'utils/cn'
import {
  subscribeNotificationOrderCancelled,
  subscribeNotificationOrderExpired,
  subscribeNotificationOrderFilled,
} from 'utils/firebase'

const PAGE_SIZE = 10

const LIST_ORDER_TABS = [LimitOrderStatus.ACTIVE, LimitOrderStatus.CLOSED] as const

const NoResultWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex min-h-[220px] flex-col items-center justify-center gap-2 text-sm font-medium text-subText',
      className,
    )}
    {...rest}
  />
)

const ACTIVE_ORDER_OPTIONS = () => [
  {
    label: t`All Active Orders`,
    value: LimitOrderStatus.ACTIVE,
  },
  {
    label: t`Open Orders`,
    value: LimitOrderStatus.OPEN,
  },
  {
    label: t`Partially Filled Orders`,
    value: LimitOrderStatus.PARTIALLY_FILLED,
  },
]

const CLOSE_ORDER_OPTIONS = () => [
  {
    label: t`All Closed Orders`,
    value: LimitOrderStatus.CLOSED,
  },
  {
    label: t`Filled Orders`,
    value: LimitOrderStatus.FILLED,
  },
  {
    label: t`Cancelled Orders`,
    value: LimitOrderStatus.CANCELLED,
  },
  {
    label: t`Expired Orders`,
    value: LimitOrderStatus.EXPIRED,
  },
]

const TabSelector = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: LimitOrderStatus
  setActiveTab: (n: LimitOrderStatus) => void
}) => (
  <div className="flex min-w-0 flex-1 items-center overflow-x-auto border-b border-darkBorder" role="tablist">
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
)

const TableHeader = () => (
  <div
    className={cn(
      'grid grid-cols-[44px_minmax(0,1.15fr)_minmax(0,1.2fr)_minmax(0,1.45fr)_minmax(0,1.2fr)_minmax(160px,1fr)_64px] items-center gap-2 max-[640px]:grid-cols-[40px_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.35fr)]',
      'cursor-default bg-white/[0.04] p-4 text-xs font-medium uppercase tracking-[0.04em] text-subText',
    )}
  >
    <span>
      <Trans>Chain</Trans>
    </span>
    <span className="justify-self-end text-right">
      <Trans>Size</Trans>
    </span>
    <span className="flex justify-self-end text-right max-[640px]:hidden">
      <Trans>Available</Trans>
      <InfoHelper placement="top" size={14} text={<Trans>Available amount to be filled.</Trans>} />
    </span>
    <span className="justify-self-end text-right">
      <Trans>Rate</Trans>
    </span>
    <span className="justify-self-end text-right">
      <Trans>Total</Trans>
    </span>
    <span className="justify-self-end text-right max-[640px]:hidden">
      <Trans>Status</Trans>
    </span>
    <span className="justify-self-end text-right max-[640px]:hidden" />
  </div>
)

const MyOrders = ({ customChainId }: { customChainId?: ChainId }) => {
  const { account, chainId: walletChainId, networkInfo } = useActiveWeb3React()
  const chainId = customChainId || walletChainId
  const [searchParams, setSearchParams] = useSearchParams()
  const { isEmbeddedSwap } = usePageLocation()
  const invalidateTag = useInvalidateTagLimitOrder()
  const { isOrderCancelling } = useCancellingOrders()
  const { trackingHandler } = useTracking()
  const { activeTab: orderTab, setActiveTab: setOrderTab } = useTab<LimitOrderStatus>({
    tabs: LIST_ORDER_TABS,
    queryKey: 'orderTab',
    defaultTab: LimitOrderStatus.ACTIVE,
    syncQuery: !isEmbeddedSwap,
  })

  const [curPage, setCurPage] = useState(1)
  const [orderType, setOrderType] = useState<LimitOrderStatus>(orderTab || LimitOrderStatus.ACTIVE)
  const [currentOrder, setCurrentOrder] = useState<LimitOrder>()
  const [isOpenCancel, setIsOpenCancel] = useState(false)
  const [isCancelAll, setIsCancelAll] = useState(false)

  const keyword = searchParams.get('search') || ''
  const isTabActive = isActiveStatus(orderType)
  const activeTab = isTabActive ? LimitOrderStatus.ACTIVE : LimitOrderStatus.CLOSED
  const orderTypeOptions = isTabActive ? ACTIVE_ORDER_OPTIONS() : CLOSE_ORDER_OPTIONS()

  const {
    data: { orders = [], totalOrder = 0 } = {},
    isFetching,
    isSuccess: isOrdersLoaded,
  } = useGetListOrdersQuery(
    {
      chainId,
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
  const showNoOrders = !hasOrders && (isOrdersLoaded || !account)
  const totalOrderNotCancelling = orders.filter(order => !isOrderCancelling(order)).length
  const disabledCancelAll = totalOrderNotCancelling === 0

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
      const nextSearchParams = new URLSearchParams(searchParams)

      if (val) {
        nextSearchParams.set('search', val)
      } else {
        nextSearchParams.delete('search')
      }

      setSearchParams(nextSearchParams, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const onPageChange = (page: number) => {
    setCurPage(page)
  }

  const onSelectTab = (type: LimitOrderStatus) => {
    setOrderType(type)
    setOrderTab(type)
    onReset()
  }

  const onSelectOrderType = (type: LimitOrderStatus) => {
    setOrderType(type)
    setOrderTab(isActiveStatus(type) ? LimitOrderStatus.ACTIVE : LimitOrderStatus.CLOSED)
    onReset()
  }

  const onChangeKeyword = (val: string) => {
    setKeyword(val)
    setCurPage(1)
  }

  const trackCancelledOrder = useCallback(
    (order: LimitOrder) => {
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
    },
    [networkInfo.name, trackingHandler],
  )

  const trackFilledOrder = useCallback(
    (order: LimitOrder) => {
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
    },
    [networkInfo.name, trackingHandler],
  )

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
        trackingHandler(TRACKING_EVENT_TYPE.LO_CLICK_CANCEL_ORDER, getPayloadTracking(order, networkInfo.name))
      }
    },
    [trackingHandler, networkInfo],
  )

  const onCancelAllOrder = () => {
    openCancelModal()
    setIsCancelAll(true)
  }

  useEffect(() => {
    if (!account) return

    const callback = (data: any) => {
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

  return (
    <div className="flex w-full flex-col">
      <TabSelector setActiveTab={onSelectTab} activeTab={activeTab} />

      <div className="flex justify-between gap-4 px-4 py-2 max-sm:flex-col">
        <Select
          className="h-9 min-w-[200px] rounded-[40px] bg-buttonGray px-3 py-2 text-sm max-sm:w-full"
          key={orderType}
          options={orderTypeOptions}
          value={orderType}
          onChange={onSelectOrderType}
          matchMenuWidth
        />
        <SearchInput
          className="h-9 min-h-9 max-w-[360px] flex-1 rounded-[40px] bg-buttonGray py-1 max-sm:w-full max-sm:max-w-none max-sm:flex-none"
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
      {(showPagination || showCancelAll) && (
        <div
          className={cn(
            'flex items-center gap-4 bg-white/[0.04] px-4 py-3 max-sm:flex-col-reverse',
            showPagination && showCancelAll ? 'justify-between' : showCancelAll ? 'justify-start' : 'justify-center',
          )}
        >
          {showCancelAll && (
            <ButtonLight
              color="var(--ks-red)"
              onClick={onCancelAllOrder}
              disabled={disabledCancelAll}
              className="w-fit gap-1.5 px-3.5 py-2 text-sm max-sm:w-full"
            >
              <Trash size={15} />
              <Trans>Cancel All</Trans>
            </ButtonLight>
          )}
          {showPagination && (
            <Pagination
              haveBg={false}
              onPageChange={onPageChange}
              totalCount={totalOrder}
              currentPage={curPage}
              pageSize={PAGE_SIZE}
              style={{ padding: '0' }}
            />
          )}
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
        customChainId={customChainId}
        order={currentOrder}
        isCancelAll={isCancelAll}
      />
    </div>
  )
}

export default MyOrders

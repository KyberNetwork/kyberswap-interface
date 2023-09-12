import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { stringify } from 'querystring'
import { ReactNode, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { Info, Trash } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useGetListOrdersQuery } from 'services/limitOrder'
import styled from 'styled-components'

import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import Row from 'components/Row'
import SearchInput from 'components/SearchInput'
import Select from 'components/Select'
import SubscribeNotificationButton from 'components/SubscribeButton'
import useRequestCancelOrder from 'components/swapv2/LimitOrder/ListOrder/useRequestCancelOrder'
import { EMPTY_ARRAY, TRANSACTION_STATE_DEFAULT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import useTheme from 'hooks/useTheme'
import { useLimitState } from 'state/limit/hooks'
import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'
import { MEDIA_WIDTHS } from 'theme'
import {
  subscribeNotificationOrderCancelled,
  subscribeNotificationOrderExpired,
  subscribeNotificationOrderFilled,
} from 'utils/firebase'

import EditOrderModal from '../EditOrderModal'
import CancelOrderModal from '../Modals/CancelOrderModal'
import { ACTIVE_ORDER_OPTIONS, CLOSE_ORDER_OPTIONS } from '../const'
import { calcPercentFilledOrder, getPayloadTracking, isActiveStatus } from '../helpers'
import { LimitOrder, LimitOrderStatus, ListOrderHandle } from '../type'
import useCancellingOrders from '../useCancellingOrders'
import OrderItem from './OrderItem'
import TabSelector from './TabSelector'
import TableHeader from './TableHeader'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  gap: 1rem;
  border: 1px solid ${({ theme }) => theme.border};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-left: -16px;
    width: 100vw;
    border-left: none;
    border-right: none;
  `};
`

const ButtonCancelAll = styled(ButtonLight)`
  font-size: 14px;
  width: fit-content;
  padding: 8px 14px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
   width: 100%;
   padding: 10px;
  `};
`

const PAGE_SIZE = 10
const NoResultWrapper = styled.div`
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.subText};
`

const TableFooterWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  border-radius: 0 0 20px 20px;
  padding: 10px 12px;
  background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column-reverse;
  `};
`

const TableFooter = ({ children = [], isTabActive }: { children: ReactNode[]; isTabActive: boolean }) => {
  const totalChild = children.filter(Boolean).length
  return totalChild ? (
    <TableFooterWrapper style={{ justifyContent: totalChild === 1 && !isTabActive ? 'center' : 'space-between' }}>
      {children}
    </TableFooterWrapper>
  ) : null
}

const SearchFilter = styled.div`
  gap: 1rem;
  padding: 0 12px;
  display: flex;
  justify-content: space-between;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `};
`
const SelectFilter = styled(Select)`
  background: ${({ theme }) => theme.background};
  border-radius: 40px;
  max-width: 50%;
  height: 36px;
  font-size: 14px;
  min-width: 100%;
  ${({ theme }) => theme.mediaWidth.upToSmall`
     min-width: unset;
  `};
`
const SearchInputWrapped = styled(SearchInput)`
  flex: 1;
  height: 36px;
  max-width: 330px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
     width: 100%;
     max-width: unset;
  `};
`

export default forwardRef<ListOrderHandle>(function ListLimitOrder(props, ref) {
  const { account, chainId, networkInfo } = useActiveWeb3React()
  const [curPage, setCurPage] = useState(1)

  const { tab, ...qs } = useParsedQueryString<{ tab: LimitOrderStatus }>()
  const [orderType, setOrderType] = useState<LimitOrderStatus>(tab ?? LimitOrderStatus.ACTIVE)
  const [keyword, setKeyword] = useState('')
  const [isOpenCancel, setIsOpenCancel] = useState(false)
  const [isOpenEdit, setIsOpenEdit] = useState(false)
  const { ordersUpdating } = useLimitState()

  const { isOrderCancelling } = useCancellingOrders()
  const { mixpanelHandler } = useMixpanel()

  const {
    data: { orders = [], totalOrder = 0 } = {},
    isFetching,
    refetch: refetchOrders,
  } = useGetListOrdersQuery(
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

  const { refetch, data: tokenPrices } = useTokenPricesWithLoading(tokenAddresses)
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

  const onReset = () => {
    setKeyword('')
    setCurPage(1)
  }

  const navigate = useNavigate()
  const onSelectTab = (type: LimitOrderStatus) => {
    setOrderType(type)
    onReset()
    navigate({ search: stringify(qs) }, { replace: true })
  }

  const onChangeKeyword = (val: string) => {
    setKeyword(val)
    setCurPage(1)
  }

  useEffect(() => {
    onReset()
  }, [chainId, orderType])

  const refreshListOrder = useCallback(() => {
    try {
      onReset()
      refetchOrders()
    } catch (error) {}
  }, [refetchOrders])

  useImperativeHandle(ref, () => ({
    refreshListOrder,
  }))

  useEffect(() => {
    if (!account) return
    const callback = (data: any) => {
      const orders: LimitOrder[] = data?.orders ?? []
      if (orders.length) refreshListOrder()
    }
    const unsubscribeCancelled = subscribeNotificationOrderCancelled(account, chainId, refreshListOrder)
    const unsubscribeExpired = subscribeNotificationOrderExpired(account, chainId, callback)
    const unsubscribeFilled = subscribeNotificationOrderFilled(account, chainId, callback)
    return () => {
      unsubscribeCancelled?.()
      unsubscribeExpired?.()
      unsubscribeFilled?.()
    }
  }, [account, chainId, refreshListOrder])

  const { flowState, setFlowState, onCancelOrder, onUpdateOrder } = useRequestCancelOrder({
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
        mixpanelHandler(MIXPANEL_TYPE.LO_CLICK_CANCEL_ORDER, getPayloadTracking(order, networkInfo.name))
      }
    },
    [mixpanelHandler, setFlowState, networkInfo],
  )

  const showEditOrderModal = useCallback(
    (order: LimitOrder) => {
      setFlowState({ ...TRANSACTION_STATE_DEFAULT })
      setCurrentOrder(order)
      setIsOpenEdit(true)
      setIsCancelAll(false)
      mixpanelHandler(MIXPANEL_TYPE.LO_CLICK_EDIT_ORDER, getPayloadTracking(order, networkInfo.name))
    },
    [mixpanelHandler, networkInfo.name, setFlowState],
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

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const subscribeBtn = (
    <SubscribeNotificationButton
      iconOnly={false}
      style={{ margin: upToSmall ? 0 : '12px 12px 0px 12px' }}
      subscribeTooltip={t`Subscribe to receive notifications on your limit orders`}
      trackingEvent={MIXPANEL_TYPE.LO_CLICK_SUBSCRIBE_BTN}
    />
  )

  const theme = useTheme()

  return (
    <Wrapper>
      <Flex justifyContent={'space-between'} alignItems="flex-start">
        <TabSelector
          setActiveTab={onSelectTab}
          activeTab={isTabActive ? LimitOrderStatus.ACTIVE : LimitOrderStatus.CLOSED}
        />
        {!upToSmall && subscribeBtn}
      </Flex>

      <SearchFilter>
        <Row width={upToSmall ? '100%' : 'fit-content'} alignItems="center" gap="8px" justify={'space-between'}>
          {upToSmall && subscribeBtn}
          <SelectFilter
            key={orderType}
            options={isTabActive ? ACTIVE_ORDER_OPTIONS : CLOSE_ORDER_OPTIONS}
            value={orderType}
            onChange={setOrderType}
          />
        </Row>
        <SearchInputWrapped
          placeholder={t`Search by token symbol or token address`}
          maxLength={255}
          value={keyword}
          onChange={onChangeKeyword}
        />
      </SearchFilter>
      {loading ? (
        <LocalLoader />
      ) : (
        <>
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
                  hasOrderCancelling={orders.some(e => !!e.operatorSignatureExpiredAt)}
                />
              ))}
            </Column>
            {orders.length !== 0 ? (
              <TableFooter isTabActive={isTabActive}>
                {isTabActive ? (
                  <ButtonCancelAll color={theme.red} onClick={onCancelAllOrder} disabled={disabledBtnCancelAll}>
                    <Trash size={15} />
                    <Text marginLeft={'5px'}>
                      <Trans>Cancel All</Trans>
                    </Text>
                  </ButtonCancelAll>
                ) : null}
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
                <Info size={30} />
                <Text marginTop={'10px'}>
                  {keyword ? (
                    <Trans>No orders found</Trans>
                  ) : isTabActive ? (
                    <Trans>You don&apos;t have any active orders yet</Trans>
                  ) : (
                    <Trans>You don&apos;t have any order history</Trans>
                  )}
                </Text>
              </NoResultWrapper>
            )}
          </div>
        </>
      )}

      <CancelOrderModal
        isOpen={isOpenCancel}
        flowState={flowState}
        onDismiss={hideConfirmCancel}
        onSubmit={onCancelOrder}
        order={currentOrder}
        isCancelAll={isCancelAll}
      />

      {currentOrder && isOpenEdit && (
        <EditOrderModal
          flowState={flowState}
          setFlowState={setFlowState}
          isOpen={isOpenEdit}
          onDismiss={hideEditModal}
          onCancelOrder={onUpdateOrder}
          refreshListOrder={refreshListOrder}
          order={currentOrder}
          note={t`Note: Your existing order will be automatically cancelled and a new order will be created.${
            currentOrder.status === LimitOrderStatus.PARTIALLY_FILLED
              ? ` Your currently existing order is ${calcPercentFilledOrder(
                  currentOrder.filledTakingAmount,
                  currentOrder.takingAmount,
                  currentOrder.takerAssetDecimals,
                )}% filled.`
              : ''
          }`}
        />
      )}
    </Wrapper>
  )
})

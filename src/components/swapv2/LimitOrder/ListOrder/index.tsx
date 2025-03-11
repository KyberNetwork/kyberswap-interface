import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { stringify } from 'querystring'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Trash } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { useGetListOrdersQuery } from 'services/limitOrder'
import styled from 'styled-components'

import { ReactComponent as NoDataIcon } from 'assets/svg/no-data.svg'
import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import Row from 'components/Row'
import SearchInput from 'components/SearchInput'
import Select from 'components/Select'
import useRequestCancelOrder from 'components/swapv2/LimitOrder/ListOrder/useRequestCancelOrder'
import { APP_PATHS, EMPTY_ARRAY, RTK_QUERY_TAGS, TRANSACTION_STATE_DEFAULT } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useInvalidateTagLimitOrder } from 'hooks/useInvalidateTags'
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
import { LimitOrder, LimitOrderStatus } from '../type'
import useCancellingOrders from '../useCancellingOrders'
import OrderItem from './OrderItem'
import TabSelector from './TabSelector'
import TableHeader from './TableHeader'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100vw;
  `};
`

const TabSelectorWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.background};
  border-top: 1px solid ${({ theme }) => theme.background};
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
export const NoResultWrapper = styled.div`
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

export default function ListMyOrder({ customChainId }: { customChainId?: ChainId }) {
  const { account, chainId: walletChainId, networkInfo } = useActiveWeb3React()
  const chainId = customChainId || walletChainId
  const [curPage, setCurPage] = useState(1)

  const { tab, ...qs } = useParsedQueryString<{ tab: LimitOrderStatus }>()
  const [orderType, setOrderType] = useState<LimitOrderStatus>(LimitOrderStatus.ACTIVE)
  const [keyword, setKeyword] = useState('')
  const [isOpenCancel, setIsOpenCancel] = useState(false)
  const [isOpenEdit, setIsOpenEdit] = useState(false)
  const { ordersNeedCreated: ordersUpdating } = useLimitState()

  const { isOrderCancelling } = useCancellingOrders()
  const { mixpanelHandler } = useMixpanel()

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

  const onReset = () => {
    setKeyword('')
    setCurPage(1)
  }

  const isPartnerSwap = window.location.pathname.includes(APP_PATHS.PARTNER_SWAP)
  const navigate = useNavigate()
  const onSelectTab = (type: LimitOrderStatus) => {
    setOrderType(type)
    onReset()
    if (!isPartnerSwap) {
      navigate({ search: stringify(qs) }, { replace: true })
    }
  }

  const onChangeKeyword = (val: string) => {
    setKeyword(val)
    setCurPage(1)
  }

  useEffect(() => {
    onReset()
  }, [chainId, orderType])

  const invalidateTag = useInvalidateTagLimitOrder()
  const refetchOrders = useCallback(() => {
    invalidateTag(RTK_QUERY_TAGS.GET_LIST_ORDERS)
  }, [invalidateTag])

  const refreshListOrder = useCallback(() => {
    try {
      onReset()
      refetchOrders()
    } catch (error) {}
  }, [refetchOrders])

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

  const theme = useTheme()

  const filledPercent =
    currentOrder &&
    calcPercentFilledOrder(currentOrder.filledTakingAmount, currentOrder.takingAmount, currentOrder.takerAssetDecimals)

  return (
    <Wrapper>
      <TabSelectorWrapper>
        <TabSelector
          setActiveTab={onSelectTab}
          activeTab={isTabActive ? LimitOrderStatus.ACTIVE : LimitOrderStatus.CLOSED}
        />
      </TabSelectorWrapper>

      <SearchFilter>
        <Row width={upToSmall ? '100%' : 'fit-content'} alignItems="center" gap="8px" justify={'space-between'}>
          <SelectFilter
            key={orderType}
            options={isTabActive ? ACTIVE_ORDER_OPTIONS() : CLOSE_ORDER_OPTIONS()}
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
                <ButtonCancelAll color={theme.red} onClick={onCancelAllOrder} disabled={disabledBtnCancelAll}>
                  <Trash size={15} />
                  <Text marginLeft={'5px'}>
                    <Trans>Cancel All</Trans>
                  </Text>
                </ButtonCancelAll>
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
              <Text marginTop={'10px'}>
                {keyword ? (
                  <Trans>No orders found.</Trans>
                ) : isTabActive ? (
                  <Trans>You don&apos;t have any open orders yet.</Trans>
                ) : (
                  <Trans>You don&apos;t have any order history.</Trans>
                )}
              </Text>
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
    </Wrapper>
  )
}

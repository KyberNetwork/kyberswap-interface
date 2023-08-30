import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { rgba } from 'polished'
import { stringify } from 'querystring'
import { ReactNode, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Info, Trash } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import { useGetEncodeDataMutation, useGetListOrdersQuery, useInsertCancellingOrderMutation } from 'services/limitOrder'
import styled from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import Column from 'components/Column'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import SearchInput from 'components/SearchInput'
import Select from 'components/Select'
import SubscribeNotificationButton from 'components/SubscribeButton'
import LIMIT_ORDER_ABI from 'constants/abis/limit_order.json'
import { EMPTY_ARRAY, TRANSACTION_STATE_DEFAULT } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import { useLimitState } from 'state/limit/hooks'
import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { TransactionFlowState } from 'types/TransactionFlowState'
import {
  subscribeNotificationOrderCancelled,
  subscribeNotificationOrderExpired,
  subscribeNotificationOrderFilled,
} from 'utils/firebase'
import { getContract } from 'utils/getContract'
import { sendEVMTransaction } from 'utils/sendTransaction'

import EditOrderModal from '../EditOrderModal'
import CancelOrderModal from '../Modals/CancelOrderModal'
import { ACTIVE_ORDER_OPTIONS, CLOSE_ORDER_OPTIONS } from '../const'
import { calcPercentFilledOrder, formatAmountOrder, getErrorMessage, isActiveStatus } from '../helpers'
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

const ButtonCancelAll = styled(ButtonEmpty)`
  background-color: ${({ theme }) => rgba(theme.red, 0.2)};
  color: ${({ theme }) => theme.red};
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
  min-height: 116px;
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
  padding: 10px 0px;
  background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column-reverse;
  `};
`

const TableFooter = ({ children = [] }: { children: ReactNode[] }) => {
  const totalChild = children.filter(Boolean).length
  return totalChild ? (
    <TableFooterWrapper style={{ justifyContent: totalChild === 1 ? 'center' : 'space-between' }}>
      {children}
    </TableFooterWrapper>
  ) : null
}

const SearchFilter = styled.div`
  gap: 16px;
  padding: 0 12px;
  display: flex;
  justify-content: space-between;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 8px;
  `};
`
const SelectFilter = styled(Select)`
  background: ${({ theme }) => theme.background};
  border-radius: 40px;
  max-width: 50%;
  height: 36px;
  font-size: 14px;
  width: 180px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
     width: 160px;
  `};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
     width: 40%;
  `};
`
const SearchInputWrapped = styled(SearchInput)`
  flex: 1;
  height: 36px;
  max-width: 330px;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
     width: 60%;
  `};
`

export const checkOrderActive = (order: LimitOrder) => {
  return ![
    LimitOrderStatus.FILLED,
    LimitOrderStatus.CANCELLED,
    LimitOrderStatus.CANCELLING,
    LimitOrderStatus.EXPIRED,
  ].includes(order.status)
}

export default forwardRef<ListOrderHandle>(function ListLimitOrder(props, ref) {
  const { account, chainId, networkInfo } = useActiveWeb3React()
  const { library } = useWeb3React()
  const [curPage, setCurPage] = useState(1)

  const { tab, ...qs } = useParsedQueryString<{ tab: LimitOrderStatus }>()
  const [orderType, setOrderType] = useState<LimitOrderStatus>(tab ?? LimitOrderStatus.ACTIVE)
  const [keyword, setKeyword] = useState('')
  const [isOpenCancel, setIsOpenCancel] = useState(false)
  const [isOpenEdit, setIsOpenEdit] = useState(false)
  const { ordersUpdating } = useLimitState()
  const addTransactionWithType = useTransactionAdder()
  const { isOrderCancelling, setCancellingOrders, cancellingOrdersIds } = useCancellingOrders()
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

  const [flowState, setFlowState] = useState<TransactionFlowState>(TRANSACTION_STATE_DEFAULT)
  const [currentOrder, setCurrentOrder] = useState<LimitOrder>()
  const [isCancelAll, setIsCancelAll] = useState(false)

  const tokenAddresses = useMemo(() => {
    const activeOrders = orders.filter(checkOrderActive)
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

  const hideConfirmCancel = useCallback(() => {
    setFlowState(state => ({ ...state, showConfirm: false }))
    setIsOpenCancel(false)
    setTimeout(() => {
      setCurrentOrder(undefined)
    }, 300)
  }, [])

  const hideEditModal = useCallback(() => {
    setFlowState(state => ({ ...state, showConfirm: false }))
    setCurrentOrder(undefined)
    setIsOpenEdit(false)
  }, [])

  const getPayloadTracking = useCallback(
    (order: LimitOrder) => {
      const { makerAssetSymbol, takerAssetSymbol, makingAmount, makerAssetDecimals, id } = order
      return {
        from_token: makerAssetSymbol,
        to_token: takerAssetSymbol,
        from_network: networkInfo.name,
        trade_qty: formatAmountOrder(makingAmount, makerAssetDecimals),
        order_id: id,
      }
    },
    [networkInfo],
  )

  const showConfirmCancel = useCallback(
    (order?: LimitOrder) => {
      setCurrentOrder(order)
      setFlowState({ ...TRANSACTION_STATE_DEFAULT, showConfirm: true })
      setIsOpenCancel(true)
      setIsCancelAll(false)
      if (order) {
        mixpanelHandler(MIXPANEL_TYPE.LO_CLICK_CANCEL_ORDER, getPayloadTracking(order))
      }
    },
    [mixpanelHandler, getPayloadTracking],
  )

  const showEditOrderModal = useCallback(
    (order: LimitOrder) => {
      setCurrentOrder(order)
      setIsOpenEdit(true)
      setIsCancelAll(false)
      mixpanelHandler(MIXPANEL_TYPE.LO_CLICK_EDIT_ORDER, getPayloadTracking(order))
    },
    [mixpanelHandler, getPayloadTracking],
  )

  const totalOrderNotCancelling = useMemo(() => {
    return orders.filter(e => !isOrderCancelling(e)).length
  }, [orders, isOrderCancelling])

  const [insertCancellingOrder] = useInsertCancellingOrderMutation()
  const [getEncodeData] = useGetEncodeDataMutation()
  const requestCancelOrder = async (order: LimitOrder | undefined) => {
    if (!library || !account) return Promise.reject('Wrong input')

    setFlowState(state => ({
      ...state,
      pendingText: t`Canceling your orders`,
      showConfirm: true,
      attemptingTxn: true,
    }))

    const newOrders = isCancelAll ? orders.map(e => e.id) : order?.id ? [order?.id] : []

    const sendTransaction = async (encodedData: string, contract: string, payload: any) => {
      const response = await sendEVMTransaction(account, library, contract, encodedData, BigNumber.from(0))
      if (response?.hash) {
        insertCancellingOrder({
          maker: account,
          chainId: chainId.toString(),
          txHash: response.hash,
          contractAddress: contract ?? '',
          ...payload,
        }).unwrap()
      }

      if (response) {
        const {
          makerAssetDecimals,
          takerAssetDecimals,
          takerAssetSymbol,
          takingAmount,
          makingAmount,
          takerAsset,
          makerAssetSymbol,
          makerAsset,
        } = order || ({} as LimitOrder)
        const amountIn = order ? formatAmountOrder(makingAmount, makerAssetDecimals) : ''
        const amountOut = order ? formatAmountOrder(takingAmount, takerAssetDecimals) : ''
        addTransactionWithType({
          ...response,
          type: TRANSACTION_TYPE.CANCEL_LIMIT_ORDER,
          extraInfo: order
            ? {
                tokenAddressIn: makerAsset,
                tokenAddressOut: takerAsset,
                tokenSymbolIn: makerAssetSymbol,
                tokenSymbolOut: takerAssetSymbol,
                tokenAmountIn: amountIn,
                tokenAmountOut: amountOut,
                arbitrary: getPayloadTracking(order),
              }
            : { arbitrary: { totalOrder } },
        })
      }
    }

    if (isCancelAll) {
      const contracts = [...new Set(orders.map(e => e.contractAddress))]
      for (const address of contracts) {
        const limitOrderContract = getContract(address, LIMIT_ORDER_ABI, library, account)
        const [{ encodedData }, nonce] = await Promise.all([
          getEncodeData({ orderIds: [], isCancelAll }).unwrap(),
          limitOrderContract?.nonce?.(account),
        ])
        await sendTransaction(encodedData, address, { nonce: nonce.toNumber() })
      }
    } else {
      const { encodedData } = await getEncodeData({
        orderIds: [order?.id].filter(Boolean) as number[],
        isCancelAll,
      }).unwrap()
      await sendTransaction(encodedData, order?.contractAddress ?? '', { orderIds: newOrders })
    }
    setCancellingOrders(cancellingOrdersIds.concat(newOrders))

    return
  }

  const onCancelOrder = async (order: LimitOrder | undefined) => {
    try {
      await requestCancelOrder(order)
      setFlowState(state => ({ ...state, showConfirm: false }))
    } catch (error) {
      setFlowState(state => ({
        ...state,
        attemptingTxn: false,
        errorMessage: getErrorMessage(error),
      }))
    }
  }

  const onCancelAllOrder = () => {
    showConfirmCancel()
    setIsCancelAll(true)
  }

  const onUpdateOrder = async () => {
    await requestCancelOrder(currentOrder)
  }

  const disabledBtnCancelAll = totalOrderNotCancelling === 0
  const isTabActive = isActiveStatus(orderType)

  useEffect(() => {
    const orderCancelling = orders.length - totalOrderNotCancelling
    window.onbeforeunload = () => (orderCancelling > 0 && ordersUpdating.length > 0 ? '' : null) // return null will not show confirm, else will show
  }, [totalOrderNotCancelling, orders, ordersUpdating])

  return (
    <Wrapper>
      <Flex justifyContent={'space-between'} alignItems="flex-start">
        <TabSelector
          setActiveTab={onSelectTab}
          activeTab={isTabActive ? LimitOrderStatus.ACTIVE : LimitOrderStatus.CLOSED}
        />
        <SubscribeNotificationButton
          style={{ margin: '12px 12px 0px 12px' }}
          subscribeTooltip={t`Subscribe to receive notifications on your limit orders`}
          trackingEvent={MIXPANEL_TYPE.LO_CLICK_SUBSCRIBE_BTN}
        />
      </Flex>

      <SearchFilter>
        <SelectFilter
          key={orderType}
          options={isTabActive ? ACTIVE_ORDER_OPTIONS : CLOSE_ORDER_OPTIONS}
          value={orderType}
          onChange={setOrderType}
        />
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
                />
              ))}
            </Column>
            {orders.length !== 0 && (
              <TableFooter>
                {isTabActive ? (
                  <ButtonCancelAll onClick={onCancelAllOrder} disabled={disabledBtnCancelAll}>
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
            )}
          </div>
          {orders.length === 0 && (
            <NoResultWrapper>
              <Info size={isMobile ? 30 : 38} />
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
        </>
      )}

      <CancelOrderModal
        isOpen={isOpenCancel}
        flowState={flowState}
        onDismiss={hideConfirmCancel}
        onSubmit={() => onCancelOrder(currentOrder)}
        order={currentOrder}
        isCancelAll={isCancelAll}
      />
      {currentOrder && (
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
          } Cancelling an order will cost gas fees`}
        />
      )}
    </Wrapper>
  )
})

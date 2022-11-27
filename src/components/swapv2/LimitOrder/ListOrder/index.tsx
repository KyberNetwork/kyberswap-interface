import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { rgba } from 'polished'
import { ReactNode, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Info, Trash } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import SearchInput from 'components/SearchInput'
import Select from 'components/Select'
import SubscribeButton from 'components/SubscribeButton'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import { NOTIFICATION_TOPICS } from 'hooks/useNotification'
import useTheme from 'hooks/useTheme'
import { NotificationType, useNotify } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { TRANSACTION_STATE_DEFAULT, TransactionFlowState } from 'types'
import {
  subscribeNotificationOrderCancelled,
  subscribeNotificationOrderExpired,
  subscribeNotificationOrderFilled,
} from 'utils/firebase'
import { sendEVMTransaction } from 'utils/sendTransaction'

import { CancelOrderModal } from '../ConfirmOrderModal'
import EditOrderModal from '../EditOrderModal'
import { LIMIT_ORDER_CONTRACT } from '../const'
import { calcPercentFilledOrder, formatAmountOrder, formatRateOrder } from '../helpers'
import { ackNotificationOrder, getEncodeData, getListOrder, insertCancellingOrder } from '../request'
import { LimitOrder, LimitOrderActions, LimitOrderStatus, ListOrderHandle } from '../type'
import useCancellingOrders from '../useCancellingOrders'
import OrderItem from './OrderItem'
import TableHeader from './TableHeader'

const ListWrapper = styled.div`
  display: flex;
  flex-direction: column;
`

const TabItem = styled.div<{ isActive?: boolean }>`
  text-align: center;
  height: fit-content;
  padding: 4px 12px;
  font-family: 'Work Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
  user-select: none;
  border-radius: 20px;
  transition: all 150ms;
  ${({ isActive, theme }) =>
    isActive &&
    css`
      font-weight: 500;
      text-align: center;
      color: ${theme.text};
      background: ${theme.buttonGray};
    `}
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
const TabSelector = ({
  className,
  activeTab,
  setActiveTab,
}: {
  className?: string
  activeTab: LimitOrderStatus
  setActiveTab: (n: LimitOrderStatus) => void
}) => {
  return (
    <Flex className={className}>
      <TabItem
        isActive={activeTab === LimitOrderStatus.ACTIVE}
        role="button"
        onClick={() => {
          setActiveTab(LimitOrderStatus.ACTIVE)
        }}
      >
        <Trans>Active Orders</Trans>
      </TabItem>
      <TabItem
        isActive={activeTab === LimitOrderStatus.CLOSED}
        role="button"
        onClick={() => {
          setActiveTab(LimitOrderStatus.CLOSED)
        }}
      >
        <Trans>Orders History</Trans>
      </TabItem>
    </Flex>
  )
}

const ActiveOptions = [
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
const ClosedOptions = [
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
const PAGE_SIZE = 10
const NoResultWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: ${({ theme }) => theme.subText};
  margin-top: 40px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
   margin-top: 16px;
  `};
`

const TableFooterWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction:column-reverse;
  `};
`

const SearchFilter = styled.div`
  gap: 16px;
  margin-top: 24px;
  display: flex;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 8px;
  `};
`
const SelectFilter = styled(Select)`
  background: ${({ theme }) => theme.background};
  border-radius: 40px;
  max-width: 50%;
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
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
     width: 60%;
  `};
`

function SummaryNotify({ type, message, order }: { type?: LimitOrderStatus; message?: string; order?: LimitOrder }) {
  const { makingAmount, makerAssetSymbol, takingAmount, takerAssetSymbol, filledPercent } = order || ({} as LimitOrder)
  const theme = useTheme()
  const rate = order ? formatRateOrder(order, false) : ''
  const mainMsg = order ? (
    <>
      &nbsp;
      <Text as="span" fontWeight={500}>
        {formatAmountOrder(makingAmount)} {makerAssetSymbol}
      </Text>{' '}
      &nbsp; and receive&nbsp;
      <Text as="span" fontWeight={500}>
        {formatAmountOrder(takingAmount)} {takerAssetSymbol}&nbsp;
      </Text>
      <Text as="span" color={theme.subText}>
        &nbsp; when 1 {takerAssetSymbol} is equal to {rate} {makerAssetSymbol}
      </Text>
    </>
  ) : null

  let msg: ReactNode
  switch (type) {
    case LimitOrderStatus.CANCELLED:
      msg = <Trans>You have successfully cancelled an order to pay {mainMsg}.</Trans>
      break
    case LimitOrderStatus.CANCELLED_FAILED:
      msg = <Trans>Cancel order to pay {mainMsg} failed</Trans>
      break
    case LimitOrderStatus.FILLED:
      msg = <Trans>Your order to pay {mainMsg} was successfully filled</Trans>
      break
    case LimitOrderStatus.PARTIALLY_FILLED:
      msg = (
        <Trans>
          Your order to pay {mainMsg} is {filledPercent}% filled
        </Trans>
      )
      break
    case LimitOrderStatus.EXPIRED:
      msg = (
        <Trans>
          Your order to pay {mainMsg} has expired{' '}
          {!!filledPercent && (
            <>
              <br />
              Your order was {filledPercent}% filled
            </>
          )}
        </Trans>
      )
      break
  }

  return (
    <Text color={theme.text} lineHeight="18px">
      {message || msg}
    </Text>
  )
}
export default forwardRef<ListOrderHandle>(function ListLimitOrder(props, ref) {
  const { account, chainId } = useActiveWeb3React()
  const { library } = useWeb3React()
  const [activeTab, setActiveTab] = useState<LimitOrderStatus>(LimitOrderStatus.ACTIVE)
  const [curPage, setCurPage] = useState(1)
  const [orderType, setOrderType] = useState<LimitOrderStatus>()
  const [keyword, setKeyword] = useState('')
  const [isOpenCancel, setIsOpenCancel] = useState(false)
  const [isOpenEdit, setIsOpenEdit] = useState(false)

  const notify = useNotify()

  const [orders, setOrders] = useState<LimitOrder[]>([])
  const [totalOrder, setTotalOrder] = useState<number>(0)

  const onPageChange = (page: number) => {
    setCurPage(page)
  }

  const onReset = () => {
    setKeyword('')
    setCurPage(1)
  }

  useEffect(() => {
    onReset()
  }, [activeTab])

  // todo allowance when update order

  const fetchListOrder = useCallback(
    async (status: LimitOrderStatus, query: string, curPage: number) => {
      try {
        const { orders = [], pagination = { totalItems: 0 } } = await (account
          ? getListOrder({
              chainId,
              maker: account,
              status,
              query,
              page: curPage,
              pageSize: PAGE_SIZE,
            })
          : Promise.resolve({ orders: [], pagination: { totalItems: 0 } }))
        if (orderType !== status) return
        setOrders(orders)
        setTotalOrder(pagination.totalItems ?? 0)
      } catch (error) {
        console.error(error)
      }
    },
    [account, chainId, orderType],
  )

  const query = useDebounce(keyword, 500)
  useEffect(() => {
    if (orderType) fetchListOrder(orderType, query, curPage)
  }, [orderType, query, fetchListOrder, curPage])

  const refreshListOrder = useCallback(() => {
    onReset()
    fetchListOrder(orderType || activeTab, '', 1)
  }, [fetchListOrder, orderType, activeTab])

  useImperativeHandle(ref, () => ({
    refreshListOrder,
  }))

  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (!account || !chainId) return
    const unsubscribeCancelled = subscribeNotificationOrderCancelled(account, chainId, data => {
      refreshListOrder()
      const isSuccessful = data?.all?.[0]?.isSuccessful
      if (isSuccessful !== undefined) {
        notify(
          {
            type: isSuccessful ? NotificationType.WARNING : NotificationType.ERROR,
            title: isSuccessful ? t`Order Cancelled` : t`Cancel Orders Failed`,
            summary: (
              <SummaryNotify
                message={
                  isSuccessful
                    ? t`You have successfully cancelled all orders.`
                    : t`Cancel all orders failed. Please try again.`
                }
              />
            ),
          },
          10000,
        )
      }
      const orders: LimitOrder[] = data?.orders ?? []
      orders?.forEach(order => {
        // todo
        notify(
          {
            type: order.isSuccessful ? NotificationType.WARNING : NotificationType.ERROR,
            title: order.isSuccessful ? t`Order Cancelled` : t`Order Cancel Failed`,
            summary: (
              <SummaryNotify
                order={order}
                type={order.isSuccessful ? LimitOrderStatus.CANCELLED : LimitOrderStatus.CANCELLED_FAILED}
              />
            ),
          },
          10000,
        )
      })
      if (orders.length)
        ackNotificationOrder(
          orders.map(e => e.id.toString()),
          account,
          chainId,
        ).catch(console.error)
    })
    const unsubscribeExpired = subscribeNotificationOrderExpired(account, chainId, data => {
      console.log(data)
      // todo noti here. call api ack
      refreshListOrder()
      const orders: LimitOrder[] = data?.orders ?? []
      orders.forEach(order => {
        notify(
          {
            type: NotificationType.WARNING,
            title: t`Order Expired`,
            summary: <SummaryNotify order={order} type={LimitOrderStatus.EXPIRED} />,
          },
          10000,
        )
      })
      //  if (orders.length)
      // ackNotificationOrder(LimitOrderStatus.EXPIRED, account, chainId).catch(console.error)
    })
    const unsubscribeFilled = subscribeNotificationOrderFilled(account, chainId, data => {
      console.log(data)
      // todo noti here. call api ack
      refreshListOrder()
      const orders: LimitOrder[] = data?.orders ?? []
      orders.forEach(order => {
        const isPartialFilled = order.status === LimitOrderStatus.PARTIALLY_FILLED
        notify(
          {
            type: NotificationType.SUCCESS,
            title: isPartialFilled ? t`Order Partially Filled` : t`Order Filled`,
            summary: <SummaryNotify order={order} type={order.status ?? LimitOrderStatus.FILLED} />,
          },
          10000,
        )
      })
      //  if (orders.length)
      // ackNotificationOrder(LimitOrderStatus.FILLED, account, chainId).catch(console.error)
    })
    return () => {
      unsubscribeCancelled?.()
      unsubscribeExpired?.()
      unsubscribeFilled?.()
    }
    // eslint-disable-next-line
  }, [account, chainId])

  useEffect(() => {
    setOrderType(activeTab)
    setKeyword('')
  }, [activeTab])

  const [flowState, setFlowState] = useState<TransactionFlowState>(TRANSACTION_STATE_DEFAULT)
  const [currentOrder, setCurrentOrder] = useState<LimitOrder>()

  const hidePreviewCancel = useCallback(() => {
    setFlowState(state => ({ ...state, showConfirm: false }))
    setIsOpenCancel(false)
    setTimeout(() => {
      setCurrentOrder(undefined)
    }, 300)
  }, [])

  const hidePreviewEdit = useCallback(() => {
    setFlowState(state => ({ ...state, showConfirm: false }))
    setCurrentOrder(undefined)
    setIsOpenEdit(false)
  }, [])

  const showConfirmCancel = useCallback((order?: LimitOrder) => {
    setCurrentOrder(order)
    setFlowState(state => ({ ...TRANSACTION_STATE_DEFAULT, showConfirm: true }))
    setIsOpenCancel(true)
    setIsCancelAll(false)
  }, [])

  const showEditOrderModal = useCallback((order: LimitOrder) => {
    setCurrentOrder(order)
    setIsOpenEdit(true)
    setStep(LimitOrderActions.CANCEL)
  }, [])

  const addTransactionWithType = useTransactionAdder()
  const { isOrderCancelling, setCancellingOrders, cancellingOrdersIds } = useCancellingOrders(orders)

  const orderFiltered = useMemo(() => {
    // filter order that not cancelling
    return orders.filter(e => !isOrderCancelling(e))
  }, [orders, isOrderCancelling])

  const requestCancelOrder = async (order: LimitOrder | undefined) => {
    if (!library || !account || !chainId) return Promise.reject('Wrong input')

    // todo cancel thành công refresh active amount
    setFlowState(state => ({
      ...state,
      pendingText: t`Canceling your orders`,
      showConfirm: true,
      attemptingTxn: true,
    }))
    const { encodedData } = await getEncodeData([order?.id].filter(Boolean) as number[], isCancelAll)
    // todo test case cancel all + create one and cancel check status
    const response = await sendEVMTransaction(account, library, LIMIT_ORDER_CONTRACT, encodedData, BigNumber.from(0))
    const newOrders = isCancelAll ? orders.map(e => e.id) : order?.id ? [order?.id] : []
    setCancellingOrders(
      isCancelAll
        ? {
            nonces: Array.from(
              { length: 1 + orders.reduce((max, order) => Math.max(max, order.nonce), 0) },
              (x, y) => y,
            ),
          }
        : { orderIds: cancellingOrdersIds.concat(newOrders) },
    ) // todo

    if (response?.hash && account) {
      insertCancellingOrder({
        maker: account,
        chainId: chainId.toString(),
        txHash: response.hash,
        isCancelAll,
        orderIds: newOrders,
      })
    }

    setFlowState(state => ({ ...state, showConfirm: false }))
    response &&
      addTransactionWithType({
        ...response,
        type: TRANSACTION_TYPE.CANCEL_LIMIT_ORDER,
        summary: order
          ? `Order ${formatAmountOrder(order.makingAmount)} ${order.makerAssetSymbol} to ${formatAmountOrder(
              order.takingAmount,
            )} ${order.takerAssetSymbol}`
          : `all orders`,
      })
    return
  }

  const onCancelOrder = async (order: LimitOrder | undefined) => {
    try {
      await requestCancelOrder(order)
    } catch (error) {
      console.error(error)
      setFlowState(state => ({
        ...state,
        attemptingTxn: false,
        errorMessage: 'Error occur. Please try again.',
      }))
    }
  }

  const onCancelAllOrder = () => {
    showConfirmCancel()
    setIsCancelAll(true)
  }

  const [step, setStep] = useState<LimitOrderActions>(LimitOrderActions.CANCEL)
  const onUpdateOrder = async () => {
    await requestCancelOrder(currentOrder)
    setStep(LimitOrderActions.CREATE)
  }
  const [isCancelAll, setIsCancelAll] = useState(false)
  const isDiabledBtnCancelAll = orderFiltered.length === 0
  return (
    <>
      <Flex justifyContent={'space-between'} alignItems="center">
        <TabSelector setActiveTab={setActiveTab} activeTab={activeTab} />
        <SubscribeButton
          topicId={NOTIFICATION_TOPICS.TRENDING_SOON}
          subscribeModalContent={t`You can subscribe to email notifications for tokens that could be trending soon. We will send out notifications periodically on the top 3 tokens that could be trending soon`}
          unsubscribeTooltip={t`Unsubscribe to stop receiving notifications on the latest tokens that could be trending soon`}
          unsubscribeModalContent={t`Are you sure you want to unsubscribe? You will stop receiving notifications on latest tokens that could
            be trending soon!`}
        />
      </Flex>

      <Flex flexDirection={'column'} style={{ gap: '1rem' }}>
        <SearchFilter>
          <SelectFilter
            key={activeTab}
            options={activeTab === LimitOrderStatus.ACTIVE ? ActiveOptions : ClosedOptions}
            onChange={setOrderType}
          />
          <SearchInputWrapped
            placeholder={t`Search by token symbol or token address`}
            maxLength={255}
            value={keyword}
            onChange={setKeyword}
          />
        </SearchFilter>
        {loading ? (
          <LocalLoader />
        ) : (
          <>
            <div>
              <TableHeader />
              <ListWrapper>
                {orders.map((order, index) => (
                  <OrderItem
                    isOrderCancelling={isOrderCancelling}
                    index={index + (curPage - 1) * PAGE_SIZE}
                    key={order.id}
                    order={order}
                    onCancelOrder={showConfirmCancel}
                    onEditOrder={showEditOrderModal}
                  />
                ))}
              </ListWrapper>
            </div>
            {orders.length === 0 && (
              <NoResultWrapper>
                <Info size={isMobile ? 40 : 48} />
                <Text marginTop={'10px'}>
                  <Trans>
                    You don&apos;t have any {activeTab === LimitOrderStatus.ACTIVE ? 'active' : 'history'} orders yet
                  </Trans>
                </Text>
              </NoResultWrapper>
            )}
            {orders.length !== 0 && (
              <TableFooterWrapper>
                {activeTab === LimitOrderStatus.ACTIVE ? (
                  <ButtonCancelAll onClick={onCancelAllOrder} disabled={isDiabledBtnCancelAll}>
                    <Trash size={15} />
                    <Text marginLeft={'5px'}>
                      <Trans>Cancel All</Trans>
                    </Text>
                  </ButtonCancelAll>
                ) : (
                  <div />
                )}
                <Pagination
                  haveBg={false}
                  onPageChange={onPageChange}
                  totalCount={totalOrder}
                  currentPage={curPage}
                  pageSize={PAGE_SIZE}
                  style={{ padding: '0' }}
                />
              </TableFooterWrapper>
            )}
          </>
        )}
      </Flex>

      <CancelOrderModal
        isOpen={isOpenCancel}
        flowState={flowState}
        onDismiss={hidePreviewCancel}
        onSubmit={() => onCancelOrder(currentOrder)}
        order={currentOrder}
        isCancelAll={isCancelAll}
      />
      {currentOrder && (
        <EditOrderModal
          flowState={flowState}
          setFlowState={setFlowState}
          isOpen={isOpenEdit}
          swapState={flowState}
          onDismiss={hidePreviewEdit}
          step={step}
          onCancelOrder={onUpdateOrder}
          refreshListOrder={refreshListOrder}
          order={currentOrder}
          note={t`Note: Your existing order will be automatically cancelled and a new order will be created.${
            currentOrder.status === LimitOrderStatus.PARTIALLY_FILLED
              ? ` Your currently existing order is ${calcPercentFilledOrder(
                  currentOrder.filledTakingAmount,
                  currentOrder.takingAmount,
                )}% filled`
              : ''
          }`}
        />
      )}
    </>
  )
})

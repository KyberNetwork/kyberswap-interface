import { t } from '@lingui/macro'
import { useCallback, useEffect, useRef } from 'react'
import { useAckNotificationOrderMutation } from 'services/limitOrder'

import { NotificationType } from 'components/Announcement/type'
import { LimitOrder, LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useNotify } from 'state/application/hooks'
import { useAllTransactions } from 'state/transactions/hooks'
import { GroupedTxsByHash } from 'state/transactions/type'
import { findTx } from 'utils'
import {
  subscribeNotificationOrderCancelled,
  subscribeNotificationOrderExpired,
  subscribeNotificationOrderFilled,
} from 'utils/firebase'
import { getTransactionStatus } from 'utils/transaction'

import SummaryNotify from './ListOrder/SummaryNotify'

const isTransactionFailed = (txHash: string, transactions: GroupedTxsByHash | undefined) => {
  const transactionInfo = findTx(transactions, txHash)
  return transactionInfo ? getTransactionStatus(transactionInfo).error : false
}

const useNotificationLimitOrder = () => {
  const notify = useNotify()
  const { account, chainId, networkInfo } = useActiveWeb3React()
  const showedNotificationOrderIds = useRef<{ [id: string]: boolean }>({})

  const ackNotiLocal = useCallback((id: string | number) => {
    showedNotificationOrderIds.current = { ...showedNotificationOrderIds.current, [id]: true }
  }, [])

  const transactions = useAllTransactions()
  const [ackNotificationOrder] = useAckNotificationOrderMutation()

  useEffect(() => {
    if (!account) return
    const unsubscribeCancelled = subscribeNotificationOrderCancelled(account, chainId, data => {
      const cancelAllData = data?.all?.[0]
      const cancelAllSuccess = cancelAllData?.isSuccessful
      if (cancelAllSuccess !== undefined) {
        // not show Notification when cancel failed because duplicate.
        if (
          !isTransactionFailed(cancelAllData?.txHash ?? '', transactions) &&
          !showedNotificationOrderIds.current[cancelAllData.id ?? '']
        ) {
          notify(
            {
              type: cancelAllSuccess ? NotificationType.SUCCESS : NotificationType.ERROR,
              title: cancelAllSuccess ? t`Limit Order` : t`Cancel Orders Failed`,
              link: `${APP_PATHS.LIMIT}/${networkInfo.route}`,
              summary: (
                <SummaryNotify
                  message={
                    cancelAllSuccess
                      ? t`You have successfully cancelled all orders.`
                      : t`Cancel all orders failed. Please try again.`
                  }
                />
              ),
            },
            10000,
          )
        }
        const nonces =
          data?.all.map((e: { id: string }) => {
            ackNotiLocal(e.id)
            return e.id
          }) ?? []
        if (nonces.length) {
          ackNotificationOrder({ docIds: nonces, maker: account, chainId, type: LimitOrderStatus.CANCELLED }).catch(
            console.error,
          )
        }
      }

      const orders: LimitOrder[] = data?.orders ?? []
      const orderCancelSuccess = orders.filter(e => e.isSuccessful && !showedNotificationOrderIds.current[e.id])
      const orderCancelFailed = orders.filter(
        e =>
          !e.isSuccessful && !isTransactionFailed(e.txHash, transactions) && !showedNotificationOrderIds.current[e.id],
      )

      if (orderCancelSuccess.length)
        notify(
          {
            type: NotificationType.SUCCESS,
            title: t`Limit Order`,
            summary: <SummaryNotify orders={orderCancelSuccess} type={LimitOrderStatus.CANCELLED} />,
            link: `${APP_PATHS.LIMIT}/${networkInfo.route}`,
          },
          10000,
        )
      if (orderCancelFailed.length)
        notify(
          {
            type: NotificationType.ERROR,
            title: t`Order Cancel Failed`,
            summary: <SummaryNotify orders={orderCancelFailed} type={LimitOrderStatus.CANCELLED_FAILED} />,
          },
          10000,
        )
      if (orders.length)
        ackNotificationOrder({
          docIds: orders.map(({ id }) => {
            ackNotiLocal(id)
            return id.toString()
          }),
          maker: account,
          chainId,
          type: LimitOrderStatus.CANCELLED,
        }).catch(console.error)
    })
    const unsubscribeExpired = subscribeNotificationOrderExpired(account, chainId, data => {
      const orders: LimitOrder[] = data?.orders ?? []
      if (orders.length) {
        notify(
          {
            type: NotificationType.WARNING,
            title: t`Order Expired`,
            summary: <SummaryNotify orders={orders} type={LimitOrderStatus.EXPIRED} />,
          },
          10000,
        )
        ackNotificationOrder({
          docIds: orders.map(e => e.id.toString()),
          maker: account,
          chainId,
          type: LimitOrderStatus.EXPIRED,
        }).catch(console.error)
      }
    })
    const unsubscribeFilled = subscribeNotificationOrderFilled(account, chainId, data => {
      const orders: LimitOrder[] = data?.orders ?? []
      const orderFilled = orders.filter(
        order => order.status === LimitOrderStatus.FILLED || order.takingAmount === order.filledTakingAmount,
      )
      const orderPartialFilled = orders.filter(
        order => order.status === LimitOrderStatus.PARTIALLY_FILLED || order.takingAmount !== order.filledTakingAmount,
      )
      if (orderFilled.length) {
        notify(
          {
            type: NotificationType.SUCCESS,
            title: t`Order Filled`,
            summary: <SummaryNotify orders={orderFilled} type={LimitOrderStatus.FILLED} />,
          },
          10000,
        )
      }
      orderPartialFilled.forEach(order => {
        notify(
          {
            type: NotificationType.SUCCESS,
            title: t`Order Partially Filled`,
            summary: <SummaryNotify orders={[order]} type={LimitOrderStatus.PARTIALLY_FILLED} />,
          },
          10000,
        )
      })
      if (orders.length) {
        ackNotificationOrder({
          docIds: orders.map(e => e.uuid),
          maker: account,
          chainId,
          type: LimitOrderStatus.FILLED,
        }).catch(console.error)
      }
    })
    return () => {
      unsubscribeCancelled?.()
      unsubscribeExpired?.()
      unsubscribeFilled?.()
    }
  }, [account, chainId, notify, ackNotificationOrder, ackNotiLocal, transactions, networkInfo.route])
}
export default useNotificationLimitOrder

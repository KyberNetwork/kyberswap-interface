import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useRef } from 'react'

import { LimitOrder } from 'components/LimitOrder/types'
import {
  subscribeNotificationOrderCancelled,
  subscribeNotificationOrderExpired,
  subscribeNotificationOrderFilled,
} from 'utils/firebase'

type NotificationOrderCallback = Parameters<typeof subscribeNotificationOrderExpired>[2]

type UseMyOrdersNotificationsParams = {
  account: string | undefined
  chainId: ChainId
  limitOrderTracking: {
    trackMyOrderCancelled: (order: LimitOrder, networkName: string) => void
    trackMyOrderFilled: (order: LimitOrder, networkName: string) => void
  }
  networkName: string
  refreshListOrder: () => void
}

const getCancelledOrderTrackingKey = (account: string, chainId: ChainId, order: LimitOrder): string => {
  const eventId = order.txHash || order.uuid || order.id
  return `${account.toLowerCase()}:${order.chainId ?? chainId}:${eventId}`
}

export const useMyOrdersNotifications = ({
  account,
  chainId,
  limitOrderTracking,
  networkName,
  refreshListOrder,
}: UseMyOrdersNotificationsParams) => {
  const initializedCancelledScopesRef = useRef(new Set<string>())
  const trackedCancelledOrderKeysRef = useRef(new Set<string>())

  const trackCancelledOrders = useCallback(
    (orders: LimitOrder[]) => {
      if (!account) return

      const scopeKey = `${account.toLowerCase()}:${chainId}`
      const isInitializedScope = initializedCancelledScopesRef.current.has(scopeKey)

      if (!isInitializedScope) {
        initializedCancelledScopesRef.current.add(scopeKey)
        orders.forEach(order =>
          trackedCancelledOrderKeysRef.current.add(getCancelledOrderTrackingKey(account, chainId, order)),
        )
        return
      }

      orders.forEach(order => {
        if (!order.isSuccessful) return

        const eventKey = getCancelledOrderTrackingKey(account, chainId, order)
        if (trackedCancelledOrderKeysRef.current.has(eventKey)) return

        trackedCancelledOrderKeysRef.current.add(eventKey)
        limitOrderTracking.trackMyOrderCancelled(order, networkName)
      })
    },
    [account, chainId, limitOrderTracking, networkName],
  )

  const trackFilledOrder = useCallback(
    (order: LimitOrder) => {
      limitOrderTracking.trackMyOrderFilled(order, networkName)
    },
    [limitOrderTracking, networkName],
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
      trackCancelledOrders(cancelledOrders)
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
  }, [account, chainId, refreshListOrder, trackCancelledOrders, trackFilledOrder])
}

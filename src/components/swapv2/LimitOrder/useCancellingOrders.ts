import { useCallback, useEffect, useState } from 'react'

import { useActiveWeb3React } from 'hooks'
import { insertCancellingOrder, subscribeCancellingOrders } from 'utils/firebase'

import { LimitOrder, LimitOrderStatus } from './type'

export default function useCancellingOrders(orders: LimitOrder[]) {
  const { account, chainId } = useActiveWeb3React()

  const [cancellingOrdersMap, setCancellingOrdersMap] = useState<number[]>([])
  const [cancellingOrdersNonces, setCancellingOrdersNonces] = useState<number[]>([])

  const setCancellingOrders = useCallback(
    (data: { orderIds?: number[]; nonces?: number[] }) => {
      if (data.orderIds) setCancellingOrdersMap(data.orderIds)
      if (data.nonces) setCancellingOrdersNonces(data.nonces)
      chainId && account && insertCancellingOrder(data, chainId, account).catch(console.error)
    },
    [account, chainId],
  )

  useEffect(() => {
    if (!account || !chainId) return
    const unsubscribe = subscribeCancellingOrders(account, chainId, data => {
      console.log(data)
      setCancellingOrdersMap(data?.orderIds ?? [])
      setCancellingOrdersNonces(data?.nonces ?? [])
    })
    return () => unsubscribe?.()
  }, [account, chainId, setCancellingOrders])
  console.log(cancellingOrdersMap)

  const isOrderCancelling = useCallback(
    (order: LimitOrder) => {
      return (
        order.status !== LimitOrderStatus.CANCELLED &&
        (cancellingOrdersNonces.includes(order.nonce) || cancellingOrdersMap?.includes(order.id))
      )
    },
    [cancellingOrdersNonces, cancellingOrdersMap],
  )

  return { cancellingOrdersMap, cancellingOrdersNonces, setCancellingOrders, isOrderCancelling }
}

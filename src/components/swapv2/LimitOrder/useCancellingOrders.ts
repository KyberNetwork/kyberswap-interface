import { useCallback, useEffect, useState } from 'react'

import { useActiveWeb3React } from 'hooks'
import { subscribeCancellingOrders } from 'utils/firebase'

import { LimitOrder, LimitOrderStatus } from './type'

export default function useCancellingOrders(orders: LimitOrder[]) {
  const { account, chainId } = useActiveWeb3React()

  const [cancellingOrdersIds, setCancellingOrdersIds] = useState<number[]>([])
  const [cancellingOrdersNonces, setCancellingOrdersNonces] = useState<number[]>([])

  const setCancellingOrders = useCallback((data: { orderIds?: number[]; nonces?: number[] }) => {
    if (data.orderIds) setCancellingOrdersIds(data.orderIds)
    if (data.nonces) setCancellingOrdersNonces(data.nonces)
  }, [])

  useEffect(() => {
    if (!account || !chainId) return
    const unsubscribe = subscribeCancellingOrders(account, chainId, data => {
      console.log(data)
      setCancellingOrdersIds(data?.orderIds ?? [])
      setCancellingOrdersNonces(data?.nonces ?? [])
    })
    return () => unsubscribe?.()
  }, [account, chainId, setCancellingOrders])

  const isOrderCancelling = useCallback(
    (order: LimitOrder) => {
      return (
        order.status !== LimitOrderStatus.CANCELLED &&
        (cancellingOrdersNonces.includes(order.nonce) || cancellingOrdersIds?.includes(order.id))
      )
    },
    [cancellingOrdersNonces, cancellingOrdersIds],
  )

  return { cancellingOrdersIds, cancellingOrdersNonces, setCancellingOrders, isOrderCancelling }
}

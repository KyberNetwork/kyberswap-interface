import { useCallback, useEffect, useMemo, useState } from 'react'
import { useGetLOConfigQuery } from 'services/limitOrder'

import { useActiveWeb3React } from 'hooks'
import { OrderNonces, subscribeCancellingOrders } from 'utils/firebase'

import { isActiveStatus } from './helpers'
import { LimitOrder } from './type'

export type CancellingOrderInfo = {
  loading: boolean
  cancellingOrdersIds: number[]
  setCancellingOrders: (orderIds: number[]) => void
  isOrderCancelling: (order: LimitOrder) => boolean
}

export default function useCancellingOrders(): CancellingOrderInfo {
  const { account, chainId } = useActiveWeb3React()

  const [cancellingOrdersIds, setCancellingOrdersIds] = useState<number[]>([])
  const [cancellingOrdersNonces, setCancellingOrdersNonces] = useState<OrderNonces>({})
  const [loading, setLoading] = useState(true)
  const { data, isError } = useGetLOConfigQuery(chainId)
  const contract = isError ? '' : data?.contract || ''

  const setCancellingOrders = useCallback((orderIds: number[]) => {
    setCancellingOrdersIds(orderIds)
  }, [])

  useEffect(() => {
    if (!account) return
    const unsubscribe = subscribeCancellingOrders(account, chainId, data => {
      setCancellingOrdersIds(data?.orderIds ?? [])
      setCancellingOrdersNonces(data?.noncesByContract ?? {})
      setLoading(false)
    })
    return () => unsubscribe?.()
  }, [account, chainId])

  const isOrderCancelling = useCallback(
    (order: LimitOrder | string | undefined) => {
      if (!order) return false
      const nonces = cancellingOrdersNonces[contract] || []
      if (typeof order === 'string') {
        return cancellingOrdersIds.includes(+order) && nonces.length > 0
      }
      return (
        isActiveStatus(order.status) && (nonces?.includes?.(order.nonce) || cancellingOrdersIds?.includes(order.id))
      )
    },
    [cancellingOrdersNonces, cancellingOrdersIds, contract],
  )

  return useMemo(() => {
    return { cancellingOrdersIds, loading, setCancellingOrders, isOrderCancelling }
  }, [cancellingOrdersIds, loading, setCancellingOrders, isOrderCancelling])
}

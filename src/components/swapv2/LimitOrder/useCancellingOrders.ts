import { useCallback, useEffect, useMemo, useState } from 'react'
import { useGetLOConfigQuery } from 'services/limitOrder'

import { useActiveWeb3React } from 'hooks'
import { OrderNonces, subscribeCancellingOrders } from 'utils/firebase'

import { isActiveStatus } from './helpers'
import { LimitOrder, LimitOrderStatus } from './type'

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
  const { currentData } = useGetLOConfigQuery(chainId)
  const contract = currentData?.contract || ''

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
      const { status, nonce, operatorSignatureExpiredAt, id } = order

      const isCancellingHardCancel =
        isActiveStatus(status) && (nonces?.includes?.(nonce) || cancellingOrdersIds?.includes(id))

      const isCancellingGaslessCancel =
        status === LimitOrderStatus.CANCELLING && (operatorSignatureExpiredAt || 0) * 1000 - Date.now() > 0

      return isCancellingHardCancel || isCancellingGaslessCancel
    },
    [cancellingOrdersNonces, cancellingOrdersIds, contract],
  )

  return useMemo(() => {
    return { cancellingOrdersIds, loading, setCancellingOrders, isOrderCancelling }
  }, [cancellingOrdersIds, loading, setCancellingOrders, isOrderCancelling])
}

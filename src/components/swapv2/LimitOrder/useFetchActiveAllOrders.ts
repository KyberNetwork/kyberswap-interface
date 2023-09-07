import { useCallback, useEffect, useMemo, useState } from 'react'
import { useGetLOConfigQuery, useLazyGetListOrdersQuery } from 'services/limitOrder'

import { LimitOrder, LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { useActiveWeb3React } from 'hooks'

export const useIsSupportSoftCancelOrder = () => {
  const { chainId } = useActiveWeb3React()
  const { data: config } = useGetLOConfigQuery(chainId)
  return useCallback(
    (order: LimitOrder) => {
      const features = config?.features || {}
      return !!features?.[order.contractAddress?.toLowerCase?.()]?.softCancel
    },
    [config],
  )
}

export default function useFetchActiveAllOrders(disabled = false) {
  const { account, chainId } = useActiveWeb3React()
  const [getOrders] = useLazyGetListOrdersQuery()
  const [orders, setOrders] = useState<LimitOrder[]>([])
  const isSupportSoftCancel = useIsSupportSoftCancelOrder()

  const getAllOrders = useCallback(async () => {
    if (!account) return []

    let orders: LimitOrder[] = []
    const pageSize = 100
    const maximumPage = 5
    let page = 1
    while (true) {
      const { data } = await getOrders({
        chainId,
        maker: account,
        status: LimitOrderStatus.ACTIVE,
        pageSize,
        page,
      })
      page++
      const response = data?.orders ?? []
      orders = orders.concat(response)
      if (response.length < pageSize || page >= maximumPage) break // out of orders, and prevent infinity loop
    }

    return orders
  }, [getOrders, account, chainId])

  useEffect(() => {
    if (disabled) return
    getAllOrders().then(data => setOrders(data))
  }, [getAllOrders, disabled])

  return useMemo(() => {
    const ordersSoftCancel = orders.filter(isSupportSoftCancel)
    return {
      orders,
      ordersSoftCancel,
      supportCancelGasless: ordersSoftCancel.length > 0,
    }
  }, [orders, isSupportSoftCancel])
}

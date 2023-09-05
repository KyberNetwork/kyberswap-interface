import { useCallback, useEffect, useMemo, useState } from 'react'
import { useGetLOConfigQuery, useLazyGetListOrdersQuery } from 'services/limitOrder'

import { LimitOrder, LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { useActiveWeb3React } from 'hooks'

export default function useFetchActiveAllOrders(disabled = false) {
  const { account, chainId } = useActiveWeb3React()
  const [getOrders] = useLazyGetListOrdersQuery()
  const [orders, setOrders] = useState<LimitOrder[]>([])
  const { data: config } = useGetLOConfigQuery(chainId)

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
    const features = config?.features || {}
    const ordersSoftCancel = orders.filter(e => features?.[e.contractAddress?.toLowerCase?.()]?.softCancel)
    return {
      orders,
      ordersSoftCancel,
      supportCancelGasless: ordersSoftCancel.length > 0,
    }
  }, [orders, config])
}

import { useCallback, useMemo } from 'react'
import { useGetLOConfigQuery, useGetListOrdersQuery } from 'services/limitOrder'

import { LimitOrder, LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { useActiveWeb3React } from 'hooks'

export const useIsSupportSoftCancelOrder = () => {
  const { chainId } = useActiveWeb3React()
  const { data: config } = useGetLOConfigQuery(chainId)
  return useCallback(
    (order: LimitOrder | undefined) => {
      if (!order) return false
      const features = config?.features || {}
      return !!features?.[order.contractAddress?.toLowerCase?.()]?.supportDoubleSignature
    },
    [config],
  )
}

export default function useAllActiveOrders(disabled = false) {
  const { account, chainId } = useActiveWeb3React()
  const { data } = useGetListOrdersQuery(
    { chainId, maker: account, status: LimitOrderStatus.ACTIVE, pageSize: 100 },
    { skip: !account || disabled },
  )

  const isSupportSoftCancel = useIsSupportSoftCancelOrder()
  return useMemo(() => {
    const orders = data?.orders || []
    const ordersSoftCancel = orders.filter(isSupportSoftCancel)
    return {
      orders,
      ordersSoftCancel,
      supportCancelGaslessAllOrders: ordersSoftCancel.length > 0,
    }
  }, [data, isSupportSoftCancel])
}

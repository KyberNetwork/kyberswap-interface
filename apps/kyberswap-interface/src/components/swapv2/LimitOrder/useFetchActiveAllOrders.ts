import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useGetLOConfigQuery, useGetListOrdersQuery } from 'services/limitOrder'

import { LimitOrder, LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { useActiveWeb3React } from 'hooks'

export const useIsSupportSoftCancelOrder = () => {
  const { chainId } = useActiveWeb3React()
  const { currentData: config } = useGetLOConfigQuery(chainId)
  return useCallback(
    (order: LimitOrder | undefined) => {
      const features = config?.features || {}
      const orderSupportGasless = !!features?.[order?.contractAddress?.toLowerCase?.() ?? '']?.supportDoubleSignature
      const chainSupportGasless = Object.values(features).some(e => e.supportDoubleSignature)
      return { orderSupportGasless, chainSupportGasless }
    },
    [config],
  )
}

export default function useAllActiveOrders(disabled = false, customChainId?: ChainId) {
  const { account, chainId } = useActiveWeb3React()
  const { data } = useGetListOrdersQuery(
    { chainId: customChainId ?? chainId, maker: account, status: LimitOrderStatus.ACTIVE, pageSize: 100 },
    { skip: !account || disabled },
  )

  const isSupportSoftCancel = useIsSupportSoftCancelOrder()
  return useMemo(() => {
    const orders = data?.orders || []
    const ordersSoftCancel = orders.filter(e => isSupportSoftCancel(e).orderSupportGasless)
    return {
      orders,
      ordersSoftCancel,
      supportCancelGaslessAllOrders: ordersSoftCancel.length > 0,
    }
  }, [data, isSupportSoftCancel])
}

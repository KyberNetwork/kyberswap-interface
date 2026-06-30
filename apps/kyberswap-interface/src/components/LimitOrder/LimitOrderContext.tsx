import { ChainId } from '@kyberswap/ks-sdk-core'
import { ReactNode, createContext, useContext, useMemo } from 'react'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'

type LimitOrderContextValue = {
  customChainId?: ChainId
  chainId: ChainId
  networkName: string
  syncOrderListTabWithQuery: boolean
}

const LimitOrderContext = createContext<LimitOrderContextValue | undefined>(undefined)

export const LimitOrderProvider = ({ children, customChainId }: { children: ReactNode; customChainId?: ChainId }) => {
  const { chainId: walletChainId, networkInfo } = useActiveWeb3React()
  const chainId = customChainId ?? walletChainId

  const value = useMemo(
    () => ({
      customChainId,
      chainId,
      networkName: NETWORKS_INFO[chainId]?.name || networkInfo.name,
      syncOrderListTabWithQuery: !customChainId,
    }),
    [chainId, customChainId, networkInfo.name],
  )

  return <LimitOrderContext.Provider value={value}>{children}</LimitOrderContext.Provider>
}

export const useLimitOrderContext = () => {
  const value = useContext(LimitOrderContext)
  const { chainId, networkInfo } = useActiveWeb3React()

  return (
    value || {
      chainId,
      networkName: networkInfo.name,
      syncOrderListTabWithQuery: true,
    }
  )
}

export const useLimitOrderCustomChainId = () => useLimitOrderContext().customChainId

export const useLimitOrderChainId = (orderChainId?: ChainId) => {
  const { chainId } = useLimitOrderContext()

  return orderChainId ?? chainId
}

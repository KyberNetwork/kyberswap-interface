import { ChainId } from '@kyberswap/ks-sdk-core'
import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'

type LimitOrderContextValue = {
  customChainId?: ChainId
  chainId: ChainId
  networkName: string
  syncOrderListTabWithQuery: boolean
  priceInputRequest?: {
    id: number
    rate: string
    invertRate: string
  }
  setPriceInputRequest: (request: { rate: string; invertRate: string }) => void
}

const LimitOrderContext = createContext<LimitOrderContextValue | undefined>(undefined)

export const LimitOrderProvider = ({ children, customChainId }: { children: ReactNode; customChainId?: ChainId }) => {
  const { chainId: walletChainId, networkInfo } = useActiveWeb3React()
  const chainId = customChainId ?? walletChainId
  const [priceInputRequest, setLocalPriceInputRequest] = useState<LimitOrderContextValue['priceInputRequest']>()

  const setPriceInputRequest = useCallback((request: { rate: string; invertRate: string }) => {
    setLocalPriceInputRequest(current => ({
      ...request,
      id: (current?.id ?? 0) + 1,
    }))
  }, [])

  const value = useMemo(
    () => ({
      customChainId,
      chainId,
      networkName: NETWORKS_INFO[chainId]?.name || networkInfo.name,
      syncOrderListTabWithQuery: !customChainId,
      priceInputRequest,
      setPriceInputRequest,
    }),
    [chainId, customChainId, networkInfo.name, priceInputRequest, setPriceInputRequest],
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
      setPriceInputRequest: () => {},
    }
  )
}

export const useLimitOrderCustomChainId = () => useLimitOrderContext().customChainId

export const useLimitOrderChainId = (orderChainId?: ChainId) => {
  const { chainId } = useLimitOrderContext()

  return orderChainId ?? chainId
}

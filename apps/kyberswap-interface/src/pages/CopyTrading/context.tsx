import { type PropsWithChildren, createContext, useContext, useMemo } from 'react'
import type { Chain } from 'services/copyTrading/types/agents'
import type { Address } from 'services/copyTrading/types/primitives'

type CopyTradingContextValue = {
  chains: Chain[]
  refreshChains: () => unknown
  chainsLoading: boolean
  ownerAddress?: Address
  selectedChainId: number
}

const CopyTradingContext = createContext<CopyTradingContextValue | undefined>(undefined)

type CopyTradingProviderProps = PropsWithChildren<{
  chains: Chain[]
  refreshChains: () => unknown
  chainsLoading: boolean
  ownerAddress?: Address
  selectedChainId: number
}>

export const CopyTradingProvider = ({
  chains,
  children,
  ownerAddress,
  refreshChains,
  chainsLoading,
  selectedChainId,
}: CopyTradingProviderProps) => {
  const value = useMemo(
    () => ({ chains, ownerAddress, selectedChainId, refreshChains, chainsLoading }),
    [chains, ownerAddress, selectedChainId, refreshChains, chainsLoading],
  )

  return <CopyTradingContext.Provider value={value}>{children}</CopyTradingContext.Provider>
}

export const useCopyTradingContext = () => {
  const context = useContext(CopyTradingContext)
  if (!context) throw new Error('useCopyTradingContext must be used within CopyTradingProvider')
  return context
}

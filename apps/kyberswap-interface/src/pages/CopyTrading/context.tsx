import { type PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Address, Chain } from 'services/copyTrading/types'

type CopyTradingContextValue = {
  chains: Chain[]
  ownerAddress?: Address
  selectedChainId?: number
  setSelectedChainId: (chainId?: number) => void
}

const CopyTradingContext = createContext<CopyTradingContextValue | undefined>(undefined)

type CopyTradingProviderProps = PropsWithChildren<{
  chains: Chain[]
  ownerAddress?: Address
}>

export const CopyTradingProvider = ({ chains, children, ownerAddress }: CopyTradingProviderProps) => {
  const [selectedChainId, setSelectedChainId] = useState<number>()

  useEffect(() => {
    setSelectedChainId(currentChainId => {
      const enabledChains = chains.filter(chain => chain.isEnabled)
      const isCurrentChainEnabled = enabledChains.some(chain => chain.chainId === currentChainId)

      return isCurrentChainEnabled ? currentChainId : enabledChains[0]?.chainId
    })
  }, [chains])

  const value = useMemo(
    () => ({ chains, ownerAddress, selectedChainId, setSelectedChainId }),
    [chains, ownerAddress, selectedChainId],
  )

  return <CopyTradingContext.Provider value={value}>{children}</CopyTradingContext.Provider>
}

export const useCopyTradingContext = () => {
  const context = useContext(CopyTradingContext)
  if (!context) throw new Error('useCopyTradingContext must be used within CopyTradingProvider')
  return context
}

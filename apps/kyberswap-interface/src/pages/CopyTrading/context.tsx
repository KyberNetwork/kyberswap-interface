import { type PropsWithChildren, createContext, useContext, useMemo, useState } from 'react'

type CopyTradingContextValue = {
  selectedChainId?: number
  setSelectedChainId: (chainId?: number) => void
}

const CopyTradingContext = createContext<CopyTradingContextValue | undefined>(undefined)

export const CopyTradingProvider = ({ children }: PropsWithChildren) => {
  const [selectedChainId, setSelectedChainId] = useState<number>()
  const value = useMemo(() => ({ selectedChainId, setSelectedChainId }), [selectedChainId])

  return <CopyTradingContext.Provider value={value}>{children}</CopyTradingContext.Provider>
}

export const useCopyTradingContext = () => {
  const context = useContext(CopyTradingContext)
  if (!context) throw new Error('useCopyTradingContext must be used within CopyTradingProvider')
  return context
}

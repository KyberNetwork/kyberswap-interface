import { type PropsWithChildren, createContext, useContext, useMemo } from 'react'
import type { Chain, ChainQuoteToken } from 'services/copyTrading/types/agents'
import type { Address } from 'services/copyTrading/types/primitives'

export type CopyTradingChain = Chain & { quoteToken: ChainQuoteToken }

// Discovery adapters validate token identity and decimals; the feature boundary requires them.
export const hasChainQuoteTokens = (chains: Chain[]): chains is CopyTradingChain[] =>
  chains.every(chain => chain.quoteToken !== undefined)

type CopyTradingContextValue = {
  chains: CopyTradingChain[]
  ownerAddress?: Address
  selectedChainId: number
}

const CopyTradingContext = createContext<CopyTradingContextValue | undefined>(undefined)

type CopyTradingProviderProps = PropsWithChildren<{
  chains: CopyTradingChain[]
  ownerAddress?: Address
  selectedChainId: number
}>

export const CopyTradingProvider = ({ chains, children, ownerAddress, selectedChainId }: CopyTradingProviderProps) => {
  const value = useMemo(() => ({ chains, ownerAddress, selectedChainId }), [chains, ownerAddress, selectedChainId])

  return <CopyTradingContext.Provider value={value}>{children}</CopyTradingContext.Provider>
}

export const useCopyTradingContext = () => {
  const context = useContext(CopyTradingContext)
  if (!context) throw new Error('useCopyTradingContext must be used within CopyTradingProvider')
  return context
}

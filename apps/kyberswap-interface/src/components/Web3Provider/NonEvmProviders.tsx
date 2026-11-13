import { ReactNode, createContext, useContext } from 'react'

import { BitcoinWalletProvider } from 'components/Web3Provider/BitcoinProvider'
import NEARWalletProvider from 'components/Web3Provider/NearProvider'
import { SolanaProvider } from 'components/Web3Provider/SolanaProvider'

const NonEvmProvidersContext = createContext(false)

/** Shared wallet state for the Swap, CrossChainSwap, and Campaign route trees. */
export default function NonEvmProviders({ children }: { children: ReactNode }) {
  const inherited = useContext(NonEvmProvidersContext)
  if (inherited) return <>{children}</>

  return (
    <NonEvmProvidersContext.Provider value={true}>
      <BitcoinWalletProvider>
        <NEARWalletProvider>
          <SolanaProvider>{children}</SolanaProvider>
        </NEARWalletProvider>
      </BitcoinWalletProvider>
    </NonEvmProvidersContext.Provider>
  )
}

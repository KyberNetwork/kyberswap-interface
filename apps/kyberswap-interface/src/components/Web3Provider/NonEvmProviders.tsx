import { ReactNode } from 'react'

import { BitcoinWalletProvider } from 'components/Web3Provider/BitcoinProvider'
import NEARWalletProvider from 'components/Web3Provider/NearProvider'
import { SolanaProvider } from 'components/Web3Provider/SolanaProvider'

/** Shared wallet state for the Swap, CrossChainSwap, and Campaign route trees. */
export default function NonEvmProviders({ children }: { children: ReactNode }) {
  return (
    <BitcoinWalletProvider>
      <NEARWalletProvider>
        <SolanaProvider>{children}</SolanaProvider>
      </NEARWalletProvider>
    </BitcoinWalletProvider>
  )
}

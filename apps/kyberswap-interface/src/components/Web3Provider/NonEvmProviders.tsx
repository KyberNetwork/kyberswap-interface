import { ReactNode } from 'react'

import { BitcoinWalletProvider } from 'components/Web3Provider/BitcoinProvider'
import NEARWalletProvider from 'components/Web3Provider/NearProvider'
import { SolanaProvider } from 'components/Web3Provider/SolanaProvider'

/**
 * Composes the three non-EVM wallet providers (Bitcoin > NEAR > Solana). These pull in ~900KB of
 * wallet SDKs (NEAR / Solana / Bitcoin) that are only consumed by the lazy CrossChainSwap and Campaign
 * routes, so this wrapper is mounted at the route level (around those pages' default exports) to keep
 * the SDKs off the cold-load entry chunk and load them only when such a route renders.
 */
export default function NonEvmProviders({ children }: { children: ReactNode }) {
  return (
    <BitcoinWalletProvider>
      <NEARWalletProvider>
        <SolanaProvider>{children}</SolanaProvider>
      </NEARWalletProvider>
    </BitcoinWalletProvider>
  )
}

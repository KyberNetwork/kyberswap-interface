import { ReactNode } from 'react'

import { BitcoinWalletProvider } from 'components/Web3Provider/BitcoinProvider'
import NEARWalletProvider from 'components/Web3Provider/NearProvider'
import { SolanaProvider } from 'components/Web3Provider/SolanaProvider'

/**
 * Composes the three non-EVM wallet providers (Bitcoin > NEAR > Solana) in the SAME nesting order
 * they previously had at the app root.
 *
 * These providers pull in ~900KB of wallet SDKs (NEAR / Solana / Bitcoin). Mounting them at the app
 * root forced those SDKs into the cold-load entry chunk even though they are ONLY consumed by the
 * lazy CrossChainSwap and Campaign routes. This wrapper is therefore mounted at the route level
 * (around those pages' default exports) so the wallet SDKs stay off the cold-load entry and only
 * load when a route that actually needs them renders.
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

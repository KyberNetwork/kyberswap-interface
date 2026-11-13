import type { ReactNode } from 'react'

import CrossChainSwapProvider, {
  type CrossChainSwapOptions,
} from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { SwapWalletProvider } from 'components/SwapWallets/SwapWalletProvider'
import NonEvmProviders from 'components/Web3Provider/NonEvmProviders'

/** Retained after activation so changing pairs does not discard independent signing sessions. */
const SwapCrossChainProviders = ({ children, ...options }: CrossChainSwapOptions & { children: ReactNode }) => (
  <NonEvmProviders>
    <SwapWalletProvider inputChain={options.fromChain} outputChain={options.toChain}>
      <CrossChainSwapProvider {...options}>{children}</CrossChainSwapProvider>
    </SwapWalletProvider>
  </NonEvmProviders>
)

export default SwapCrossChainProviders

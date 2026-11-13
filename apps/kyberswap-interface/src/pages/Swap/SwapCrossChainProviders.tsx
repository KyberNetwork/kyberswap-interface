import { type ReactNode, useLayoutEffect } from 'react'

import CrossChainSwapProvider, {
  type CrossChainSwapOptions,
  useOptionalCrossChainSwap,
} from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { useSwapWallets } from 'components/SwapWallets/SwapWalletContext'
import { SwapWalletProvider } from 'components/SwapWallets/SwapWalletProvider'
import NonEvmProviders from 'components/Web3Provider/NonEvmProviders'
import type { SwapRuntimeSnapshot } from 'pages/Swap/SwapPageRuntime'

// Project the existing owners into the persistent right panel; never initialize another engine or wallet session.
const PublishRuntime = ({ onChange }: { onChange: (snapshot: SwapRuntimeSnapshot) => void }) => {
  const crossChain = useOptionalCrossChainSwap()
  const wallets = useSwapWallets()
  useLayoutEffect(() => {
    onChange({
      route: crossChain
        ? {
            currencyIn: crossChain.currencyIn,
            currencyOut: crossChain.currencyOut,
            fromChainId: crossChain.fromChainId,
            toChainId: crossChain.toChainId,
            selectedQuote: crossChain.selectedQuote,
            loading: crossChain.loading,
          }
        : undefined,
      wallets: wallets
        ? { inputAddress: wallets.inputAddress, inputFamily: wallets.inputConnection?.family }
        : undefined,
    })
  }, [crossChain, wallets, onChange])
  return null
}

/** Retained after activation so changing pairs does not discard independent signing sessions. */
const SwapCrossChainProviders = ({
  children,
  onRuntimeChange,
  ...options
}: CrossChainSwapOptions & {
  children: ReactNode
  onRuntimeChange: (snapshot: SwapRuntimeSnapshot) => void
}) => (
  <NonEvmProviders>
    <SwapWalletProvider inputChain={options.fromChain} outputChain={options.toChain}>
      <CrossChainSwapProvider {...options}>
        <PublishRuntime onChange={onRuntimeChange} />
        {children}
      </CrossChainSwapProvider>
    </SwapWalletProvider>
  </NonEvmProviders>
)

export default SwapCrossChainProviders

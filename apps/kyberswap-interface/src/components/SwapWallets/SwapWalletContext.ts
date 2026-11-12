import { createContext, useContext } from 'react'

import type { SwapWalletConnection } from 'components/SwapWallets/walletConnection'

export type SwapWalletContextValue = {
  inputConnection?: SwapWalletConnection
  outputConnection?: SwapWalletConnection
  inputAddress: string
  outputAddress: string
  connectInput: () => void
  connectOutput: (onConnected?: () => void) => void
  disconnectInput: () => void
  disconnectOutput: () => void
  reverseConnections: () => void
}

export const SwapWalletContext = createContext<SwapWalletContextValue | undefined>(undefined)
export const useSwapWallets = () => useContext(SwapWalletContext)

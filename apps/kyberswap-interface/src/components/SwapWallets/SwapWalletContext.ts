import { createContext, useContext } from 'react'

import type { SwapWalletConnection, WalletFamily } from 'components/SwapWallets/walletConnection'

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

/** Display-only signer identity for History and processing orders outside the lazy wallet tree. */
export type SwapWalletSnapshot = Readonly<{ inputAddress: string; inputFamily?: WalletFamily }>
export const SwapWalletSnapshotContext = createContext<SwapWalletSnapshot | undefined>(undefined)
export const useSwapWalletSnapshot = (): SwapWalletSnapshot | undefined => {
  const wallets = useSwapWallets()
  const snapshot = useContext(SwapWalletSnapshotContext)
  return wallets ? { inputAddress: wallets.inputAddress, inputFamily: wallets.inputConnection?.family } : snapshot
}

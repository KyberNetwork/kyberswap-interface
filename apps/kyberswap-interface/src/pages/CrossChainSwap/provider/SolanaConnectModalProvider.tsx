import { ReactNode, createContext, useContext, useState } from 'react'

import SolanaConnectModal from 'pages/CrossChainSwap/components/SolanaConnectModal'

interface SolanaConnectModalContextState {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

const defaultContext: SolanaConnectModalContextState = {
  isOpen: false,
  setIsOpen: () => {},
}

const SolanaConnectModalContext = createContext<SolanaConnectModalContextState>(defaultContext)

export const SolanaConnectModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <SolanaConnectModalContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
      {isOpen && <SolanaConnectModal />}
    </SolanaConnectModalContext.Provider>
  )
}

export const useSolanaConnectModal = () => {
  const context = useContext(SolanaConnectModalContext)
  if (!context) {
    throw new Error('useSolanaConnectModal must be used within a SolanaConnectModalProvider')
  }
  return context
}

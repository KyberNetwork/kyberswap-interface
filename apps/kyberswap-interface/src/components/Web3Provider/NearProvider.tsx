import '@near-wallet-selector/modal-ui/styles.css'
import { WalletSelectorProvider } from '@near-wallet-selector/react-hook'
import { ReactNode } from 'react'

import { walletSelectorConfig } from './nearWalletConfig'

const NEARWalletProvider = ({ children }: { children: ReactNode }) => (
  <WalletSelectorProvider config={walletSelectorConfig}>{children}</WalletSelectorProvider>
)

export default NEARWalletProvider

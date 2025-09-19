// import { setupHereWallet } from '@near-wallet-selector/here-wallet'
import { NetworkId } from '@near-wallet-selector/core/src/lib/options.types'
import { setupHotWallet } from '@near-wallet-selector/hot-wallet'
import { setupLedger } from '@near-wallet-selector/ledger'
import { setupMathWallet } from '@near-wallet-selector/math-wallet'
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet'
import '@near-wallet-selector/modal-ui/styles.css'
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet'
import { setupNightly } from '@near-wallet-selector/nightly'
import { WalletSelectorProvider } from '@near-wallet-selector/react-hook'
import { setupSender } from '@near-wallet-selector/sender'
import { ReactNode } from 'react'

const walletSelectorConfig = {
  network: 'mainnet' as NetworkId,
  debug: false,
  modules: [
    // setupEthereumWallets({
    //   wagmiConfig: wagmiAdapter.wagmiConfig,
    //   web3Modal,
    // }),
    setupMeteorWallet(),
    // setupBitteWallet(),
    setupHotWallet(),
    setupMyNearWallet(),
    setupLedger(),
    setupSender(),
    setupNightly(),
    // setupBitgetWallet(),
    setupMathWallet(),
    // setupHereWallet(),
    // setupMeteorWalletApp({ contractId: CONTRACT_ID }),
    // setupOKXWallet(),
    // setupWelldoneWallet(),
    // setupCoin98Wallet(),
    // setupRamperWallet(),
    // setupXDEFI(),
    // setupNearMobileWallet(),
  ],
}

// Provider component
export default function NEARWalletProvider({ children }: { children: ReactNode }) {
  return <WalletSelectorProvider config={walletSelectorConfig as any}>{children}</WalletSelectorProvider>
}

import { WalletSelectorParams } from '@near-wallet-selector/core'
import { setupHotWallet } from '@near-wallet-selector/hot-wallet'
import { setupLedger } from '@near-wallet-selector/ledger'
import { setupMathWallet } from '@near-wallet-selector/math-wallet'
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet'
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet'
import { setupNightly } from '@near-wallet-selector/nightly'
import { setupSender } from '@near-wallet-selector/sender'

export const walletSelectorConfig = {
  network: 'mainnet',
  debug: false,
  modules: [
    setupMeteorWallet(),
    setupHotWallet(),
    setupMyNearWallet(),
    setupLedger(),
    setupSender(),
    setupNightly(),
    setupMathWallet(),
  ],
} as WalletSelectorParams

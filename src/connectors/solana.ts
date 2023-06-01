import {
  BraveWalletAdapter,
  Coin98WalletAdapter,
  CoinbaseWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'

import { SelectedNetwork } from 'constants/networks/solana'

export const braveAdapter = new BraveWalletAdapter()
export const coinbaseAdapter = new CoinbaseWalletAdapter()
export const coin98Adapter = new Coin98WalletAdapter()
export const solflareAdapter = new SolflareWalletAdapter({ network: SelectedNetwork })
export const phantomAdapter = new PhantomWalletAdapter({ network: SelectedNetwork })
export const slopeAdapter = new SlopeWalletAdapter({ network: SelectedNetwork })

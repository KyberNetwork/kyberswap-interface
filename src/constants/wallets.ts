import { BaseMessageSignerWalletAdapter, WalletReadyState } from '@solana/wallet-adapter-base'
import {
  BraveWalletAdapter,
  Coin98WalletAdapter,
  CoinbaseWalletAdapter, // LedgerWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { isMobile } from 'react-device-detect'

import BRAVE_L from 'assets/images/brave_wallet-light.svg'
import BRAVE from 'assets/images/brave_wallet.svg'
import COIN98_L from 'assets/images/coin98-light.svg'
import COIN98 from 'assets/images/coin98.svg'
import COINBASE_L from 'assets/images/coinbase-wallet-light.svg'
import COINBASE from 'assets/images/coinbase-wallet.svg'
import METAMASK_L from 'assets/images/metamask-light.svg'
import METAMASK from 'assets/images/metamask.svg'
import PHANTOM_L from 'assets/images/phantom-light.svg'
import PHANTOM from 'assets/images/phantom.svg'
import SLOPE_L from 'assets/images/slope-light.svg'
import SLOPE from 'assets/images/slope.svg'
import SOLFLARE_L from 'assets/images/solflare-light.svg'
import SOLFLARE from 'assets/images/solflare.svg'
import SOLLET_L from 'assets/images/sollet-light.png'
import SOLLET from 'assets/images/sollet.png'
import WALLETCONNECT_L from 'assets/images/wallet-connect-light.svg'
import WALLETCONNECT from 'assets/images/wallet-connect.svg'
import { braveInjectedConnector, coin98InjectedConnector, injected, walletconnect, walletlink } from 'connectors'
import checkForBraveBrowser from 'utils/checkForBraveBrowser'

import { SelectedNetwork } from './networks/solana'

const braveAdapter = new BraveWalletAdapter()
const coinbaseAdapter = new CoinbaseWalletAdapter()
const coin98Adapter = new Coin98WalletAdapter()
const solflareAdapter = new SolflareWalletAdapter({ network: SelectedNetwork })
const phantomAdapter = new PhantomWalletAdapter({ network: SelectedNetwork })
const solletAdapter = new SolletExtensionWalletAdapter()
const slopeAdapter = new SlopeWalletAdapter({ network: SelectedNetwork })
// const ledgerAdapter = new LedgerWalletAdapter()

const detectMetamask = (): WalletReadyState => {
  if (isMobile) return WalletReadyState.Unsupported
  if (window.ethereum?.isMetaMask) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectBrave = (): WalletReadyState => {
  //todo namgold: fail connect on mobile solana
  if (checkForBraveBrowser()) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectCoin98 = (): WalletReadyState => {
  if (isMobile) return WalletReadyState.Unsupported
  if (window.ethereum?.isCoin98 || window.coin98) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectCoinbase = (): WalletReadyState => {
  if (isMobile) return WalletReadyState.Unsupported
  // in NotDetected case, Coinbase show install link itself
  return WalletReadyState.Installed
}

const detectCoinBaseLink = (): WalletReadyState => {
  if (isMobile) return WalletReadyState.Loadable
  return WalletReadyState.Unsupported
}

export interface WalletInfo {
  name: string
  icon: string
  iconLight: string
  installLink?: string
}

export interface EVMWalletInfo extends WalletInfo {
  connector?: AbstractConnector
  href?: string
  readyState: () => WalletReadyState
}

export interface SolanaWalletInfo extends WalletInfo {
  adapter: BaseMessageSignerWalletAdapter
  readyStateSolana: () => WalletReadyState
}

export const SUPPORTED_WALLETS = {
  METAMASK: {
    connector: injected,
    name: 'MetaMask',
    icon: METAMASK,
    iconLight: METAMASK_L,
    installLink: 'https://metamask.io/download',
    readyState: detectMetamask,
  } as EVMWalletInfo,
  BRAVE: {
    connector: braveInjectedConnector,
    adapter: braveAdapter,
    name: 'Brave Wallet',
    icon: BRAVE,
    iconLight: BRAVE_L,
    installLink: 'https://brave.com/download',
    readyState: detectBrave,
    readyStateSolana: () => braveAdapter.readyState,
  } as EVMWalletInfo & SolanaWalletInfo,
  COIN98: {
    connector: coin98InjectedConnector,
    adapter: coin98Adapter,
    name: 'Coin98',
    icon: COIN98,
    iconLight: COIN98_L,
    installLink: 'https://wallet.coin98.com/',
    readyState: detectCoin98,
    readyStateSolana: () => (isMobile ? coin98Adapter.readyState : WalletReadyState.Unsupported),
  } as EVMWalletInfo & SolanaWalletInfo,
  COINBASE: {
    connector: walletlink,
    adapter: coinbaseAdapter,
    name: 'Coinbase',
    icon: COINBASE,
    iconLight: COINBASE_L,
    installLink: 'https://www.coinbase.com/wallet',
    readyState: detectCoinbase,
    readyStateSolana: () => coinbaseAdapter.readyState,
  } as EVMWalletInfo & SolanaWalletInfo,
  COINBASE_LINK: {
    // To get this link: go to Coinbase app -> Dapp Browser -> go to dmm.exchange -> click "..." button -> share -> copy link
    href: 'https://go.cb-w.com/S7mannYpWjb',
    name: 'Coinbase Wallet',
    icon: COINBASE,
    iconLight: COINBASE_L,
    readyState: detectCoinBaseLink,
  } as EVMWalletInfo,
  WALLET_CONNECT: {
    connector: walletconnect,
    name: 'WalletConnect',
    icon: WALLETCONNECT,
    iconLight: WALLETCONNECT_L,
    installLink: 'https://walletconnect.com/',
    readyState: () => WalletReadyState.Installed,
  } as EVMWalletInfo,
  // LEDGER: {
  //   adapter: ledgerAdapter,
  //   name: 'Ledger',
  //   iconName: 'ledger.svg',
  //   installLink: ledgerAdapter.url,
  //   readyStateSolana: ledgerAdapter.readyState,
  // } as SolanaWalletInfo,
  SOLFLARE: {
    adapter: solflareAdapter,
    name: 'Solflare',
    icon: SOLFLARE,
    iconLight: SOLFLARE_L,
    installLink: solflareAdapter.url,
    readyStateSolana: () => solflareAdapter.readyState,
  } as SolanaWalletInfo,
  PHANTOM: {
    adapter: phantomAdapter,
    name: 'Phantom',
    icon: PHANTOM,
    iconLight: PHANTOM_L,
    installLink: phantomAdapter.url,
    readyStateSolana: () => phantomAdapter.readyState,
  } as SolanaWalletInfo,
  SOLLET: {
    adapter: solletAdapter,
    name: 'Sollet',
    icon: SOLLET,
    iconLight: SOLLET_L,
    installLink: solletAdapter.url,
    readyStateSolana: () => (isMobile ? solletAdapter.readyState : WalletReadyState.Unsupported),
  } as SolanaWalletInfo,
  SLOPE: {
    adapter: slopeAdapter,
    name: 'Slope Wallet',
    icon: SLOPE,
    iconLight: SLOPE_L,
    installLink: slopeAdapter.url,
    readyStateSolana: () => (isMobile ? slopeAdapter.readyState : WalletReadyState.Unsupported),
  } as SolanaWalletInfo,
} as const

export type SUPPORTED_WALLET = keyof typeof SUPPORTED_WALLETS
console.info({ SUPPORTED_WALLETS })

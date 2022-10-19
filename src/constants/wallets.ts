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
  // In Brave browser, by default ethereum.isMetaMask and ethereum.isBraveWallet is true even Metamask not installed
  if (window.ethereum?.isMetaMask && !window.ethereum?.isBraveWallet) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectBrave = (): WalletReadyState => {
  //todo namgold: fail connect on mobile solana
  if (checkForBraveBrowser() && window.ethereum?.isBraveWallet) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectCoin98 = (): WalletReadyState => {
  if (isMobile) return WalletReadyState.Unsupported
  if (window.ethereum && window.coin98) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectCoinbase = (): WalletReadyState => {
  if (isMobile) return WalletReadyState.Unsupported
  // in NotDetected case, Coinbase show install link itself
  if (window.ethereum?.isCoinbaseWallet || window.ethereum?.providers?.some(p => p.isCoinbaseWallet))
    return WalletReadyState.Installed
  if (window.coinbaseWalletExtension) return WalletReadyState.Loadable
  return WalletReadyState.NotDetected
}

const detectCoinBaseLink = (): WalletReadyState => {
  if (isMobile) return WalletReadyState.Loadable
  return WalletReadyState.Unsupported
}

const detectPhantomWallet = (): WalletReadyState => {
  // On Brave browser disable phantom
  if (window.solana?.isPhantom && window.solana?.isBraveWallet) return WalletReadyState.NotDetected
  return phantomAdapter.readyState
}

export interface WalletInfo {
  name: string
  icon: string
  iconLight: string
  installLink?: string
  href?: string
}

export interface EVMWalletInfo extends WalletInfo {
  connector: AbstractConnector
  readyState: () => WalletReadyState
}

export interface SolanaWalletInfo extends WalletInfo {
  adapter: BaseMessageSignerWalletAdapter
  readyStateSolana: () => WalletReadyState
}

export const SUPPORTED_WALLETS: { [key: string]: WalletInfo } = {
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
    // If Phantom extension installed block Brave wallet
    readyStateSolana: () => (window.solana?.isBraveWallet ? braveAdapter.readyState : WalletReadyState.NotDetected),
  } as EVMWalletInfo & SolanaWalletInfo,
  COIN98: {
    connector: coin98InjectedConnector,
    adapter: coin98Adapter,
    name: 'Coin98',
    icon: COIN98,
    iconLight: COIN98_L,
    installLink: 'https://wallet.coin98.com/',
    readyState: detectCoin98,
    readyStateSolana: () => coin98Adapter.readyState,
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
    readyStateSolana: detectPhantomWallet,
  } as SolanaWalletInfo,
  SOLLET: {
    adapter: solletAdapter,
    name: 'Sollet',
    icon: SOLLET,
    iconLight: SOLLET_L,
    installLink: solletAdapter.url,
    readyStateSolana: () => (isMobile ? WalletReadyState.Unsupported : solletAdapter.readyState),
  } as SolanaWalletInfo,
  SLOPE: {
    adapter: slopeAdapter,
    name: 'Slope Wallet',
    icon: SLOPE,
    iconLight: SLOPE_L,
    installLink: slopeAdapter.url,
    readyStateSolana: () => (isMobile ? WalletReadyState.Unsupported : slopeAdapter.readyState),
  } as SolanaWalletInfo,
} as const

export type SUPPORTED_WALLET = keyof typeof SUPPORTED_WALLETS

export const WALLETLINK_LOCALSTORAGE_NAME = '-walletlink:https://www.walletlink.org:Addresses'

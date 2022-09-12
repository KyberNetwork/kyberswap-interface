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

import { braveInjectedConnector, coin98InjectedConnector, injected, walletconnect, walletlink } from 'connectors'

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
  if (isMobile) return WalletReadyState.Installed
  if (window.ethereum?.isMetaMask) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectBrave = (): WalletReadyState => {
  // handled NotDetected case by show install note
  return WalletReadyState.Installed
  //todo namgold: fail connect on mobile
  // if (checkForBraveBrowser()) return WalletReadyState.Installed
  // return WalletReadyState.NotDetected
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
  iconName: string
  installLink?: string
}

export interface EVMWalletInfo extends WalletInfo {
  connector?: AbstractConnector
  href?: string
  readyState: WalletReadyState | (() => WalletReadyState)
}

export interface SolanaWalletInfo extends WalletInfo {
  adapter: BaseMessageSignerWalletAdapter
  readyStateSolana: WalletReadyState
}

export const SUPPORTED_WALLETS = {
  METAMASK: {
    connector: injected,
    name: 'MetaMask',
    iconName: 'metamask.svg',
    installLink: 'https://metamask.io/download',
    readyState: detectMetamask(),
  } as EVMWalletInfo,
  BRAVE: {
    connector: braveInjectedConnector,
    adapter: braveAdapter,
    name: 'Brave Wallet',
    iconName: 'brave_wallet.svg',
    installLink: 'https://brave.com/download',
    readyState: detectBrave,
    readyStateSolana: braveAdapter.readyState,
  } as EVMWalletInfo & SolanaWalletInfo,
  COIN98: {
    connector: coin98InjectedConnector,
    adapter: coin98Adapter,
    name: 'Coin98',
    iconName: 'coin98.svg',
    installLink: 'https://wallet.coin98.com/',
    readyState: detectCoin98(),
    readyStateSolana: coin98Adapter.readyState,
  } as EVMWalletInfo & SolanaWalletInfo,
  COINBASE: {
    connector: walletlink,
    adapter: coinbaseAdapter,
    name: 'Coinbase',
    iconName: 'wallet-link.svg',
    installLink: 'https://www.coinbase.com/wallet',
    readyState: detectCoinbase(),
    readyStateSolana: coinbaseAdapter.readyState,
  } as EVMWalletInfo & SolanaWalletInfo,
  COINBASE_LINK: {
    // To get this link: go to Coinbase app -> Dapp Browser -> go to dmm.exchange -> click "..." button -> share -> copy link
    href: 'https://go.cb-w.com/S7mannYpWjb',
    name: 'Coinbase Wallet',
    iconName: 'wallet-link.svg',
    readyState: detectCoinBaseLink(),
  } as EVMWalletInfo,
  WALLET_CONNECT: {
    connector: walletconnect,
    name: 'WalletConnect',
    iconName: 'wallet-connect.svg',
    installLink: 'https://walletconnect.com/',
    readyState: WalletReadyState.Installed,
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
    iconName: 'solflare.svg',
    installLink: solflareAdapter.url,
    readyStateSolana: solflareAdapter.readyState,
  } as SolanaWalletInfo,
  PHANTOM: {
    adapter: phantomAdapter,
    name: 'Phantom',
    iconName: 'phantom.svg',
    installLink: phantomAdapter.url,
    readyStateSolana: phantomAdapter.readyState,
  } as SolanaWalletInfo,
  SOLLET: {
    adapter: solletAdapter,
    name: 'Sollet',
    iconName: 'sollet.png',
    installLink: solletAdapter.url,
    readyStateSolana: solletAdapter.readyState,
  } as SolanaWalletInfo,
  SLOPE: {
    adapter: slopeAdapter,
    name: 'Slope Wallet',
    iconName: 'slope.svg',
    installLink: slopeAdapter.url,
    readyStateSolana: slopeAdapter.readyState,
  } as SolanaWalletInfo,
} as const
console.info({ SUPPORTED_WALLETS })

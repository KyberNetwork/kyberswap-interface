import { BaseMessageSignerWalletAdapter, WalletReadyState } from '@solana/wallet-adapter-base'
import { Web3ReactHooks } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { isMobile } from 'react-device-detect'

import BRAVE from 'assets/wallets-connect/brave.svg'
import COIN98 from 'assets/wallets-connect/coin98.svg'
import COINBASE from 'assets/wallets-connect/coinbase.svg'
import METAMASK from 'assets/wallets-connect/metamask.svg'
import PHANTOM from 'assets/wallets-connect/phantom.svg'
import SLOPE from 'assets/wallets-connect/slope.svg'
import SOLFLARE from 'assets/wallets-connect/solflare.svg'
import TRUSTWALLET from 'assets/wallets-connect/trust-wallet.svg'
import WALLETCONNECT from 'assets/wallets-connect/wallet-connect.svg'
import INJECTED_DARK_ICON from 'assets/wallets/browser-wallet-dark.svg'
import INJECTED_LIGHT_ICON from 'assets/wallets/browser-wallet-light.svg'
import {
  brave,
  braveHooks,
  coin98,
  coin98Hooks,
  coinbaseWallet,
  coinbaseWalletHooks,
  injected,
  injectedHooks,
  metaMask,
  metamaskHooks,
  trustWallet,
  trustWalletHooks,
  walletConnectV2,
  walletConnectV2Hooks,
} from 'constants/connectors/evm'
import {
  braveAdapter,
  coin98Adapter,
  coinbaseAdapter,
  phantomAdapter,
  slopeAdapter,
  solflareAdapter,
} from 'constants/connectors/solana'
import { getIsCoinbaseWallet, getIsMetaMaskWallet } from 'constants/connectors/utils'
import checkForBraveBrowser from 'utils/checkForBraveBrowser'

const detectInjected = (): WalletReadyState => {
  if (isMobile) {
    if (window.ethereum) return WalletReadyState.Installed
    return WalletReadyState.NotDetected
  }
  return WalletReadyState.Unsupported
}

const detectMetamask = (): WalletReadyState => {
  if (isMobile) {
    return WalletReadyState.Unsupported
  }
  if (getIsMetaMaskWallet()) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectBrave = (): WalletReadyState => {
  //todo known issue: fail connect on mobile solana
  if (checkForBraveBrowser() && window.ethereum?.isBraveWallet) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectCoin98 = (): WalletReadyState => {
  if (isMobile) return WalletReadyState.Unsupported // show metamask as injected option instead
  if (window.ethereum && window.coin98) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectCoinbase = (): WalletReadyState => {
  if (isMobile) return WalletReadyState.NotDetected
  // in NotDetected case, Coinbase show install link itself
  if (getIsCoinbaseWallet()) return WalletReadyState.Installed
  if (window.coinbaseWalletExtension) return WalletReadyState.Loadable
  return WalletReadyState.NotDetected
}

const detectCoinBaseLink = (): WalletReadyState => {
  if (isMobile) return WalletReadyState.Loadable
  return WalletReadyState.Unsupported
}

const detectTrustWallet = (): WalletReadyState => {
  if (window.ethereum?.isTrustWallet) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
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
  connector: Connector
  hooks: Web3ReactHooks
  readyState: () => WalletReadyState
}

export interface SolanaWalletInfo extends WalletInfo {
  adapter: BaseMessageSignerWalletAdapter
  readyStateSolana: () => WalletReadyState
}

export const SUPPORTED_WALLETS = {
  INJECTED: {
    connector: injected,
    hooks: injectedHooks,
    name: 'Browser Wallet',
    icon: INJECTED_DARK_ICON,
    iconLight: INJECTED_LIGHT_ICON,
    installLink: 'https://metamask.io/download',
    readyState: detectInjected,
  } as EVMWalletInfo,
  METAMASK: {
    connector: metaMask,
    hooks: metamaskHooks,
    name: 'MetaMask',
    icon: METAMASK,
    iconLight: METAMASK,
    installLink: 'https://metamask.io/download',
    readyState: detectMetamask,
  } as EVMWalletInfo,
  BRAVE: {
    connector: brave,
    hooks: braveHooks,
    adapter: braveAdapter,
    name: 'Brave Wallet',
    icon: BRAVE,
    iconLight: BRAVE,
    installLink: 'https://brave.com/download',
    readyState: detectBrave,
    // If Phantom extension installed block Brave wallet
    readyStateSolana: () => (window.solana?.isBraveWallet ? braveAdapter.readyState : WalletReadyState.NotDetected),
  } as EVMWalletInfo & SolanaWalletInfo,
  COIN98: {
    connector: coin98,
    hooks: coin98Hooks,
    adapter: coin98Adapter,
    name: 'Coin98',
    icon: COIN98,
    iconLight: COIN98,
    installLink: 'https://wallet.coin98.com/',
    readyState: detectCoin98,
    readyStateSolana: () => coin98Adapter.readyState,
  } as EVMWalletInfo & SolanaWalletInfo,
  COINBASE: {
    connector: coinbaseWallet,
    hooks: coinbaseWalletHooks,
    adapter: coinbaseAdapter,
    name: 'Coinbase',
    icon: COINBASE,
    iconLight: COINBASE,
    installLink: 'https://www.coinbase.com/wallet',
    readyState: detectCoinbase,
    readyStateSolana: () => (isMobile ? WalletReadyState.Unsupported : coinbaseAdapter.readyState),
  } as EVMWalletInfo & SolanaWalletInfo,
  COINBASE_LINK: {
    // To get this link: go to Coinbase app -> Dapp Browser -> go to dmm.exchange -> click "..." button -> share -> copy link
    href: 'https://go.cb-w.com/S7mannYpWjb',
    name: 'Coinbase Wallet',
    icon: COINBASE,
    iconLight: COINBASE,
    readyState: detectCoinBaseLink,
  } as EVMWalletInfo,
  WALLET_CONNECT: {
    connector: walletConnectV2,
    hooks: walletConnectV2Hooks,
    name: 'WalletConnect',
    icon: WALLETCONNECT,
    iconLight: WALLETCONNECT,
    installLink: 'https://walletconnect.com/',
    readyState: () => WalletReadyState.Installed,
  } as EVMWalletInfo,
  SOLFLARE: {
    adapter: solflareAdapter,
    name: 'Solflare',
    icon: SOLFLARE,
    iconLight: SOLFLARE,
    installLink: solflareAdapter.url,
    readyStateSolana: () => solflareAdapter.readyState,
  } as SolanaWalletInfo,
  PHANTOM: {
    adapter: phantomAdapter,
    name: 'Phantom',
    icon: PHANTOM,
    iconLight: PHANTOM,
    installLink: phantomAdapter.url,
    readyStateSolana: detectPhantomWallet,
  } as SolanaWalletInfo,
  SLOPE: {
    adapter: slopeAdapter,
    name: 'Slope Wallet',
    icon: SLOPE,
    iconLight: SLOPE,
    installLink: slopeAdapter.url,
    readyStateSolana: () => (isMobile ? WalletReadyState.Unsupported : slopeAdapter.readyState),
  } as SolanaWalletInfo,
  TRUST_WALLET: {
    connector: trustWallet,
    hooks: trustWalletHooks,
    name: 'Trust Wallet',
    icon: TRUSTWALLET,
    iconLight: TRUSTWALLET,
    installLink: 'https://trustwallet.com/vi/deeplink/',
    readyState: detectTrustWallet,
  } as EVMWalletInfo,
} as const

export const connections = Object.values(SUPPORTED_WALLETS).filter(wallet => 'connector' in wallet) as EVMWalletInfo[]

export type SUPPORTED_WALLET = keyof typeof SUPPORTED_WALLETS

export const LOCALSTORAGE_LAST_WALLETKEY_EVM = 'last-wallet-key-evm'
export const LOCALSTORAGE_LAST_WALLETKEY_SOLANA = 'last-wallet-key-solana'

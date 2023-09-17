import SafeAppsSDK from '@safe-global/safe-apps-sdk'
import { BaseMessageSignerWalletAdapter, WalletReadyState } from '@solana/wallet-adapter-base'
import { Web3ReactHooks } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { isMobile } from 'react-device-detect'

import BLOCTO from 'assets/wallets-connect/bocto.svg'
import BRAVE from 'assets/wallets-connect/brave.svg'
import COIN98 from 'assets/wallets-connect/coin98.svg'
import COINBASE from 'assets/wallets-connect/coinbase.svg'
import KRYSTAL from 'assets/wallets-connect/krystal.svg'
import METAMASK from 'assets/wallets-connect/metamask.svg'
import PHANTOM from 'assets/wallets-connect/phantom.svg'
import RABBY from 'assets/wallets-connect/rabby.svg'
import SAFE from 'assets/wallets-connect/safe.svg'
import SLOPE from 'assets/wallets-connect/slope.svg'
import SOLFLARE from 'assets/wallets-connect/solflare.svg'
import TRUSTWALLET from 'assets/wallets-connect/trust-wallet.svg'
import WALLETCONNECT from 'assets/wallets-connect/wallet-connect.svg'
import INJECTED_DARK_ICON from 'assets/wallets/browser-wallet-dark.svg'
import INJECTED_LIGHT_ICON from 'assets/wallets/browser-wallet-light.svg'
import {
  blocto,
  bloctoHooks,
  bloctoInject,
  bloctoInjectHooks,
  brave,
  braveHooks,
  coin98,
  coin98Hooks,
  coinbaseWallet,
  coinbaseWalletHooks,
  gnosisSafe,
  gnosisSafeHooks,
  injected,
  injectedHooks,
  krystal,
  krystalHooks,
  krystalWalletConnectV2,
  krystalWalletConnectV2Hooks,
  metaMask,
  metamaskHooks,
  rabby,
  rabbyHooks,
  trust,
  trustHooks,
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
import {
  getIsBloctoWallet,
  getIsBraveWallet,
  getIsC98Wallet,
  getIsCoinbaseWallet,
  getIsGenericInjector,
  getIsKrystalWallet,
  getIsMetaMaskWallet,
  getIsRabbyWallet,
  getIsTrustWallet,
} from 'constants/connectors/utils'

const detectInjected = (): WalletReadyState => {
  // used in mobile dapp
  if (getIsGenericInjector()) return WalletReadyState.Installed
  return WalletReadyState.Unsupported
}

const detectMetamask = (): WalletReadyState => {
  if (getIsMetaMaskWallet()) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectBlocto = (): WalletReadyState => {
  if (getIsBloctoWallet()) return WalletReadyState.Unsupported
  return WalletReadyState.Installed
}

const detectBloctoInjected = (): WalletReadyState => {
  if (getIsBloctoWallet()) return WalletReadyState.Installed
  return WalletReadyState.Unsupported
}

let isSafe = false
const appsSdk = new SafeAppsSDK({})
;(async () => {
  try {
    const result = await appsSdk.safe.getEnvironmentInfo()
    if (result) isSafe = true
  } catch (error) {}
})()
const detectSafe = (): WalletReadyState => {
  return isSafe ? WalletReadyState.Installed : WalletReadyState.NotDetected
}

const detectRabby = (): WalletReadyState => {
  if (getIsRabbyWallet()) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectKrystal = (): WalletReadyState => {
  if (getIsKrystalWallet()) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectKrystalWC = (): WalletReadyState => {
  if (!getIsKrystalWallet()) return WalletReadyState.Installed
  return WalletReadyState.Unsupported
}

const detectBrave = (): WalletReadyState => {
  //todo known issue: fail connect on mobile solana
  if (getIsBraveWallet()) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectCoin98 = (): WalletReadyState => {
  if (getIsC98Wallet()) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectCoinbase = (): WalletReadyState => {
  const detectCoinbase = (): WalletReadyState => {
    if (getIsCoinbaseWallet()) return WalletReadyState.Installed
    // in NotDetected case, Coinbase show install link itself
    if (window.coinbaseWalletExtension && !isMobile) return WalletReadyState.Loadable
    return WalletReadyState.NotDetected
  }
  const result = detectCoinbase()
  return result
}

const detectTrustWallet = (): WalletReadyState => {
  if (getIsTrustWallet()) return WalletReadyState.Installed
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
  KRYSTAL: {
    connector: krystal,
    hooks: krystalHooks,
    name: 'Krystal',
    icon: KRYSTAL,
    iconLight: KRYSTAL,
    installLink: 'https://wallet.krystal.app',
    readyState: detectKrystal,
  } as EVMWalletInfo,
  KRYSTAL_WC: {
    connector: krystalWalletConnectV2,
    hooks: krystalWalletConnectV2Hooks,
    name: 'Krystal',
    icon: KRYSTAL,
    iconLight: KRYSTAL,
    installLink: 'https://wallet.krystal.app',
    readyState: detectKrystalWC,
  } as EVMWalletInfo,
  RABBY: {
    connector: rabby,
    hooks: rabbyHooks,
    name: 'Rabby',
    icon: RABBY,
    iconLight: RABBY,
    installLink: 'https://rabby.io',
    readyState: detectRabby,
  } as EVMWalletInfo,
  TRUST_WALLET: {
    connector: trust,
    hooks: trustHooks,
    name: 'Trust Wallet',
    icon: TRUSTWALLET,
    iconLight: TRUSTWALLET,
    installLink: 'https://trustwallet.com/vi/deeplink',
    readyState: detectTrustWallet,
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
  SAFE: {
    connector: gnosisSafe,
    hooks: gnosisSafeHooks,
    name: 'Safe',
    icon: SAFE,
    iconLight: SAFE,
    installLink: 'https://safe.global/wallet',
    readyState: detectSafe,
  } as EVMWalletInfo,
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
  BLOCTO_INJECTED: {
    connector: bloctoInject,
    hooks: bloctoInjectHooks,
    name: 'Blocto',
    icon: BLOCTO,
    iconLight: BLOCTO,
    readyState: detectBloctoInjected,
  } as EVMWalletInfo,
  WALLET_CONNECT: {
    connector: walletConnectV2,
    hooks: walletConnectV2Hooks,
    name: 'WalletConnect',
    icon: WALLETCONNECT,
    iconLight: WALLETCONNECT,
    readyState: () => WalletReadyState.Installed,
  } as EVMWalletInfo,
  BLOCTO: {
    connector: blocto,
    hooks: bloctoHooks,
    name: 'Blocto',
    icon: BLOCTO,
    iconLight: BLOCTO,
    installLink: 'https://www.blocto.io/download',
    readyState: detectBlocto,
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
} as const
export type SUPPORTED_WALLET = keyof typeof SUPPORTED_WALLETS

export const connections = Object.values(SUPPORTED_WALLETS).filter(wallet => 'connector' in wallet) as EVMWalletInfo[]

export const LOCALSTORAGE_LAST_WALLETKEY_EVM = 'last-wallet-key-evm'
export const LOCALSTORAGE_LAST_WALLETKEY_SOLANA = 'last-wallet-key-solana'
export const INJECTED_KEYS = [
  'COIN98',
  'BRAVE',
  'METAMASK',
  'COINBASE',
  'TRUST_WALLET',
  'KRYSTAL',
  'RABBY',
  'INJECTED',
] as const
export type INJECTED_KEY = typeof INJECTED_KEYS[number]

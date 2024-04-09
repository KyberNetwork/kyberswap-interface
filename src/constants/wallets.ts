import SafeAppsSDK from '@safe-global/safe-apps-sdk'
import { Web3ReactHooks } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { isMobile } from 'react-device-detect'

import BLOCTO from 'assets/wallets-connect/bocto.svg'
import BRAVE from 'assets/wallets-connect/brave.svg'
import COIN98 from 'assets/wallets-connect/coin98.svg'
import COINBASE from 'assets/wallets-connect/coinbase.svg'
import KRYSTAL from 'assets/wallets-connect/krystal.svg'
import METAMASK from 'assets/wallets-connect/metamask.svg'
import RABBY from 'assets/wallets-connect/rabby.svg'
import SAFE from 'assets/wallets-connect/safe.svg'
import TRUSTWALLET from 'assets/wallets-connect/trust-wallet.svg'
import WALLETCONNECT from 'assets/wallets-connect/wallet-connect.svg'
import ZERION from 'assets/wallets-connect/zerion.svg'
import INJECTED_DARK_ICON from 'assets/wallets/browser-wallet-dark.svg'
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
  zerion,
  zerionHooks,
} from 'constants/connectors'
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
  getIsZerionWallet,
} from 'constants/connectors/utils'

export enum WalletReadyState {
  /**
   * User-installable wallets can typically be detected by scanning for an API
   * that they've injected into the global context. If such an API is present,
   * we consider the wallet to have been installed.
   */
  Installed = 'Installed',
  NotDetected = 'NotDetected',
  /**
   * Loadable wallets are always available to you. Since you can load them at
   * any time, it's meaningless to say that they have been detected.
   */
  Loadable = 'Loadable',
  /**
   * If a wallet is not supported on a given platform (eg. server-rendering, or
   * mobile) then it will stay in the `Unsupported` state.
   */
  Unsupported = 'Unsupported',
}

const detectGenericInjected = (): WalletReadyState => {
  // used in mobile dapp
  if (getIsGenericInjector()) return WalletReadyState.Installed
  return WalletReadyState.Unsupported
}

const detectMetamaskInjected = (): WalletReadyState => {
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

const detectRabbyInjected = (): WalletReadyState => {
  if (getIsRabbyWallet()) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectZerionInjected = (): WalletReadyState => {
  if (getIsZerionWallet()) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectKrystalInjected = (): WalletReadyState => {
  if (getIsKrystalWallet()) return WalletReadyState.Installed
  return WalletReadyState.Unsupported
}

const detectKrystalWC = (): WalletReadyState => {
  if (!getIsKrystalWallet()) return WalletReadyState.Installed
  return WalletReadyState.Unsupported
}

const detectBraveInjected = (): WalletReadyState => {
  //todo known issue: fail connect on mobile solana
  if (getIsBraveWallet()) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectCoin98Injected = (): WalletReadyState => {
  if (getIsC98Wallet()) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

const detectCoinbaseInjected = (): WalletReadyState => {
  const detectCoinbase = (): WalletReadyState => {
    if (getIsCoinbaseWallet()) return WalletReadyState.Installed
    // in NotDetected case, Coinbase show install link itself
    if (window.coinbaseWalletExtension && !isMobile) return WalletReadyState.Loadable
    return WalletReadyState.NotDetected
  }
  const result = detectCoinbase()
  return result
}

const detectTrustWalletInjected = (): WalletReadyState => {
  if (getIsTrustWallet()) return WalletReadyState.Installed
  return WalletReadyState.NotDetected
}

export interface WalletInfo {
  name: string
  icon: string
  installLink?: string
  href?: string
  connector: Connector
  hooks: Web3ReactHooks
  readyState: () => WalletReadyState
}

export const SUPPORTED_WALLETS = {
  INJECTED: {
    connector: injected,
    hooks: injectedHooks,
    name: 'Browser Wallet',
    icon: INJECTED_DARK_ICON,
    readyState: detectGenericInjected,
  } as WalletInfo,
  KRYSTAL: {
    connector: krystal,
    hooks: krystalHooks,
    name: 'Krystal',
    icon: KRYSTAL,
    installLink: 'https://wallet.krystal.app',
    readyState: detectKrystalInjected,
  } as WalletInfo,
  RABBY: {
    connector: rabby,
    hooks: rabbyHooks,
    name: 'Rabby',
    icon: RABBY,
    installLink: 'https://rabby.io',
    readyState: detectRabbyInjected,
  } as WalletInfo,
  ZERION: {
    connector: zerion,
    hooks: zerionHooks,
    name: 'Zerion',
    icon: ZERION,
    installLink: 'https://zerion.io',
    readyState: detectZerionInjected,
  } as WalletInfo,
  TRUST_WALLET: {
    connector: trust,
    hooks: trustHooks,
    name: 'Trust Wallet',
    icon: TRUSTWALLET,
    installLink: 'https://trustwallet.com/vi/deeplink',
    readyState: detectTrustWalletInjected,
  } as WalletInfo,
  BRAVE: {
    connector: brave,
    hooks: braveHooks,
    name: 'Brave Wallet',
    icon: BRAVE,
    installLink: 'https://brave.com/download',
    readyState: detectBraveInjected,
  } as WalletInfo,
  SAFE: {
    connector: gnosisSafe,
    hooks: gnosisSafeHooks,
    name: 'Safe',
    icon: SAFE,
    installLink: 'https://safe.global/wallet',
    readyState: detectSafe,
  } as WalletInfo,
  COINBASE: {
    connector: coinbaseWallet,
    hooks: coinbaseWalletHooks,
    name: 'Coinbase',
    icon: COINBASE,
    installLink: 'https://www.coinbase.com/wallet',
    readyState: detectCoinbaseInjected,
  } as WalletInfo,
  COIN98: {
    connector: coin98,
    hooks: coin98Hooks,
    name: 'Coin98',
    icon: COIN98,
    installLink: 'https://wallet.coin98.com/',
    readyState: detectCoin98Injected,
  } as WalletInfo,
  BLOCTO_INJECTED: {
    connector: bloctoInject,
    hooks: bloctoInjectHooks,
    name: 'Blocto',
    icon: BLOCTO,
    readyState: detectBloctoInjected,
  } as WalletInfo,
  KRYSTAL_WC: {
    connector: krystalWalletConnectV2,
    hooks: krystalWalletConnectV2Hooks,
    name: 'Krystal',
    icon: KRYSTAL,
    readyState: detectKrystalWC,
  } as WalletInfo,
  WALLET_CONNECT: {
    connector: walletConnectV2,
    hooks: walletConnectV2Hooks,
    name: 'WalletConnect',
    icon: WALLETCONNECT,
    readyState: () => WalletReadyState.Installed,
  } as WalletInfo,
  BLOCTO: {
    connector: blocto,
    hooks: bloctoHooks,
    name: 'Blocto',
    icon: BLOCTO,
    installLink: 'https://www.blocto.io/download',
    readyState: detectBlocto,
  } as WalletInfo,
  METAMASK: {
    connector: metaMask,
    hooks: metamaskHooks,
    name: 'MetaMask',
    icon: METAMASK,
    installLink: 'https://metamask.io/download',
    readyState: detectMetamaskInjected,
  } as WalletInfo,
} as const
export type SUPPORTED_WALLET = keyof typeof SUPPORTED_WALLETS

export const connections = Object.values(SUPPORTED_WALLETS).filter(wallet => 'connector' in wallet) as WalletInfo[]

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

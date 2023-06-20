import { Connector } from '@web3-react/types'

import { coinbaseWallet, walletConnectV2 } from 'constants/connectors/evm'
import checkForBraveBrowser from 'utils/checkForBraveBrowser'

export const getIsInjected = () => Boolean(window.ethereum)

const allNonMetamaskFlags = [
  'isRabby',
  'isBraveWallet',
  'isTrust',
  'isTrustWallet',
  'isLedgerConnect',
  'isCoin98',
  'isKrystalWallet',
] as const

export const getIsMetaMaskWallet = () =>
  Boolean(window.ethereum?.isMetaMask && !allNonMetamaskFlags.some(flag => window.ethereum?.[flag]))

export const getIsCoinbaseWallet = () =>
  Boolean(
    (window.ethereum?.isCoinbaseWallet || window.ethereum?.providers?.some(p => p?.isCoinbaseWallet)) &&
      !window.ethereum.isKrystalWallet,
  )

export const getIsBraveWallet = () => Boolean(checkForBraveBrowser() && window.ethereum?.isBraveWallet)

export const getIsC98Wallet = () => Boolean(window.ethereum?.isCoin98 && window.coin98)

export const getIsTrustWallet = () => Boolean(window.ethereum?.isTrustWallet || window.ethereum?.isTrust)

export const getIsGenericInjector = () =>
  getIsInjected() &&
  !getIsMetaMaskWallet() &&
  !getIsCoinbaseWallet() &&
  !getIsBraveWallet() &&
  !getIsC98Wallet() &&
  !getIsTrustWallet()

// https://eips.ethereum.org/EIPS/eip-1193#provider-errors
export enum ErrorCode {
  USER_REJECTED_REQUEST = 4001,
  UNAUTHORIZED = 4100,
  UNSUPPORTED_METHOD = 4200,
  DISCONNECTED = 4900,
  CHAIN_DISCONNECTED = 4901,

  // https://docs.metamask.io/guide/rpc-api.html#unrestricted-methods
  CHAIN_NOT_ADDED = 4902,
  MM_ALREADY_PENDING = -32002,

  WC_MODAL_CLOSED = 'Error: User closed modal',
  CB_REJECTED_REQUEST = 'Error: User denied account authorization',
  ALPHA_WALLET_USER_REJECTED_REQUEST = -32050,
  ALPHA_WALLET_REJECTED = 'Request rejected',
  CANCELED = 'The transaction was cancelled',
}

export function didUserReject(connector: Connector, error: any): boolean {
  return (
    error?.code === ErrorCode.USER_REJECTED_REQUEST ||
    error?.code === ErrorCode.ALPHA_WALLET_USER_REJECTED_REQUEST ||
    error?.message === ErrorCode.ALPHA_WALLET_REJECTED ||
    (connector === walletConnectV2 && error?.toString?.() === ErrorCode.WC_MODAL_CLOSED) ||
    (connector === walletConnectV2 && error?.message === ErrorCode.CANCELED) ||
    (connector === coinbaseWallet && error?.toString?.() === ErrorCode.CB_REJECTED_REQUEST)
  )
}

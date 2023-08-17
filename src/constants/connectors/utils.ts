import { captureEvent, captureMessage } from '@sentry/react'

import checkForBraveBrowser from 'utils/checkForBraveBrowser'

export const getIsInjected = () => Boolean(window.ethereum)

const allNonMetamaskFlags = [
  'isRabby',
  'isBraveWallet',
  'isTrust',
  'isTrustWallet',
  'isLedgerConnect',
  'isCoin98',
  'isKrystal',
  'isKrystalWallet',
] as const
export const getIsMetaMaskWallet = () =>
  Boolean(window.ethereum?.isMetaMask && !allNonMetamaskFlags.some(flag => window.ethereum?.[flag]))

export const getIsRabbyWallet = () => Boolean(window.ethereum?.isRabby)

export const getIsBloctoWallet = () => {
  captureMessage('blocto eth:', { level: 'info', extra: { 'window.ethereum': window.ethereum } })
  return Boolean(window.ethereum?.isRabby)
}

export const getIsKrystalWallet = () =>
  Boolean(window.ethereum?.isKrystalWallet || (window.ethereum?.isKrystal && !getIsTrustWallet()))

export const getIsCoinbaseWallet = () =>
  Boolean(
    (window.ethereum?.isCoinbaseWallet || window.ethereum?.providers?.some(p => p?.isCoinbaseWallet)) &&
      !window.ethereum?.isKrystalWallet,
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
  !getIsRabbyWallet() &&
  !getIsKrystalWallet() &&
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

  ACTION_REJECTED = 'ACTION_REJECTED',
  WALLETCONNECT_MODAL_CLOSED = 'Error: User closed modal',
  WALLETCONNECT_CANCELED = 'The transaction was cancelled',
  COINBASE_REJECTED_REQUEST = 'Error: User denied account authorization',
  ALPHA_WALLET_REJECTED_CODE = -32050,
  ALPHA_WALLET_REJECTED = 'Request rejected',
}

const rejectedPhrases: string[] = ['user rejected transaction', 'user denied transaction', 'you must accept']

export function didUserReject(error: any): boolean {
  return (
    error?.code === ErrorCode.USER_REJECTED_REQUEST ||
    error?.code === ErrorCode.ACTION_REJECTED ||
    error?.code === ErrorCode.ALPHA_WALLET_REJECTED_CODE ||
    error?.message === ErrorCode.ALPHA_WALLET_REJECTED ||
    error?.message === ErrorCode.WALLETCONNECT_MODAL_CLOSED ||
    error?.message === ErrorCode.WALLETCONNECT_CANCELED ||
    error?.message === ErrorCode.WALLETCONNECT_MODAL_CLOSED ||
    rejectedPhrases.some(phrase => error?.message?.toLowerCase?.()?.includes?.(phrase.toLowerCase()))
  )
}

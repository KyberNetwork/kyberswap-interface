import { Connector } from '@web3-react/types'

import { coinbaseWallet, walletConnectV2 } from 'constants/connectors/evm'

export const getIsInjected = () => Boolean(window.ethereum)

type NonMetaMaskFlag = 'isRabby' | 'isBraveWallet' | 'isTrustWallet' | 'isLedgerConnect' | 'isCoin98'
const allNonMetamaskFlags: NonMetaMaskFlag[] = [
  'isRabby',
  'isBraveWallet',
  'isTrustWallet',
  'isLedgerConnect',
  'isCoin98',
]
export const getIsMetaMaskWallet = () =>
  Boolean(window.ethereum?.isMetaMask && !allNonMetamaskFlags.some(flag => window.ethereum?.[flag]))

export const getIsCoinbaseWallet = () =>
  Boolean(window.ethereum?.isCoinbaseWallet || window.ethereum?.providers?.some(p => p?.isCoinbaseWallet))

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
}

export function didUserReject(connector: Connector, error: any): boolean {
  return (
    error?.code === ErrorCode.USER_REJECTED_REQUEST ||
    (connector === walletConnectV2 && error?.toString?.() === ErrorCode.WC_MODAL_CLOSED) ||
    (connector === coinbaseWallet && error?.toString?.() === ErrorCode.CB_REJECTED_REQUEST)
  )
}

import { findCacheToken } from 'hooks/Tokens'
import { TransactionHistory } from 'pages/NotificationCenter/Portfolio/type'

export const NUMBERS = {
  STALL_WARNING_HEIGHT: 36,
  TRANSACTION_LINE_HEIGHT: 18,
  STALLED_MINS: 5,
}

// todo remove ?
export const isTxsPendingTooLong = (_: TransactionHistory) => {
  return false
}

export const getTokenLogo = (address: string | undefined) => findCacheToken(address ?? '')?.logoURI ?? ''

import { findCacheToken } from 'hooks/Tokens'

export const NUMBERS = {
  STALL_WARNING_HEIGHT: 36,
  TRANSACTION_LINE_HEIGHT: 18,
}

export const getTokenLogo = (address: string | undefined) => findCacheToken(address ?? '')?.logoURI ?? ''

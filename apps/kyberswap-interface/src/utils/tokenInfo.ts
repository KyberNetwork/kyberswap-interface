import { ChainId, Currency, NativeCurrency, Token } from '@kyberswap/ks-sdk-core'

import { ETHER_ADDRESS } from 'constants/index'
import { TokenInfo, WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

export const getFormattedAddress = (chainId: ChainId, address?: string, fallback?: string): string => {
  try {
    if (!address) return fallback || ''
    return new Token(chainId, address, 0).address || ''
  } catch (e) {
    return fallback || address || ''
  }
}

export const isTokenNative = (currency: Currency | WrappedTokenInfo | undefined): currency is NativeCurrency => {
  return currency?.isNative || currency?.address === ETHER_ADDRESS
}

export const getTokenAddress = (currency: Currency) =>
  currency.isNative ? ETHER_ADDRESS : currency?.wrapped.address ?? ''

export const getProxyTokenLogo = (logoUrl: string | undefined): string =>
  logoUrl ? (logoUrl.startsWith('data:') ? logoUrl : `https://proxy.kyberswap.com/token-logo?url=${logoUrl}`) : ''

// ex: `"BTT_b"` => BTT_b
export const escapeQuoteString = (str: string) =>
  str?.startsWith('"') && str?.endsWith('"') ? str.substring(1, str.length - 1) : str

export const formatTokenInfo = (rawTokenResponse: TokenInfo) => {
  try {
    const tokenResponse = { ...rawTokenResponse }
    tokenResponse.symbol = escapeQuoteString(tokenResponse.symbol)
    tokenResponse.name = escapeQuoteString(tokenResponse.name)

    const tokenInfo = new WrappedTokenInfo(tokenResponse)
    if (!tokenInfo.decimals && !tokenInfo.symbol && !tokenInfo.name) {
      return
    }
    return tokenInfo
  } catch (e) {
    return
  }
}

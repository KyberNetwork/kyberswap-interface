import { ChainId, Currency, NativeCurrency, Token, WETH } from '@kyberswap/ks-sdk-core'

import { ETHER_ADDRESS } from 'constants/index'
import { MAP_TOKEN_HAS_MULTI_BY_NETWORK } from 'constants/tokenLists/token-info'
import { TokenInfo, WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

/**
 * hard code: ex: usdt => usdt_e, ... if network has multi symbol same name base on network
 * @param network ex: poylgon, ...
 * @param value symbol name, ex: usdt, ...
 * @returns
 */
export const convertSymbol = (network: string, value: string) => {
  const mapData = MAP_TOKEN_HAS_MULTI_BY_NETWORK[network]
  if (mapData) {
    const newValue = mapData[value]
    if (newValue) return newValue
  }
  return value
}

export const getFormattedAddress = (chainId: ChainId, address?: string, fallback?: string): string => {
  try {
    if (!address) return fallback || ''
    return new Token(chainId, address, 0).address || ''
  } catch (e) {
    return fallback || address || ''
  }
}

export const isTokenNative = (
  currency: Currency | WrappedTokenInfo | undefined,
  chainId: ChainId | undefined,
): currency is NativeCurrency => {
  if (currency?.isNative || currency?.address === ETHER_ADDRESS) return true
  // case multichain token
  return chainId
    ? WETH[chainId]?.address === currency?.address &&
        currency instanceof WrappedTokenInfo &&
        currency.multichainInfo?.tokenType === 'NATIVE'
    : false
}

export const getTokenAddress = (currency: Currency) =>
  currency.isNative ? ETHER_ADDRESS : currency?.wrapped.address ?? ''

const MAP_TOKEN_SYMBOL: Partial<{ [key in ChainId]: { [address: string]: string } }> = {
  [ChainId.ARBITRUM]: {
    '0x316772cFEc9A3E976FDE42C3Ba21F5A13aAaFf12': 'mKNC',
    '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8': 'USDC.e',
    '0x9cfb13e6c11054ac9fcb92ba89644f30775436e4': 'axl.wstETH',
  },
  [ChainId.OPTIMISM]: { '0x4518231a8fdf6ac553b9bbd51bbb86825b583263': 'mKNC' },
  [ChainId.AVAXMAINNET]: { '0x39fC9e94Caeacb435842FADeDeCB783589F50f5f': 'mKNC' },
}
export const getTokenSymbolWithHardcode = (
  chainId: ChainId | undefined,
  address: string | undefined,
  defaultSymbol: string | undefined,
) => {
  const chainInfo = chainId ? MAP_TOKEN_SYMBOL[chainId] || {} : {}
  const symbolHardCode = chainInfo[address?.toLowerCase() ?? ''] || chainInfo[address ?? '']
  return symbolHardCode || defaultSymbol || ''
}

export const getProxyTokenLogo = (logoUrl: string | undefined) =>
  logoUrl ? `https://proxy.kyberswap.com/token-logo?url=${logoUrl}` : ''

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

import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'

import { NativeCurrencies } from 'constants/tokens'

export function currencyId(currency?: Currency, chainId?: ChainId): string {
  if (currency?.isNative && !!chainId) return NativeCurrencies[chainId].symbol as string
  if (currency instanceof Token) return currency.address
  return ''
}

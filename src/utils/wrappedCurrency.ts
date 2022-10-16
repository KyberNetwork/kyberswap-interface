import { Currency, WETH } from '@namgold/ks-sdk-core'

import { NativeCurrencies } from 'constants/tokens'

export function unwrappedToken(token: Currency): Currency {
  if (token.equals(WETH[token.chainId])) return NativeCurrencies[token.chainId]

  return token
}

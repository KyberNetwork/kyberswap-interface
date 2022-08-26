import { ChainId, Currency, WETH } from '@namgold/ks-sdk-core'

import { NativeCurrencies } from 'constants/tokens'

export function unwrappedToken(token: Currency): Currency {
  if (token.equals(WETH[token.chainId as ChainId])) return NativeCurrencies[token.chainId]

  return token
}

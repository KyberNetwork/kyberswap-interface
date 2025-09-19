import { Currency, Token, WETH } from '@kyberswap/ks-sdk-core'

import { ZERO_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'

export function unwrappedToken(token: Currency): Currency {
  if (token.equals(WETH[token.chainId])) return NativeCurrencies[token.chainId]
  if (token instanceof Token && token.address === ZERO_ADDRESS) return NativeCurrencies[token.chainId]

  return token
}

import { Currency } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { NativeCurrencies } from 'constants/tokens'
import { isTokenNative } from 'utils/tokenInfo'

export function useCurrencyConvertedToNative(currency?: Currency): Currency | undefined {
  return useMemo(() => {
    if (!!currency) {
      return isTokenNative(currency) ? NativeCurrencies[currency.chainId] : currency
    }
    return undefined
  }, [currency])
}

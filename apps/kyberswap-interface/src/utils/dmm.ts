import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { NativeCurrencies } from 'constants/tokens'
import { ClassicPoolData } from 'hooks/pool/classic/type'
import { tryParseAmount } from 'state/swap/hooks'
import { isTokenNative } from 'utils/tokenInfo'
import { unwrappedToken } from 'utils/wrappedCurrency'

export function parseSubgraphPoolData(
  poolData: ClassicPoolData,
  chainId: ChainId,
): {
  reserve0: CurrencyAmount<Currency> | undefined
  virtualReserve0: CurrencyAmount<Currency> | undefined
  reserve1: CurrencyAmount<Currency> | undefined
  virtualReserve1: CurrencyAmount<Currency> | undefined
  totalSupply: CurrencyAmount<Currency> | undefined
  currency0: Currency
  currency1: Currency
} {
  const currency0 = unwrappedToken(poolData.token0)
  const currency1 = unwrappedToken(poolData.token1)

  const reserve0 = tryParseAmount(poolData.reserve0, currency0)
  const virtualReserve0 = tryParseAmount(poolData.vReserve0, currency0)
  const reserve1 = tryParseAmount(poolData.reserve1, currency1)
  const virtualReserve1 = tryParseAmount(poolData.vReserve1, currency1)
  const totalSupply = tryParseAmount(poolData.totalSupply, NativeCurrencies[chainId]) // Only care about decimals 18

  return {
    reserve0,
    virtualReserve0,
    reserve1,
    virtualReserve1,
    totalSupply,
    currency0,
    currency1,
  }
}

export function useCurrencyConvertedToNative(currency?: Currency): Currency | undefined {
  return useMemo(() => {
    if (!!currency) {
      return isTokenNative(currency) ? NativeCurrencies[currency.chainId] : currency
    }
    return undefined
  }, [currency])
}

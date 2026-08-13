import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { TokenRowExtraMap, tokenRowKey } from 'components/TokenSelectorModal/types'
import { useTokenPrices } from 'state/tokenPrices/hooks'

// Stable empty list so the prices endpoint isn't hit while inactive or fully covered.
const EMPTY_ADDRESSES: string[] = []

/**
 * Top up catalog rows the token-api lists without a `metrics.price` (common on Robinhood) from the live
 * prices endpoint, so the price column isn't blank where the catalog is short. Rows the catalog already
 * priced are left untouched, and only the missing addresses are ever requested.
 */
export const useCatalogPriceFallback = (
  currencies: Currency[],
  extras: TokenRowExtraMap,
  chainId: ChainId,
  active: boolean,
): TokenRowExtraMap => {
  const missingPriceAddresses = useMemo(
    () =>
      active
        ? currencies
            .filter(currency => !extras[tokenRowKey(currency.chainId, currency.wrapped.address)]?.price)
            .map(currency => currency.wrapped.address)
        : EMPTY_ADDRESSES,
    [active, currencies, extras],
  )
  const fallbackPrices = useTokenPrices(missingPriceAddresses, chainId)

  return useMemo(() => {
    if (!missingPriceAddresses.length) return extras
    const result: TokenRowExtraMap = { ...extras }
    currencies.forEach(currency => {
      const key = tokenRowKey(currency.chainId, currency.wrapped.address)
      if (result[key]?.price) return
      const fallback = fallbackPrices[currency.wrapped.address.toLowerCase()]
      if (fallback) result[key] = { ...result[key], price: fallback }
    })
    return result
  }, [extras, currencies, fallbackPrices, missingPriceAddresses])
}

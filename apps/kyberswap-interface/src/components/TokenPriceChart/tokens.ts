import { type Currency } from '@kyberswap/ks-sdk-core'

import { PRICE_CHART_QUOTES } from 'constants/tokens'

/** Chain-aware UI identity; native and wrapped assets remain distinct chart tabs. */
export const getCurrencyKey = (currency: Currency) => {
  if (currency.isNative) {
    return `${currency.chainId}-${currency.symbol}-native`
  }
  return `${currency.chainId}-${currency.wrapped.address.toLowerCase()}`
}

/** Shared eligibility rules for the chart and its parent empty state: supported chain, non-quote token, unique identity. */
export const getChartTokens = (tokens: Array<Currency | undefined> = [], quoteCurrency?: Currency) =>
  tokens.reduce<Currency[]>((result, token) => {
    if (!token) return result

    const quoteToken = quoteCurrency ?? PRICE_CHART_QUOTES[token.chainId]
    if (!quoteToken || quoteToken.chainId !== token.chainId) return result

    const key = getCurrencyKey(token)
    if (key === getCurrencyKey(quoteToken) || result.some(item => getCurrencyKey(item) === key)) return result

    return [...result, token]
  }, [])

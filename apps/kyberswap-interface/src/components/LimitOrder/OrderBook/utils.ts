import type { Token as SchemaToken } from '@kyber/schema'
import { Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

import { LimitOrderFromTokenPair, LimitOrderFromTokenPairFormatted } from 'components/LimitOrder/types'
import { getMarketPriceDiff } from 'components/LimitOrder/utils'
import { isSupportedChainId } from 'constants/networks'
import { formatDisplayNumber } from 'utils/numbers'

const MIN_AVAILABLE_USD = 0.0001

const safeDivide = (numerator: JSBI, denominator: JSBI) =>
  JSBI.equal(denominator, JSBI.BigInt(0)) ? JSBI.BigInt(0) : JSBI.divide(numerator, denominator)

export const invertRateValue = (value: string | number | undefined) => {
  const numberValue = Number(value)
  if (!numberValue || !Number.isFinite(numberValue)) return undefined
  return 1 / numberValue
}

export const getSchemaToken = (currency: Currency | undefined, isStable: boolean): SchemaToken | undefined => {
  if (!currency) return undefined

  return {
    address: currency.wrapped.address,
    symbol: currency.wrapped.symbol || '',
    name: currency.wrapped.name || '',
    decimals: currency.decimals,
    isStable,
  }
}

export const formatOrders = (
  orders: LimitOrderFromTokenPair[],
  makerCurrency: Currency | undefined,
  takerCurrency: Currency | undefined,
  marketRate: number,
  makerPriceUsd: number,
  reverse = false,
): LimitOrderFromTokenPairFormatted[] => {
  if (!makerCurrency || !takerCurrency) return []

  return orders
    .filter(
      order =>
        isSupportedChainId(order.chainId) &&
        order.chainId === makerCurrency.wrapped.chainId &&
        order.chainId === takerCurrency.wrapped.chainId,
    )
    .map(order => {
      const newMakerCurrency = new Token(
        order.chainId,
        order.makerAsset,
        order.makerAssetDecimals,
        makerCurrency.wrapped.symbol,
      )
      const newTakerCurrency = new Token(
        order.chainId,
        order.takerAsset,
        order.takerAssetDecimals,
        takerCurrency.wrapped.symbol,
      )

      const makerCurrencyAmount = CurrencyAmount.fromRawAmount(newMakerCurrency, order.makingAmount)
      const takerCurrencyAmount = CurrencyAmount.fromRawAmount(newTakerCurrency, order.takingAmount)
      const availableMakerCurrencyAmount = CurrencyAmount.fromRawAmount(newMakerCurrency, order.availableMakingAmount)

      // Cap the significant digits well below decimal.js-light's LN10 limit (~110): Fraction.toSignificant
      // mutates the shared global Decimal.precision, and recharts reuses the same singleton for axis ticks —
      // leaving precision high there makes every chart throw `LN10 precision limit exceeded`. 30 digits keep
      // full double precision for the rate, which is only parseFloat'd and re-formatted to 6 figures downstream.
      const rate = (
        !reverse
          ? takerCurrencyAmount.divide(makerCurrencyAmount).multiply(makerCurrencyAmount.decimalScale)
          : makerCurrencyAmount.divide(takerCurrencyAmount).multiply(takerCurrencyAmount.decimalScale)
      ).toSignificant(30)

      const filledMakingAmount = CurrencyAmount.fromRawAmount(newMakerCurrency, order.filledMakingAmount)
      const filledPercent = (parseFloat(filledMakingAmount.toExact()) / parseFloat(makerCurrencyAmount.toExact())) * 100
      const makerAmount = makerCurrencyAmount.toExact()
      const takerAmount = takerCurrencyAmount.toExact()
      const availableMakerAmount = availableMakerCurrencyAmount.toExact()
      const availableTakerAmount = CurrencyAmount.fromRawAmount(
        newTakerCurrency,
        safeDivide(
          JSBI.multiply(JSBI.BigInt(order.takingAmount), JSBI.BigInt(order.availableMakingAmount)),
          JSBI.BigInt(order.makingAmount),
        ),
      ).toExact()
      const availableAmountNumber = Number(availableMakerAmount)
      const availableUsd =
        makerPriceUsd && Number.isFinite(availableAmountNumber) ? availableAmountNumber * makerPriceUsd : undefined

      if (availableAmountNumber <= 0 || (availableUsd !== undefined && availableUsd < MIN_AVAILABLE_USD)) {
        return undefined
      }

      const hasAvailable = parseFloat(availableMakerAmount) > 0
      const marketDiff = getMarketPriceDiff(rate, marketRate)
      const invertedRate = invertRateValue(rate)
      const invertedMarketDiff = getMarketPriceDiff(invertedRate, invertRateValue(marketRate))

      return {
        id: order.id,
        chainId: order.chainId,
        rawOrder: order,
        isReversed: reverse,
        hasAvailable,
        formattedMakerAmount: formatDisplayNumber(makerAmount, { significantDigits: 6 }),
        formattedTakerAmount: formatDisplayNumber(takerAmount, { significantDigits: 6 }),
        formattedAvailableMakerAmount: hasAvailable
          ? formatDisplayNumber(availableMakerAmount, { significantDigits: 6 })
          : '',
        formattedAvailableTakerAmount: hasAvailable
          ? formatDisplayNumber(availableTakerAmount, { significantDigits: 6 })
          : '',
        rate,
        formattedRate: formatDisplayNumber(rate, { significantDigits: 6 }),
        invertedRate: invertedRate?.toString() || '',
        formattedInvertedRate: invertedRate ? formatDisplayNumber(invertedRate, { significantDigits: 6 }) : '--',
        formattedMarketDiffPercent: marketDiff.displayPercent,
        formattedInvertedMarketDiffPercent: invertedMarketDiff.displayPercent,
        marketDiffPercent: reverse ? -marketDiff.rawPercent : marketDiff.rawPercent,
        filledPercent: filledPercent > 99 ? '100' : filledPercent.toFixed(),
      }
    })
    .filter((order): order is LimitOrderFromTokenPairFormatted => Boolean(order))
    .filter(order => order.filledPercent !== '100')
    .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate))
}

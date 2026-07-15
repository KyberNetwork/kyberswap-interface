import { Currency, CurrencyAmount, Price } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

import { LimitOrderTakeContext } from 'components/LimitOrder/types'
import { removeTrailingZero } from 'components/LimitOrder/utils'
import { formatDisplayNumber } from 'utils/numbers'

const FEE_BPS_BASE = JSBI.BigInt(10_000)

const ceilDivide = (numerator: JSBI, denominator: JSBI) => {
  if (JSBI.equal(denominator, JSBI.BigInt(0))) return JSBI.BigInt(0)
  return JSBI.divide(JSBI.add(numerator, JSBI.subtract(denominator, JSBI.BigInt(1))), denominator)
}

const safeDivide = (numerator: JSBI, denominator: JSBI) => {
  if (JSBI.equal(denominator, JSBI.BigInt(0))) return JSBI.BigInt(0)
  return JSBI.divide(numerator, denominator)
}

export const getAvailablePayAmount = ({ order, payCurrency }: LimitOrderTakeContext) => {
  const totalPayRaw = JSBI.BigInt(order.takingAmount)
  const totalReceiveRaw = JSBI.BigInt(order.makingAmount)
  const availableReceiveRaw = JSBI.BigInt(order.availableMakingAmount)
  const availablePayRaw = safeDivide(JSBI.multiply(totalPayRaw, availableReceiveRaw), totalReceiveRaw)
  return CurrencyAmount.fromRawAmount(payCurrency, availablePayRaw)
}

export const getReceiveAmount = ({
  payAmount,
  context,
}: {
  payAmount: CurrencyAmount<Currency> | undefined
  context: LimitOrderTakeContext
}) => {
  if (!payAmount) return undefined
  const { order, receiveCurrency } = context
  const receiveRaw = safeDivide(
    JSBI.multiply(payAmount.quotient, JSBI.BigInt(order.makingAmount)),
    JSBI.BigInt(order.takingAmount),
  )
  return CurrencyAmount.fromRawAmount(receiveCurrency, receiveRaw)
}

export const getFeeBps = (feePercent?: string) => {
  const fee = Number(feePercent || 0)
  if (!Number.isFinite(fee) || fee <= 0) return 0
  return Math.min(Math.round(fee > 1 ? fee : fee * 100), 10_000)
}

export const subtractFee = (amount: CurrencyAmount<Currency> | undefined, feeBps: number) => {
  if (!amount || feeBps <= 0) return amount
  const raw = JSBI.divide(JSBI.multiply(amount.quotient, JSBI.BigInt(10_000 - feeBps)), FEE_BPS_BASE)
  return CurrencyAmount.fromRawAmount(amount.currency, raw)
}

export const addFee = (amount: CurrencyAmount<Currency> | undefined, feeBps: number) => {
  if (!amount || feeBps <= 0) return amount
  const raw = ceilDivide(JSBI.multiply(amount.quotient, JSBI.BigInt(10_000 + feeBps)), FEE_BPS_BASE)
  return CurrencyAmount.fromRawAmount(amount.currency, raw)
}

export const getMaxAmountBeforeTakerFee = (amount: CurrencyAmount<Currency> | undefined, feeBps: number) => {
  if (!amount || feeBps <= 0) return amount
  const raw = safeDivide(JSBI.multiply(amount.quotient, FEE_BPS_BASE), JSBI.BigInt(10_000 + feeBps))
  return CurrencyAmount.fromRawAmount(amount.currency, raw)
}

export const hasPositiveAmount = (amount: CurrencyAmount<Currency> | undefined) =>
  !!amount && JSBI.greaterThan(amount.quotient, JSBI.BigInt(0))

export const isExceedsAvailableAmount = (
  amount: CurrencyAmount<Currency> | undefined,
  maxAmount: CurrencyAmount<Currency> | undefined,
) => !!amount && !!maxAmount && amount.greaterThan(maxAmount)

export const formatExact = (amount: CurrencyAmount<Currency> | undefined, significantDigits = 6) =>
  amount ? formatDisplayNumber(amount.toExact(), { significantDigits }) : '--'

export const formatRate = (context: LimitOrderTakeContext) => {
  const receiveAmount = CurrencyAmount.fromRawAmount(context.receiveCurrency, context.order.makingAmount)
  const payAmount = CurrencyAmount.fromRawAmount(context.payCurrency, context.order.takingAmount)
  const rate = receiveAmount.divide(payAmount).multiply(payAmount.decimalScale).toSignificant(8)
  return `1 ${context.payCurrency.symbol} = ${removeTrailingZero(rate)} ${context.receiveCurrency.symbol}`
}

export const formatInvertedRate = (context: LimitOrderTakeContext) => {
  const receiveAmount = CurrencyAmount.fromRawAmount(context.receiveCurrency, context.order.makingAmount)
  const payAmount = CurrencyAmount.fromRawAmount(context.payCurrency, context.order.takingAmount)
  const rate = payAmount.divide(receiveAmount).multiply(receiveAmount.decimalScale).toSignificant(8)
  return `1 ${context.receiveCurrency.symbol} = ${removeTrailingZero(rate)} ${context.payCurrency.symbol}`
}

export const getPercentFillAmount = (amount: CurrencyAmount<Currency> | undefined, percent: number) => {
  if (!amount) return ''

  const rawAmount = JSBI.divide(JSBI.multiply(amount.quotient, JSBI.BigInt(percent)), JSBI.BigInt(100))
  return CurrencyAmount.fromRawAmount(amount.currency, rawAmount).toExact()
}

export const normalizeActionAmount = (nextAmount: string) => (parseFloat(nextAmount || '0') > 0 ? nextAmount : '')

export const getSwapCurrencyId = (currency: Currency | undefined) =>
  currency ? (currency.isNative ? currency.symbol?.toLowerCase() || '' : currency.wrapped.address.toLowerCase()) : ''

export const getOrderPriceAfterFee = (context: LimitOrderTakeContext, feeBps: number) => {
  const payRaw = JSBI.BigInt(context.order.takingAmount)
  const receiveRaw = JSBI.BigInt(context.order.makingAmount)
  const adjustedPayRaw =
    context.order.isTakerAssetFee && feeBps > 0
      ? ceilDivide(JSBI.multiply(payRaw, JSBI.BigInt(10_000 + feeBps)), FEE_BPS_BASE)
      : payRaw
  const adjustedReceiveRaw =
    !context.order.isTakerAssetFee && feeBps > 0
      ? JSBI.divide(JSBI.multiply(receiveRaw, JSBI.BigInt(10_000 - feeBps)), FEE_BPS_BASE)
      : receiveRaw

  if (JSBI.equal(adjustedPayRaw, JSBI.BigInt(0)) || JSBI.equal(adjustedReceiveRaw, JSBI.BigInt(0))) return undefined

  return new Price(context.payCurrency, context.receiveCurrency, adjustedPayRaw, adjustedReceiveRaw)
}

import { Currency, Fraction } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import JSBI from 'jsbi'
import { CreateOrderBody } from 'services/limitOrder'

import { CreateOrderParam, LimitOrder, LimitOrderStatus } from 'components/swapv2/LimitOrder/types'
import { RESERVE_USD_DECIMALS } from 'constants/index'
import { tryParseAmount } from 'state/swap/hooks'
import { friendlyError } from 'utils/errorMessage'
import { formatDisplayNumber, uint256ToFraction } from 'utils/numbers'
import { parseUnits } from 'utils/viem'

export const isActiveStatus = (status: LimitOrderStatus) =>
  [LimitOrderStatus.ACTIVE, LimitOrderStatus.OPEN, LimitOrderStatus.PARTIALLY_FILLED].includes(status)

export const DOCS_LINKS = {
  GASLESS_CANCEL:
    'https://docs.kyberswap.com/kyberswap-solutions/limit-order/concepts/gasless-cancellation#gasless-cancel',
  HARD_CANCEL: 'https://docs.kyberswap.com/kyberswap-solutions/limit-order/concepts/gasless-cancellation#hard-cancel',
  CANCEL_GUIDE: 'https://docs.kyberswap.com/kyberswap-solutions/limit-order/user-guides/cancel-limit-orders',
  USER_GUIDE: 'https://docs.kyberswap.com/kyberswap-solutions/limit-order',
}

// js number to fraction
export const parseFraction = (value: string, decimals = RESERVE_USD_DECIMALS) => {
  try {
    return new Fraction(
      parseUnits(value, decimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals)),
    )
  } catch (error) {
    return new Fraction(0)
  }
}

// 1.00010000 => 1.0001
export const removeTrailingZero = (num: string) => {
  if (num === undefined || num === null) return ''
  num = String(num)
  /**
   * 15.23000: $1 is 15, $2 is ., $3 is 23000 => '$1$2$3' => 15.23
   */
  return num.replace(/^([\d,]+)$|^([\d,]+)\.0*$|^([\d,]+\.[0-9]*?)0*$/, '$1$2$3')
}

export const calcOutput = (input: string, rate: string | Fraction, decimalsOut: number) => {
  try {
    const value = parseFraction(input).multiply(typeof rate === 'string' ? parseFraction(rate) : rate)
    return removeTrailingZero(value.toFixed(decimalsOut))
  } catch (error) {
    return ''
  }
}

export const calcRate = (input: string, output: string, decimalsOut: number) => {
  try {
    if (input && input === output) return '1'
    const rate = parseFraction(output, decimalsOut).divide(parseFraction(input))
    return removeTrailingZero(rate.toFixed(16))
  } catch (error) {
    return ''
  }
}

// calc 1/value
export const calcInvert = (value: string) => {
  try {
    if (parseFloat(value) === 1) return '1'
    return removeTrailingZero(new Fraction(1).divide(parseFraction(value)).toFixed(16))
  } catch (error) {
    return ''
  }
}

export const calcUsdPrices = ({
  inputAmount,
  outputAmount,
  priceUsdIn,
  priceUsdOut,
  currencyIn,
  currencyOut,
}: {
  inputAmount: string
  outputAmount: string
  priceUsdIn: number | undefined
  priceUsdOut: number | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
}) => {
  const empty = { input: '', output: '', rawInput: 0 }
  if (!inputAmount || !priceUsdIn || !priceUsdOut || !outputAmount || !currencyIn || !currencyOut) return empty
  try {
    const input = +parseFraction(inputAmount, currencyIn.decimals).toSignificant(18) * priceUsdIn
    const output = +parseFraction(outputAmount, currencyOut.decimals).toSignificant(18) * priceUsdOut
    return {
      input: input ? formatDisplayNumber(input.toFixed(16), { style: 'currency', significantDigits: 4 }) : undefined,
      output: output ? formatDisplayNumber(output.toFixed(16), { style: 'currency', significantDigits: 4 }) : undefined,
      rawInput: parseFloat(input.toFixed(2)),
    }
  } catch (error) {
    return empty
  }
}

export const formatAmountOrder = (value: string, decimals?: number) => {
  const isUint256 = decimals !== undefined
  return formatDisplayNumber(parseFloat(isUint256 ? uint256ToFraction(value, decimals).toFixed(16) : value), {
    fractionDigits: 10,
  })
}

export const formatRateLimitOrder = (order: LimitOrder, invert: boolean) => {
  let rateValue = new Fraction(0)
  const { takingAmount, makingAmount, makerAssetDecimals, takerAssetDecimals } = order
  try {
    rateValue = invert
      ? uint256ToFraction(takingAmount, takerAssetDecimals).divide(uint256ToFraction(makingAmount, makerAssetDecimals))
      : uint256ToFraction(makingAmount, makerAssetDecimals).divide(uint256ToFraction(takingAmount, takerAssetDecimals))
  } catch (error) {
    console.log(error)
  }
  const float = parseFloat(rateValue.toFixed(16))
  return formatDisplayNumber(float, { fractionDigits: float < 1e-8 ? 16 : 8 })
}

export const calcPercentFilledOrder = (value: string, total: string, decimals: number) => {
  try {
    const float = parseFloat(
      uint256ToFraction(value, decimals).divide(uint256ToFraction(total, decimals)).multiply(100).toFixed(16),
    )
    if (float && float > 99.99) return '99.99'
    return float && float < 0.01 ? '< 0.01' : formatDisplayNumber(float, { fractionDigits: 2 })
  } catch (error) {
    return '0'
  }
}

type LimitOrderError = {
  code?: string | number
  response?: {
    data?: {
      code?: string | number
    }
  }
}

const isLimitOrderError = (error: unknown): error is LimitOrderError => typeof error === 'object' && error !== null

type CreateOrderSignatureBodyPayload = Omit<CreateOrderBody, 'salt' | 'signature' | 'clientId'>

type LimitOrderTrackingPayload = {
  from_token: string
  to_token: string
  from_network: string
  trade_qty: string
  order_id: number
} & Record<string, unknown>

export const getErrorMessage = (error: unknown) => {
  console.error('Limit order error: ', error)
  const errorCode = isLimitOrderError(error) ? error.response?.data?.code || error.code || '' : ''
  const mapErrorMessageByErrCode: Record<string, string> = {
    4001: t`User denied message signature`,
    4002: t`You don't have sufficient fund for this transaction.`,
    4004: t`Invalid signature`,
  }
  const msg = mapErrorMessageByErrCode[String(errorCode)]
  return msg?.toString?.() || friendlyError(error instanceof Error || typeof error === 'string' ? error : '')
}

export const getPayloadCreateOrder = (params: CreateOrderParam): CreateOrderSignatureBodyPayload => {
  const { currencyIn, currencyOut, chainId, account, inputAmount, outputAmount, expiredAt, referral } = params
  const parseInputAmount = tryParseAmount(inputAmount, currencyIn ?? undefined)
  return {
    chainId: chainId.toString(),
    makerAsset: currencyIn?.wrapped.address,
    takerAsset: currencyOut?.wrapped.address,
    maker: account,
    makingAmount: parseInputAmount?.quotient?.toString(),
    takingAmount: tryParseAmount(outputAmount, currencyOut)?.quotient?.toString(),
    expiredAt: Math.floor(expiredAt / 1000),
    nativeOutput: currencyOut?.isNative || false,
    ...(referral ? { referral } : {}),
  }
}

export const getPayloadTracking = (
  order: LimitOrder,
  networkName: string,
  payload: Record<string, unknown> = {},
): LimitOrderTrackingPayload => {
  const { makerAssetSymbol, takerAssetSymbol, makingAmount, makerAssetDecimals, id } = order
  return {
    ...payload,
    from_token: makerAssetSymbol,
    to_token: takerAssetSymbol,
    from_network: networkName,
    trade_qty: formatAmountOrder(makingAmount, makerAssetDecimals),
    order_id: id,
  }
}

export const groupToMap = <K, T>(items: Iterable<T>, keySelector: (item: T, index?: number) => K): Map<K, T[]> => {
  return [...items].reduce((accumulator: Map<K, T[]>, currentValue: T) => {
    const newValue = accumulator.get(keySelector(currentValue)) || []
    newValue.push(currentValue)
    accumulator.set(keySelector(currentValue), newValue)

    return accumulator
  }, new Map())
}

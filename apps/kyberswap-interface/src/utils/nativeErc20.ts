import { ChainId, Currency, CurrencyAmount, WETH } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

import { ETHER_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'

/**
 * Some chains make a stablecoin the native asset and give it a built-in ERC-20 interface backed by
 * the same balance, so no wrapped-native contract exists (Arc, where USDC is native). The two
 * interfaces report different decimals — 18 native, 6 ERC-20 — which is why the conversion lives
 * here instead of being inlined: mixing the two silently rescales an amount by 10^12.
 *
 * The app's currency for such an asset is always the ERC-20 token, so `.wrapped` stays an identity
 * and nothing downstream has to know about the native interface. The native form appears only as a
 * request parameter and a transaction value, built by the helpers below.
 */
const erc20InterfaceOf = (chainId: ChainId) => NETWORKS_INFO[chainId]?.nativeToken?.erc20Interface

/**
 * True when `currency` is the ERC-20 interface of its chain's native asset. The interface is
 * identified as the chain's `WETH` entry rather than by a second copy of the address, so the two
 * cannot drift apart.
 */
export const isNativeErc20 = (currency: Currency | undefined): boolean =>
  !!currency && !currency.isNative && !!erc20InterfaceOf(currency.chainId) && currency.equals(WETH[currency.chainId])

/** True when swaps of `currency` should be paid through the native interface, skipping approval. */
export const paysNativeOnSwap = (currency: Currency | undefined): boolean =>
  !!currency && isNativeErc20(currency) && !!erc20InterfaceOf(currency.chainId)?.payNativeOnSwap

/**
 * Which side of a quote an amount belongs to. Paying through the native interface is a property of
 * the payment, not of how the quote is denominated, so it applies to the input side only: the output
 * is always quoted in the token the user receives.
 */
export type RouteSide = 'in' | 'out'

const paysNativeForSide = (currency: Currency, side: RouteSide): boolean => side === 'in' && paysNativeOnSwap(currency)

const scaleFactor = (chainId: ChainId): JSBI => {
  // The identity outside these chains: there is only one interface, so nothing to rescale.
  if (!erc20InterfaceOf(chainId)) return JSBI.BigInt(1)
  const decimals = NETWORKS_INFO[chainId].nativeToken.decimal - WETH[chainId].decimals
  return JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))
}

/**
 * Raw ERC-20 amount to its native-interface equivalent. Always exact, since the native interface is
 * the finer of the two.
 */
export const toNativeUnits = (amount: CurrencyAmount<Currency>): string =>
  JSBI.multiply(amount.quotient, scaleFactor(amount.currency.chainId)).toString()

/**
 * Raw native amount back to the ERC-20 interface. Throws on a remainder rather than truncating: every
 * amount the app sends started life as an ERC-20 value, so a remainder means the two interfaces were
 * crossed somewhere upstream, and silently rounding would hide it.
 */
export const fromNativeUnits = (rawNativeAmount: string, currency: Currency): string => {
  const factor = scaleFactor(currency.chainId)
  const value = JSBI.BigInt(rawNativeAmount)
  if (JSBI.notEqual(JSBI.remainder(value, factor), JSBI.BigInt(0))) {
    throw new Error(`nativeErc20: ${rawNativeAmount} is not a whole ${currency.symbol} amount`)
  }
  return JSBI.divide(value, factor).toString()
}

/** Address to send as `tokenIn` or `tokenOut` to the aggregator. */
export const routeTokenAddress = (currency: Currency, side: RouteSide): string =>
  currency.isNative || paysNativeForSide(currency, side) ? ETHER_ADDRESS : currency.wrapped.address

/** Decimals the aggregator will use for the amount paired with {@link routeTokenAddress}. */
export const routeTokenDecimals = (currency: Currency, side: RouteSide): number =>
  paysNativeForSide(currency, side) ? NETWORKS_INFO[currency.chainId].nativeToken.decimal : currency.decimals

/** Raw `amountIn` to pair with {@link routeTokenAddress}. */
export const routeAmountIn = (amount: CurrencyAmount<Currency>): string =>
  paysNativeOnSwap(amount.currency) ? toNativeUnits(amount) : amount.quotient.toString()

/**
 * A raw amount echoed by the aggregator, read back into the units of `currency`. The aggregator
 * answers in whatever interface it was asked about, so only the input side can come back in native
 * units — the output was quoted in the token itself.
 */
export const amountFromRoute = (rawAmount: string, currency: Currency, side: RouteSide): string =>
  paysNativeForSide(currency, side) ? fromNativeUnits(rawAmount, currency) : rawAmount

/** `msg.value` for a swap paying `amount`. */
export const swapTxValue = (amount: CurrencyAmount<Currency>): bigint => {
  if (amount.currency.isNative) return BigInt(amount.quotient.toString())
  if (paysNativeOnSwap(amount.currency)) return BigInt(toNativeUnits(amount))
  return 0n
}

export const hasNativeErc20Interface = (chainId: ChainId): boolean => !!erc20InterfaceOf(chainId)

/**
 * True when `currency` is its chain's native asset, however that asset is represented. Anything that
 * treats the native asset specially for presentation — its logo, its name — should ask this rather
 * than `isNative`, which is false where the asset is itself a token.
 */
export const isNativeAsset = (currency: { isNative?: boolean; chainId?: number } | undefined): boolean =>
  !!currency && (!!currency.isNative || isNativeErc20(currency as Currency))

/**
 * A raw `eth_getBalance` reading as an amount of `NativeCurrencies[chainId]`. Those are the same
 * units on every ordinary chain, but where the native asset has an ERC-20 interface the reading is
 * in the finer native units and has to be scaled down.
 *
 * Unlike {@link fromNativeUnits} this truncates, because it is describing a balance rather than an
 * amount the app chose: the ERC-20 interface cannot represent sub-unit dust, so the balance it
 * reports is the truncated one, and matching it keeps the two readings consistent.
 */
export const nativeBalanceAmount = (rawNativeBalance: string, chainId: ChainId): CurrencyAmount<Currency> => {
  const currency = NativeCurrencies[chainId]
  if (!hasNativeErc20Interface(chainId)) return CurrencyAmount.fromRawAmount(currency, rawNativeBalance)
  return CurrencyAmount.fromRawAmount(currency, JSBI.divide(JSBI.BigInt(rawNativeBalance), scaleFactor(chainId)))
}

/**
 * Amount of `currency` to keep back for gas, or undefined when it is not the chain's gas asset. On
 * these chains the asset being spent is also what pays the fee, and both interfaces draw on one
 * balance, so spending all of it would leave nothing to send the transaction with.
 */
export const gasReserveFor = (currency: Currency): CurrencyAmount<Currency> | undefined => {
  if (!isNativeErc20(currency)) return undefined
  const reserve = erc20InterfaceOf(currency.chainId)?.gasReserve
  return reserve ? CurrencyAmount.fromRawAmount(currency, reserve) : undefined
}

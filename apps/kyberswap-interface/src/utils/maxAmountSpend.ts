import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

import { gasReserveFor } from 'utils/nativeErc20'

/**
 * The most of `currencyAmount` the Max and Half controls should offer.
 *
 * On chains whose native asset is itself an ERC-20 token, the token being spent also pays for gas,
 * so offering the whole balance would leave the account unable to send the transaction. The reserve
 * only caps what the controls fill in — a balance at or below it is offered whole rather than
 * refused, since a small balance can still cover a swap and the wallet is the one that knows.
 */
const spendableCeiling = (currencyAmount: CurrencyAmount<Currency>): CurrencyAmount<Currency> => {
  const reserve = gasReserveFor(currencyAmount.currency)
  if (!reserve || !currencyAmount.greaterThan(reserve)) return currencyAmount
  return currencyAmount.subtract(reserve)
}

export function maxAmountSpend(currencyAmount?: CurrencyAmount<Currency>): CurrencyAmount<Currency> | undefined {
  if (!currencyAmount) return undefined
  return spendableCeiling(currencyAmount)
}

export function halfAmountSpend(currencyAmount?: CurrencyAmount<Currency>): CurrencyAmount<Currency> | undefined {
  if (!currencyAmount) return undefined
  const ceiling = spendableCeiling(currencyAmount)
  const halfSpend = JSBI.divide(currencyAmount.quotient, JSBI.BigInt(2))
  const half = CurrencyAmount.fromRawAmount(currencyAmount.currency, halfSpend)
  return half.greaterThan(ceiling) ? ceiling : half
}

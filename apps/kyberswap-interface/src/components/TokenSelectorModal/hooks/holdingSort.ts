import { Currency, CurrencyAmount, TokenAmount } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

export type TokenHolding = {
  balance?: CurrencyAmount<Currency>
  price?: number
  favorite?: boolean
  unlisted?: boolean
}

const balanceComparator = (
  balanceA?: TokenAmount | CurrencyAmount<Currency>,
  balanceB?: TokenAmount | CurrencyAmount<Currency>,
) => {
  if (balanceA && balanceB) {
    if (balanceA.equalTo(balanceB)) return 0
    const isBalanceAGreater = JSBI.greaterThan(
      JSBI.multiply(balanceA.quotient, balanceB.decimalScale),
      JSBI.multiply(balanceB.quotient, balanceA.decimalScale),
    )
    return isBalanceAGreater ? -1 : 1
  }

  if (balanceA?.greaterThan('0')) {
    return -1
  }

  if (balanceB?.greaterThan('0')) {
    return 1
  }

  return 0
}

const usdValueOf = (balance: TokenAmount | CurrencyAmount<Currency> | undefined, price: number | undefined): number => {
  if (!balance || !price || price <= 0) return 0
  const amount = parseFloat(balance.toExact())
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return amount * price
}

/** Shared ranking policy; the caller owns chain-qualified balance and membership lookup. */
export const getHoldingComparator = (lookup: (currency: Currency) => TokenHolding | undefined) => {
  const symbolOrder = (tokenA: Currency, tokenB: Currency) => {
    if (tokenA.symbol && tokenB.symbol) {
      return tokenA.symbol.toLowerCase().localeCompare(tokenB.symbol.toLowerCase())
    }
    return tokenA.symbol ? -1 : tokenB.symbol ? 1 : 0
  }
  return (tokenA: Currency, tokenB: Currency): number => {
    const infoA = lookup(tokenA)
    const infoB = lookup(tokenB)
    const balanceA = infoA?.balance
    const balanceB = infoB?.balance
    const priceA = infoA?.price ?? 0
    const priceB = infoB?.price ?? 0
    const usdBalanceA = usdValueOf(balanceA, priceA)
    const usdBalanceB = usdValueOf(balanceB, priceB)
    const heldA = !!balanceA?.greaterThan('0')
    const heldB = !!balanceB?.greaterThan('0')

    if (infoA?.unlisted || infoB?.unlisted) {
      // Unpriced unlisted holdings go last, among themselves alphabetically rather than by amount.
      const spamA = !!infoA?.unlisted && !(priceA > 0)
      const spamB = !!infoB?.unlisted && !(priceB > 0)
      if (spamA !== spamB) return spamA ? 1 : -1
      if (spamA) return symbolOrder(tokenA, tokenB)

      // A listed holding ranks above any unlisted one before value is even looked at.
      const listedHeldA = heldA && !infoA?.unlisted
      const listedHeldB = heldB && !infoB?.unlisted
      if (listedHeldA !== listedHeldB) return listedHeldA ? -1 : 1
    }

    if (usdBalanceA > 0 || usdBalanceB > 0) {
      if (usdBalanceA !== usdBalanceB) return usdBalanceB - usdBalanceA
    }

    // Anything held ranks above anything not held, priced or not.
    if (heldA !== heldB) return heldA ? -1 : 1

    const balanceComp = balanceComparator(balanceA, balanceB)
    if (balanceComp !== 0) return balanceComp

    // Favorites rank above non-favorites, but only after balance/value — a held token still leads.
    if (!!infoA?.favorite !== !!infoB?.favorite) return infoA?.favorite ? -1 : 1

    return symbolOrder(tokenA, tokenB)
  }
}

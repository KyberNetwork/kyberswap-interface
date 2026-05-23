import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema'
import { ChainId, Currency, CurrencyAmount, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'
import { useMemo } from 'react'

import { useActiveWeb3React } from 'hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useAllTokenBalances, useNativeBalance } from 'state/wallet/hooks'
import { isTokenNative } from 'utils/tokenInfo'

// compare two token amounts with highest one coming first
function balanceComparator(
  balanceA?: TokenAmount | CurrencyAmount<Currency>,
  balanceB?: TokenAmount | CurrencyAmount<Currency>,
) {
  if (balanceA && balanceB) {
    return JSBI.greaterThan(
      JSBI.multiply(balanceA.quotient, balanceB.decimalScale),
      JSBI.multiply(balanceB.quotient, balanceA.decimalScale),
    )
      ? -1
      : balanceA.equalTo(balanceB)
      ? 0
      : 1
  } else if (balanceA && balanceA.greaterThan('0')) {
    return -1
  } else if (balanceB && balanceB.greaterThan('0')) {
    return 1
  }
  return 0
}

// USD value = balance.toExact() * priceUsd. Returns 0 when either is missing.
function usdValueOf(balance: TokenAmount | CurrencyAmount<Currency> | undefined, price: number | undefined): number {
  if (!balance || !price || price <= 0) return 0
  const n = parseFloat(balance.toExact())
  if (!Number.isFinite(n) || n <= 0) return 0
  return n * price
}

function getTokenComparator(
  balances: {
    [tokenAddress: string]: TokenAmount | undefined
  },
  ethBalance: CurrencyAmount<Currency> | undefined,
  prices: { [address: string]: number },
): (tokenA: Token, tokenB: Token) => number {
  return function sortTokens(tokenA: Token, tokenB: Token): number {
    // -1 = a is first; 1 = b is first
    const balanceA = isTokenNative(tokenA) ? ethBalance : balances[tokenA.address]
    const balanceB = isTokenNative(tokenB) ? ethBalance : balances[tokenB.address]

    // Sort by USD value when at least one side has a price.
    const priceA = prices[tokenA.address?.toLowerCase()] ?? prices[tokenA.address] ?? 0
    const priceB = prices[tokenB.address?.toLowerCase()] ?? prices[tokenB.address] ?? 0
    const usdA = usdValueOf(balanceA, priceA)
    const usdB = usdValueOf(balanceB, priceB)
    if (usdA > 0 || usdB > 0) {
      if (usdA !== usdB) return usdB - usdA
    }

    // Fall back to raw-balance comparison among unpriced tokens.
    const balanceComp = balanceComparator(balanceA, balanceB)
    if (balanceComp !== 0) return balanceComp

    if (tokenA.symbol && tokenB.symbol) {
      return tokenA.symbol.toLowerCase() < tokenB.symbol.toLowerCase() ? -1 : 1
    } else {
      return tokenA.symbol ? -1 : tokenB.symbol ? -1 : 0
    }
  }
}

const EMPTY_OBJECT = {}
export function useTokenComparator(inverted: boolean, customChain?: ChainId): (tokenA: Token, tokenB: Token) => number {
  const { chainId: currentChain } = useActiveWeb3React()
  const chainId = customChain || currentChain
  const balances = useAllTokenBalances(chainId)
  const ethBalance = useNativeBalance(chainId)
  // Include the native sentinel so `useTokenPrices` also fetches the wrapped-native
  // price (BNB/WBNB share a price); otherwise native rows look unpriced and sink to
  // the bottom of the list.
  const priceAddresses = useMemo(() => [...Object.keys(balances ?? EMPTY_OBJECT), NATIVE_TOKEN_ADDRESS], [balances])
  const prices = useTokenPrices(priceAddresses, chainId)
  return useMemo(() => {
    const comparator = getTokenComparator(balances ?? EMPTY_OBJECT, ethBalance, prices)
    if (inverted) {
      return (tokenA: Token, tokenB: Token) => comparator(tokenA, tokenB) * -1
    }
    return comparator
  }, [balances, inverted, ethBalance, prices])
}

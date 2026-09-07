import { ChainId, Currency, Token, TokenAmount } from '@kyberswap/ks-sdk-core'

import { ETHER_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { TokenMap } from 'hooks/useTokens'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { computeInventoryDiscoveries } from 'state/walletInventory/discoveries'
import { TokenMetadata } from 'state/walletInventory/metadata'
import { WalletInventory, buildInventoryBalanceMap } from 'state/walletInventory/resolve'

/**
 * The wallet popup's view of an inventory, React-free so the vetting rules can be exercised directly.
 *
 * Holdings split by trust: `vetted` is what the popup lists and totals — whitelisted tokens the
 * wallet holds, plus every imported token (at zero too, since the user asked to track it), plus the
 * native currency when held. `hidden` is everything else the wallet holds: unvetted, listed after the
 * vetted ones and never counted in the total, so a spam airdrop with a quote cannot inflate it.
 */
export type WalletHoldings = {
  vetted: Currency[]
  hidden: WrappedTokenInfo[]
  impersonators: Set<string>
  /** Balances for every vetted and hidden token, keyed by checksummed address. */
  currencyBalances: { [address: string]: TokenAmount | undefined }
}

const EMPTY_HOLDINGS: WalletHoldings = { vetted: [], hidden: [], impersonators: new Set(), currencyBalances: {} }

export const selectWalletHoldings = (
  inventory: WalletInventory,
  defaultTokens: TokenMap,
  tokenImports: Token[],
  chainId: ChainId,
  metadata?: TokenMetadata,
): WalletHoldings => {
  // Off the inventory path the legacy hook answers; scanning the whitelist here would be wasted work
  // and would hand consumers a fresh object to re-render on for nothing.
  if (!inventory.active) return EMPTY_HOLDINGS

  const { tokens: hidden, impersonators } = computeInventoryDiscoveries(
    inventory,
    defaultTokens,
    tokenImports,
    chainId,
    metadata,
  )

  // Walk the wallet's rows and look each up in the token map — proportional to what the wallet holds,
  // not to the size of the whitelist, which matters because every native-balance move rebuilds the
  // inventory. Imports join regardless of balance (the user asked to track them).
  const vettedTokens: Token[] = []
  const seen = new Set<string>()
  // The native currency joins below as itself; the token list carries it under the native sentinel
  // address too, and taking that entry here would list it twice.
  Object.keys(inventory.rows).forEach(address => {
    if (address === ETHER_ADDRESS) return
    const token = defaultTokens[address]
    if (token) {
      vettedTokens.push(token)
      seen.add(address)
    }
  })
  tokenImports.forEach(token => {
    if (token.address !== ETHER_ADDRESS && !seen.has(token.address)) vettedTokens.push(token)
  })
  const currencyBalances = buildInventoryBalanceMap([...vettedTokens, ...hidden], inventory)

  const vetted: Currency[] = [...vettedTokens]
  const nativeRow = inventory.rows[ETHER_ADDRESS]
  if (nativeRow && nativeRow.rawBalance > 0n) vetted.push(NativeCurrencies[chainId])

  return { vetted, hidden, impersonators, currencyBalances }
}

/**
 * Whether the chain's token list has landed. Until it has, the map holds at most the user's imports,
 * and classifying holdings against it would file every real token under "hidden".
 */
export const isTokenListReady = (defaultTokens: TokenMap, tokenImports: Token[]): boolean =>
  Object.keys(defaultTokens).length > tokenImports.length

export type RankedWalletHoldings = {
  /** Vetted holdings, highest USD value first. */
  currencies: Currency[]
  /** Hidden holdings: highest USD value first, then the largest amount among the unpriced. */
  hidden: WrappedTokenInfo[]
  /** USD value of the vetted holdings; unpriced tokens contribute nothing. */
  totalBalanceInUsd: number
}

/**
 * Orders both groups by USD value, falling back to the amount in token units and then the symbol.
 * Prices are keyed by wrapped address, which is also how the native currency is priced (through its
 * wrapped token) — matching the popup's own lookups.
 */
export const rankWalletHoldings = (
  holdings: WalletHoldings,
  inventory: WalletInventory,
  chainId: ChainId,
  prices: { [address: string]: number },
): RankedWalletHoldings => {
  const amountOf = (currency: Currency): number => {
    const raw = currency.isNative
      ? inventory.rows[ETHER_ADDRESS]?.rawBalance
      : holdings.currencyBalances[currency.wrapped.address]?.quotient
    return raw ? Number(raw) / 10 ** currency.decimals : 0
  }
  const rank = <T extends Currency>(currencies: T[]) => {
    const valued = currencies.map(currency => {
      const amount = amountOf(currency)
      return { currency, amount, usd: amount * (prices[currency.wrapped.address] ?? 0) }
    })
    // Ties return 0: an always-nonzero comparator would shuffle equal-value rows on every re-sort.
    valued.sort(
      (a, b) =>
        b.usd - a.usd || b.amount - a.amount || (a.currency.symbol ?? '').localeCompare(b.currency.symbol ?? ''),
    )
    return valued
  }

  const vetted = rank(holdings.vetted)
  return {
    currencies: vetted.map(entry => entry.currency),
    hidden: rank(holdings.hidden).map(entry => entry.currency),
    totalBalanceInUsd: vetted.reduce((total, entry) => total + entry.usd, 0),
  }
}

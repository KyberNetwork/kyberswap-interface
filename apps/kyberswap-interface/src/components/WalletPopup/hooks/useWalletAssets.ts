import { Currency, TokenAmount } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/useTokens'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'
import { useUserAddedTokens } from 'state/user/hooks'
import { useTokensHasBalance } from 'state/wallet/hooks'
import { isTokenListReady, rankWalletHoldings, selectWalletHoldings } from 'state/walletInventory/assets'
import { EMPTY_DISCOVERIES } from 'state/walletInventory/discoveries'
import { useTokenMetadata, useWalletInventory } from 'state/walletInventory/hooks'
import { INACTIVE_INVENTORY } from 'state/walletInventory/resolve'

const EMPTY_ADDRESSES: string[] = []
const EMPTY_HIDDEN: WrappedTokenInfo[] = []

export type WalletAssets = {
  loading: boolean
  /** Vetted holdings (whitelisted or imported), highest USD value first. */
  currencies: Currency[]
  currencyBalances: { [address: string]: TokenAmount | undefined }
  /** USD price per wrapped address, for the rows' USD sub-line. */
  usdBalances: { [address: string]: number }
  /** `null` while nothing is known yet, so the header can show a placeholder rather than $0. */
  totalBalanceInUsd: number | null
  /** Held but unvetted tokens, listed after the vetted ones by value; empty off the inventory path. */
  hiddenTokens: WrappedTokenInfo[]
  impersonators: Set<string>
}

/**
 * What the wallet popup lists. On chains the inventory service indexes, one request answers for
 * every token the wallet holds; elsewhere — and whenever the inventory cannot vouch for the wallet —
 * the whole-whitelist multicall hook answers. Only one of the two ever does work.
 */
export const useWalletAssets = (): WalletAssets => {
  const { chainId } = useActiveWeb3React()
  const inventory = useWalletInventory()
  // `pending` counts as inventory-owned: starting the multicall during the first fetch would sweep
  // the whitelist only to throw the result away a moment later.
  const inventoryOwned = inventory.active || inventory.pending
  const legacy = useTokensHasBalance(true, !inventoryOwned)

  const defaultTokens = useAllTokens()
  const tokenImports = useUserAddedTokens()
  // Classifying holdings needs the token list; before it lands every real token would read as
  // unvetted. Treated as loading rather than rendered.
  const tokenListReady = isTokenListReady(defaultTokens, tokenImports)

  const metadata = useTokenMetadata()
  const holdings = useMemo(
    () =>
      tokenListReady
        ? selectWalletHoldings(inventory, defaultTokens, tokenImports, chainId, metadata)
        : selectWalletHoldings(INACTIVE_INVENTORY, defaultTokens, tokenImports, chainId, metadata),
    [tokenListReady, inventory, defaultTokens, tokenImports, chainId, metadata],
  )

  // Hidden holdings are priced too, for their order and USD line; only the vetted ones are totalled.
  const priceAddresses = useMemo(
    () =>
      inventory.active
        ? [...holdings.vetted, ...holdings.hidden].map(currency => currency.wrapped.address)
        : EMPTY_ADDRESSES,
    [inventory.active, holdings.vetted, holdings.hidden],
  )
  const { data: prices, loading: pricesLoading } = useTokenPricesWithLoading(priceAddresses)

  const ranked = useMemo(
    () => rankWalletHoldings(holdings, inventory, chainId, prices),
    [holdings, inventory, chainId, prices],
  )

  // The legacy hook returns a new object every render; key on its memoized fields so this result
  // only changes when something it carries does.
  const {
    loading: legacyLoading,
    currencies: legacyCurrencies,
    currencyBalances: legacyBalances,
    usdBalances: legacyUsd,
    totalBalanceInUsd: legacyTotal,
  } = legacy

  return useMemo(() => {
    if (!inventory.active) {
      return {
        loading: legacyLoading || inventory.pending,
        currencies: legacyCurrencies,
        currencyBalances: legacyBalances,
        usdBalances: legacyUsd,
        // While the first inventory fetch is in flight the legacy hook is idle and would report $0;
        // null keeps the header on its placeholder until a real figure exists.
        totalBalanceInUsd: inventory.pending ? null : legacyTotal,
        hiddenTokens: EMPTY_HIDDEN,
        impersonators: EMPTY_DISCOVERIES.impersonators,
      }
    }
    return {
      // Not settled means the trust check is still waiting on the native read: the list could be
      // handed back to multicall a block later, so it is not shown yet.
      loading: !tokenListReady || !inventory.settled,
      currencies: ranked.currencies,
      currencyBalances: holdings.currencyBalances,
      usdBalances: prices,
      // Null while prices are still on their way, so the header keeps its placeholder instead of
      // printing $0 and then jumping.
      totalBalanceInUsd: pricesLoading && holdings.vetted.length ? null : ranked.totalBalanceInUsd,
      hiddenTokens: ranked.hidden,
      impersonators: holdings.impersonators,
    }
  }, [
    inventory.active,
    inventory.pending,
    inventory.settled,
    tokenListReady,
    pricesLoading,
    legacyLoading,
    legacyCurrencies,
    legacyBalances,
    legacyUsd,
    legacyTotal,
    holdings,
    ranked,
    prices,
  ])
}

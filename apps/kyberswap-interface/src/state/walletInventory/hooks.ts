import { ChainId, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo, useSyncExternalStore } from 'react'

import { useActiveWeb3React } from 'hooks'
import { useNativeBalance } from 'state/wallet/hooks'
import {
  TokenMetadata,
  ensureTokenMetadata,
  getTokenMetadata,
  subscribeTokenMetadata,
} from 'state/walletInventory/metadata'
import { WalletInventory, buildInventoryBalanceMap, resolveInventory } from 'state/walletInventory/resolve'
import {
  getStoreVersion,
  inventoryKey,
  isInventoryChain,
  readEntry,
  register,
  subscribeStore,
  unregister,
} from 'state/walletInventory/store'

export type { WalletInventory }

/**
 * Subscribes to the wallet's token inventory on a chain. Every consumer sharing a (chain, account)
 * shares one poll, so the selector, the token list and the wallet popup cost a single request between
 * them.
 *
 * Pass `enabled: false` for surfaces that are mounted but not showing balances (a closed modal), so
 * they register no traffic.
 */
export const useWalletInventory = (chainId?: ChainId, enabled = true): WalletInventory => {
  const { chainId: currentChain, account } = useActiveWeb3React()
  const resolvedChain = chainId || currentChain
  const subscribed = enabled && isInventoryChain(resolvedChain) && !!account

  useEffect(() => {
    if (!subscribed || !account) return
    register(resolvedChain, account)
    return () => unregister(resolvedChain, account)
  }, [subscribed, resolvedChain, account])

  const storeVersion = useSyncExternalStore(subscribeStore, getStoreVersion, getStoreVersion)
  const key = subscribed && account ? inventoryKey(resolvedChain, account) : undefined
  // `storeVersion` is what makes these re-read when the store changes; both return stable references
  // while their data holds, so the resolver below only re-runs on a real change.
  /* eslint-disable react-hooks/exhaustive-deps */
  const entry = useMemo(() => (key ? readEntry(key) : undefined), [key, storeVersion])
  /* eslint-enable react-hooks/exhaustive-deps */

  // Read live per block. Identity changes every block even when the value does not, so the resolver is
  // keyed on the value to avoid rebuilding rows for a balance that did not move.
  const nativeRawBalance = useNativeBalance(resolvedChain)?.quotient.toString()

  return useMemo(() => resolveInventory(entry, subscribed, nativeRawBalance), [entry, subscribed, nativeRawBalance])
}

/**
 * The catalog metadata snapshot; a new map whenever a batch adds tokens, so anything deriving
 * discovery tokens from it re-derives exactly then.
 */
export const useTokenMetadata = (): TokenMetadata =>
  useSyncExternalStore(subscribeTokenMetadata, getTokenMetadata, getTokenMetadata)

/** Requests catalog metadata for the given tokens; addresses already answered cost a lookup. */
export const useEnsureTokenMetadata = (chainId: ChainId, tokens: readonly { address: string }[]) => {
  useEffect(() => {
    if (!tokens.length) return
    void ensureTokenMetadata(
      chainId,
      tokens.map(token => token.address),
    )
  }, [chainId, tokens])
}

/** Inventory balances in the same shape as the `useTokenBalances` multicall map. */
export const useInventoryTokenBalances = (
  tokens: Token[],
  inventory: WalletInventory,
): { [tokenAddress: string]: TokenAmount | undefined } =>
  useMemo(() => buildInventoryBalanceMap(tokens, inventory), [tokens, inventory])

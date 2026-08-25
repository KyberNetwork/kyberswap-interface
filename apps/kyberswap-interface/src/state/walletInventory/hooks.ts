import { ChainId, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo, useSyncExternalStore } from 'react'

import { useActiveWeb3React } from 'hooks'
import { useNativeBalance } from 'state/wallet/hooks'
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
  const entry = useMemo(
    () => (subscribed && account ? readEntry(inventoryKey(resolvedChain, account)) : undefined),
    // `storeVersion` is what makes this re-read when the store changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subscribed, account, resolvedChain, storeVersion],
  )

  // Read live per block. Identity changes every block even when the value does not, so the resolver is
  // keyed on the value to avoid rebuilding rows for a balance that did not move.
  const nativeRawBalance = useNativeBalance(resolvedChain)?.quotient.toString()

  return useMemo(() => resolveInventory(entry, subscribed, nativeRawBalance), [entry, subscribed, nativeRawBalance])
}

/** Inventory balances in the same shape as the `useTokenBalances` multicall map. */
export const useInventoryTokenBalances = (
  tokens: Token[],
  inventory: WalletInventory,
): { [tokenAddress: string]: TokenAmount | undefined } =>
  useMemo(() => buildInventoryBalanceMap(tokens, inventory), [tokens, inventory])

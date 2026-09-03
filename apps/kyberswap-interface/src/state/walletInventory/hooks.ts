import { ChainId, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { useEffect, useMemo, useSyncExternalStore } from 'react'

import { ERC20_ABI } from 'constants/abis'
import { useActiveWeb3React } from 'hooks'
import { useBlockNumberFor } from 'state/application/hooks'
import { useMultipleContractSingleData } from 'state/multicall/hooks'
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
  publishLiveBalances,
  readEntry,
  readLiveBalances,
  readTouchedTokens,
  register,
  retireLiveBalances,
  subscribeStore,
  unregister,
} from 'state/walletInventory/store'

export type { WalletInventory }

const NO_ADDRESSES: string[] = []

/**
 * Reads the tokens the wallet's recent transactions moved straight from the chain, every block, for
 * as long as the inventory is behind those transactions, and overlays the result. This is what keeps
 * a just-swapped balance right on screen wherever the wallet is looked at — the indexer needs a
 * while to catch up, and the forms that read their own tokens may already be gone.
 */
const useTouchedTokenReads = (chainId: ChainId, account: string | undefined, key: string | undefined) => {
  const { chainId: currentChain } = useActiveWeb3React()
  const storeVersion = useSyncExternalStore(subscribeStore, getStoreVersion, getStoreVersion)
  // `storeVersion` re-reads the watch as transactions confirm and walks land.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const touched = useMemo(() => (key ? readTouchedTokens(key, Date.now()) : NO_ADDRESSES), [key, storeVersion])
  // The multicall hook reads on the active chain only.
  const addresses = account && chainId === currentChain ? touched : NO_ADDRESSES
  const calls = useMultipleContractSingleData(addresses, ERC20_ABI, 'balanceOf', [account])
  const blockNumber = useBlockNumberFor(chainId)

  useEffect(() => {
    if (!account || !addresses.length || blockNumber === undefined) return
    const reads = addresses.flatMap((address, index) => {
      const raw = calls[index]?.result?.[0]
      return raw !== undefined ? [{ address, rawBalance: BigInt(raw.toString()) }] : []
    })
    if (reads.length) publishLiveBalances(chainId, account, blockNumber, reads)
  }, [account, addresses, blockNumber, calls, chainId])

  useEffect(() => {
    if (!account || !addresses.length) return
    return () => retireLiveBalances(chainId, account, addresses)
  }, [account, addresses, chainId])
}

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
  useTouchedTokenReads(resolvedChain, account, key)
  // `storeVersion` is what makes these re-read when the store changes; both return stable references
  // while their data holds, so the resolver below only re-runs on a real change.
  /* eslint-disable react-hooks/exhaustive-deps */
  const entry = useMemo(() => (key ? readEntry(key) : undefined), [key, storeVersion])
  const live = useMemo(() => (key ? readLiveBalances(key) : undefined), [key, storeVersion])
  /* eslint-enable react-hooks/exhaustive-deps */

  // Read live per block. Identity changes every block even when the value does not, so the resolver is
  // keyed on the value to avoid rebuilding rows for a balance that did not move.
  const nativeRawBalance = useNativeBalance(resolvedChain)?.quotient.toString()

  return useMemo(
    () => resolveInventory(entry, subscribed, nativeRawBalance, live),
    [entry, subscribed, nativeRawBalance, live],
  )
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

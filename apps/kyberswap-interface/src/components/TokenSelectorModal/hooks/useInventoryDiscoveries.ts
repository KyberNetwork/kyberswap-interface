import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { TokenMap } from 'hooks/useTokens'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { isTokenListReady } from 'state/walletInventory/assets'
import { InventoryDiscoveries, computeInventoryDiscoveries } from 'state/walletInventory/discoveries'
import { WalletInventory, useEnsureTokenMetadata, useTokenMetadata } from 'state/walletInventory/hooks'

export type { InventoryDiscoveries }

const NO_TOKENS: WrappedTokenInfo[] = []

/**
 * Memoized `computeInventoryDiscoveries` (see that function for what it surfaces and why), with the
 * catalog metadata for the surfaced tokens requested so their rows carry a real name and logo.
 */
export const useInventoryDiscoveries = (
  inventory: WalletInventory,
  defaultTokens: TokenMap,
  tokenImports: Token[],
  chainId: ChainId,
): InventoryDiscoveries => {
  const metadata = useTokenMetadata()
  const discoveries = useMemo(
    () => computeInventoryDiscoveries(inventory, defaultTokens, tokenImports, chainId, metadata),
    [inventory, defaultTokens, tokenImports, chainId, metadata],
  )
  // Before the chain's list lands every held token classifies as a discovery; asking the catalog
  // about the whole wallet then would spend a request on tokens the list is about to describe.
  useEnsureTokenMetadata(chainId, isTokenListReady(defaultTokens, tokenImports) ? discoveries.tokens : NO_TOKENS)
  return discoveries
}

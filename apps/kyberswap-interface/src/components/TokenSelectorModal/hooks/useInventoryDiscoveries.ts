import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { TokenMap } from 'hooks/useTokens'
import { InventoryDiscoveries, computeInventoryDiscoveries } from 'state/walletInventory/discoveries'
import { WalletInventory, useTokenMetadata } from 'state/walletInventory/hooks'

export type { InventoryDiscoveries }

/**
 * Memoized `computeInventoryDiscoveries` (see that function for what it surfaces and why). Catalog
 * metadata for the surfaced tokens is requested by the list as their rows come into view.
 */
export const useInventoryDiscoveries = (
  inventory: WalletInventory,
  defaultTokens: TokenMap,
  tokenImports: Token[],
  chainId: ChainId,
): InventoryDiscoveries => {
  const metadata = useTokenMetadata()
  return useMemo(
    () => computeInventoryDiscoveries(inventory, defaultTokens, tokenImports, chainId, metadata),
    [inventory, defaultTokens, tokenImports, chainId, metadata],
  )
}

import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { TokenMap } from 'hooks/useTokens'
import { InventoryDiscoveries, computeInventoryDiscoveries } from 'state/walletInventory/discoveries'
import { WalletInventory } from 'state/walletInventory/hooks'

export type { InventoryDiscoveries }

/** Memoized `computeInventoryDiscoveries`; see that function for what it surfaces and why. */
export const useInventoryDiscoveries = (
  inventory: WalletInventory,
  defaultTokens: TokenMap,
  tokenImports: Token[],
  chainId: ChainId,
): InventoryDiscoveries =>
  useMemo(
    () => computeInventoryDiscoveries(inventory, defaultTokens, tokenImports, chainId),
    [inventory, defaultTokens, tokenImports, chainId],
  )

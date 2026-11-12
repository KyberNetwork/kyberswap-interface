import { createContext, useContext } from 'react'

import { useActiveWeb3React } from 'hooks'
import type { Chain } from 'types/crossChain'

export type WalletBalanceScope = { chain: Chain; address: string }
/** Read-only scope for a form side and its token selector. Never changes the signing wallet. */
export const WalletBalanceContext = createContext<WalletBalanceScope | undefined>(undefined)

export const useWalletBalanceAddress = (chain: Chain, fallback?: string | null) => {
  const scope = useContext(WalletBalanceContext)
  if (!scope) return fallback || undefined
  const sameFamily = scope.chain === chain || (typeof scope.chain === 'number' && typeof chain === 'number')
  // An empty slot or another family must not borrow the app wallet's holdings.
  return sameFamily ? scope.address || undefined : undefined
}

export const useEvmBalanceAccount = () => {
  const { account, chainId } = useActiveWeb3React()
  return useWalletBalanceAddress(chainId, account)
}

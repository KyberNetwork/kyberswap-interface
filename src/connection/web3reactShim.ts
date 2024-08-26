import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { useAccount } from 'hooks/useAccount'
import { useEthersProvider } from 'hooks/useEthersProvider'

export function useWeb3React() {
  const account = useAccount()
  const provider = useEthersProvider({ chainId: account.chainId })

  return useMemo(
    () => ({
      account: account.address,
      chainId: account.chainId ?? ChainId.MAINNET,
      provider,
    }),
    [account.address, account.chainId, provider],
  )
}

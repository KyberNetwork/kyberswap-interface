import { ChainId } from '@namgold/ks-sdk-core'
import { AnchorProvider } from '@project-serum/anchor'
import { useAnchorWallet } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'

import { NETWORKS_INFO } from 'constants/networks'

const useProvider = (): AnchorProvider | null => {
  const wallet = useAnchorWallet()

  const provider = useMemo(
    () =>
      wallet
        ? new AnchorProvider(NETWORKS_INFO[ChainId.SOLANA].connection, wallet, AnchorProvider.defaultOptions())
        : null,
    [wallet],
  )
  return provider
}

export default useProvider

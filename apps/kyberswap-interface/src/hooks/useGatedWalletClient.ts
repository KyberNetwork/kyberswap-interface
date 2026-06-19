import { useEffect, useState } from 'react'
// eslint-disable-next-line no-restricted-imports
import { useWalletClient } from 'wagmi'

import { useActiveWeb3React } from 'hooks'
import { getGatedWalletClient } from 'utils/walletClient'

type WalletClient = Awaited<ReturnType<typeof getGatedWalletClient>>

/**
 * Reactive variant of `getGatedWalletClient`. Use in place of wagmi's
 * `useWalletClient` so the Blackjack compliance gate runs at the EIP-1193
 * boundary on every signing / sending method.
 *
 * The gated client is scoped to the app's active chain (`useActiveWeb3React`
 * returns Redux `state.user.chainId`), matching the static `getGatedWalletClient`
 * convention so the chain-mismatch guard fires consistently when the wallet
 * is on a different chain than the app expects.
 */
export function useGatedWalletClient(): { data: WalletClient | undefined } {
  const { data: rawClient } = useWalletClient()
  const { chainId } = useActiveWeb3React()
  const [gated, setGated] = useState<WalletClient | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    if (!rawClient) {
      setGated(undefined)
      return
    }
    getGatedWalletClient({ chainId: chainId as number })
      .then(client => {
        if (!cancelled) setGated(client)
      })
      .catch(err => {
        if (!cancelled) setGated(undefined)
        console.error('useGatedWalletClient: failed to resolve wallet client', err)
      })
    return () => {
      cancelled = true
    }
  }, [rawClient, chainId])

  return { data: gated }
}

import { useEffect, useState } from 'react'

import { useAccount } from 'hooks/useAccount'

/**
 * Indicates whether the connected wallet address may still be hydrating.
 *
 * Wagmi can temporarily report no account on the first render before restoring a persisted connection. This hook
 * keeps account-dependent screens in their loading state during that render and while the wallet is connecting or
 * reconnecting, preventing them from briefly showing an empty state. It does not restore the connection itself.
 */
export default function useIsWalletRestoring() {
  const { status } = useAccount()
  const [hasPassedInitialRender, setHasPassedInitialRender] = useState(false)

  useEffect(() => {
    setHasPassedInitialRender(true)
  }, [])

  return !hasPassedInitialRender || status === 'connecting' || status === 'reconnecting'
}

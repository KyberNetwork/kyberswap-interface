import { useEffect } from 'react'

import { useAccount } from 'hooks/useAccount'
import useDisconnectWallet from 'hooks/web3/useDisconnectWallet'
import { useIsAcceptedTerm } from 'state/user/hooks'
import { isInSafeApp } from 'utils/safeApp'

/**
 * Disconnects a wallet whose owner has not accepted the current Terms of Use — a session restored from
 * before the current document took effect. Safe App users acknowledge the Terms through their own dialog
 * instead (see `useIsSafeAppAcceptedTerm`).
 *
 * Mount it once, at the app root. Every mounted instance issues its own `disconnect()`, and each of those
 * sends the wallet a `wallet_revokePermissions` request.
 */
export default function useDisconnectOnStaleTerms() {
  const { connector } = useAccount()
  const [isAcceptedTerm] = useIsAcceptedTerm()
  const disconnect = useDisconnectWallet()

  useEffect(() => {
    if (connector && !isAcceptedTerm && !isInSafeApp) disconnect()
  }, [connector, isAcceptedTerm, disconnect])
}

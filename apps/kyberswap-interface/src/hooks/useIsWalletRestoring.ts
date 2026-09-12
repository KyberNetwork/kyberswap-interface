import { useEffect, useRef, useState } from 'react'

import { hasPersistedConnection } from 'components/Web3Provider'
import { useAccount } from 'hooks/useAccount'

// wagmi's boot walk has no timeout of its own: it awaits `connector.isAuthorized()` for each candidate,
// and a wallet extension that never answers `eth_accounts` (locked, or busy behind an unresponsive
// background page) leaves the status pinned at `connecting` for the rest of the session. Cap how long a
// page defers to it, so a wallet that never reports back cannot hide the page's own empty state forever.
// A wallet that lands after the cap still renders normally — `account` turns truthy and the data loads.
const RESTORE_TIMEOUT = 5_000

/** True while a previously connected wallet may still be restored. */
export default function useIsWalletRestoring() {
  const { status } = useAccount()
  const [isRestoring, setIsRestoring] = useState(true)
  const hasStartedRestore = useRef(false)

  useEffect(() => {
    if (!hasPersistedConnection()) {
      setIsRestoring(false)
      return
    }

    const timeout = setTimeout(() => setIsRestoring(false), RESTORE_TIMEOUT)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (status === 'connected') {
      setIsRestoring(false)
      return
    }
    if (status === 'connecting' || status === 'reconnecting') hasStartedRestore.current = true
    else if (hasStartedRestore.current) setIsRestoring(false)
  }, [status])

  return isRestoring
}

import { useEffect, useRef, useState } from 'react'

import { hasPersistedConnection } from 'components/Web3Provider'
import { useAccount } from 'hooks/useAccount'

// wagmi's boot walk has no timeout of its own: it awaits `connector.isAuthorized()` for each candidate,
// and a wallet extension that never answers `eth_accounts` (locked, or busy behind an unresponsive
// background page) leaves the status pinned at `connecting` for the rest of the session. Cap how long a
// page defers to it, so a wallet that never reports back cannot hide the page's own empty state forever.
// A wallet that lands after the cap still renders normally — `account` turns truthy and the data loads.
const RESTORE_TIMEOUT = 5_000

/**
 * True while a previously connected wallet may still be restored, so a page can hold its loading state
 * instead of flashing an empty "connect your wallet" view at a visitor whose wallet is about to return.
 */
export default function useIsWalletRestoring() {
  const { status } = useAccount()
  const [isRestoring, setIsRestoring] = useState(true)
  const hasStartedRestore = useRef(false)

  useEffect(() => {
    // The visitor left disconnected, so no restore will run and there is nothing to wait for.
    if (!hasPersistedConnection()) {
      setIsRestoring(false)
      return
    }

    const timeout = setTimeout(() => setIsRestoring(false), RESTORE_TIMEOUT)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    // A wallet already in hand needs no restoring: this page was reached after one finished.
    if (status === 'connected') {
      setIsRestoring(false)
      return
    }
    // The restore starts in a Web3Provider effect, which React runs after this one, so `disconnected`
    // here means "not started yet" until the status has been seen in flight at least once.
    if (status === 'connecting' || status === 'reconnecting') hasStartedRestore.current = true
    else if (hasStartedRestore.current) setIsRestoring(false)
  }, [status])

  return isRestoring
}

/**
 * Shared by Web3Provider's wallet listener and useChangeNetwork. Keep this module independent:
 * importing useChangeNetwork from Web3Provider would loop through hooks -> Web3Provider.
 *
 * A wallet can emit chainChanged before switchChainAsync resolves. If the listener writes Redux
 * immediately, useSyncNetworkParamWithStore replaces the URL with /{product}/{chain}, dropping
 * the pair. The switch's success callback then adds the selected pair, flashing the default tokens.
 * Hold listener updates during an app-requested switch so its owner can write the chain and run
 * the pair-navigation callback together. Direct changes in the wallet still sync immediately.
 */
let pendingSwitches = 0
let pendingSync: (() => void) | undefined

export const syncWalletChain = (sync: () => void) => {
  // Only the latest observed chain matters; replaying intermediate events would restore the flicker.
  if (pendingSwitches) pendingSync = sync
  else sync()
}

/** Returns a release function that the switch owner must call in finally, including on rejection. */
export const deferWalletChainSync = () => {
  pendingSwitches += 1
  let released = false

  return () => {
    if (released) return
    released = true
    pendingSwitches -= 1
    // One completed request must not release events while another switch is still pending.
    if (pendingSwitches) return

    // Replay even after failure: a wallet may have changed chain before reporting an RPC error.
    const sync = pendingSync
    pendingSync = undefined
    sync?.()
  }
}

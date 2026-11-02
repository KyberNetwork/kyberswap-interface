export type ReceiverWallet = { id: string; name: string; icon: string; address: string }
export const RECEIVER_WALLETS_KEY = 'crossChainReceiverWallets'
const PENDING_RECEIVER_KEY = 'crossChainReceiverRedirect'
const RECEIVER_CALLBACK = 'receiverWalletRequest'

/** MyNearWallet uses NEAR's address-only /login/ protocol (no contract or access key). */
export const beginNearReceiverRedirect = (wallet: Omit<ReceiverWallet, 'address'>, walletUrl: string) => {
  const request = crypto.randomUUID()
  const callback = new URL(window.location.href)
  callback.searchParams.set(RECEIVER_CALLBACK, request)
  const login = new URL(`${walletUrl.replace(/\/$/, '')}/login/`)
  login.searchParams.set('success_url', callback.toString())
  login.searchParams.set('failure_url', callback.toString())
  sessionStorage.setItem(PENDING_RECEIVER_KEY, JSON.stringify({ request, wallet }))
  window.location.assign(login.toString())
}

/** Consume before wallet providers mount so NEAR's SDK cannot adopt the receiver as the sender. */
export const completeNearReceiverRedirect = () => {
  const callback = new URL(window.location.href)
  const request = callback.searchParams.get(RECEIVER_CALLBACK)
  if (!request) return
  try {
    const pending = JSON.parse(sessionStorage.getItem(PENDING_RECEIVER_KEY) || 'null')
    const address = callback.searchParams.get('account_id')
    if (pending?.request === request && address && !callback.searchParams.has('errorCode')) {
      const wallets = JSON.parse(localStorage.getItem(RECEIVER_WALLETS_KEY) || '{}') || {}
      localStorage.setItem(RECEIVER_WALLETS_KEY, JSON.stringify({ ...wallets, near: { ...pending.wallet, address } }))
    }
    sessionStorage.removeItem(PENDING_RECEIVER_KEY)
  } catch {
    // A denied/cancelled callback leaves the previous receiver selection intact.
  } finally {
    for (const key of [RECEIVER_CALLBACK, 'account_id', 'public_key', 'all_keys', 'errorCode', 'errorMessage']) {
      callback.searchParams.delete(key)
    }
    window.history.replaceState(window.history.state, '', callback.toString())
  }
}

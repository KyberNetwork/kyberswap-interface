export type ReceiverWallet = {
  id: string
  name: string
  icon: string
  address: string
  derivationPath?: string
}
const PENDING_RECEIVER_KEY = 'crossChainReceiverRedirect'
const RECEIVER_CALLBACK = 'receiverWalletRequest'

let returnedNearReceiver: (ReceiverWallet & { side?: 'input' | 'output' }) | undefined
export const getReturnedNearReceiver = () => returnedNearReceiver
export const clearReturnedNearReceiver = () => {
  returnedNearReceiver = undefined
}

/** The callback authorizes a browser signing session; the form restores its SDK wallet before selection. */
export const beginNearReceiverRedirect = (
  wallet: Omit<ReceiverWallet, 'address'>,
  walletUrl: string,
  side: 'input' | 'output' = 'output',
) => {
  const request = crypto.randomUUID()
  const callback = new URL(window.location.href)
  callback.searchParams.set(RECEIVER_CALLBACK, request)
  const login = new URL(`${walletUrl.replace(/\/$/, '')}/login/`)
  login.searchParams.set('success_url', callback.toString())
  login.searchParams.set('failure_url', callback.toString())
  sessionStorage.setItem(PENDING_RECEIVER_KEY, JSON.stringify({ request, wallet, side }))
  window.location.assign(login.toString())
}

/** Capture the receiver intent before the SDK consumes NEAR's login callback. */
export const completeNearReceiverRedirect = () => {
  const callback = new URL(window.location.href)
  const request = callback.searchParams.get(RECEIVER_CALLBACK)
  if (!request) return
  try {
    const pending = JSON.parse(sessionStorage.getItem(PENDING_RECEIVER_KEY) || 'null')
    const address = callback.searchParams.get('account_id')
    if (pending?.request === request && address && !callback.searchParams.has('errorCode')) {
      returnedNearReceiver = { ...pending.wallet, address, side: pending.side }
      // MyNearWallet's SDK skips login callbacks when its previous browser account is cached.
      // A correlated receiver login replaces that browser session; the SDK consumes account_id/all_keys below.
      if (pending.wallet.id === 'my-near-wallet') localStorage.removeItem('near_app_wallet_auth_key')
    }
    sessionStorage.removeItem(PENDING_RECEIVER_KEY)
  } catch {
    // A denied/cancelled callback does not create a receiver connection.
  } finally {
    // The SDK must receive account_id/all_keys to create the signing session.
    const keys = returnedNearReceiver
      ? [RECEIVER_CALLBACK]
      : [RECEIVER_CALLBACK, 'account_id', 'public_key', 'all_keys', 'errorCode', 'errorMessage']
    for (const key of keys) {
      callback.searchParams.delete(key)
    }
    window.history.replaceState(window.history.state, '', callback.toString())
  }
}

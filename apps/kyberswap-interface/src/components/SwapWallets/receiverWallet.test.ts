// @vitest-environment happy-dom
import { WalletConnection } from 'near-api-js'
import { afterEach, expect, it, vi } from 'vitest'

import {
  beginNearReceiverRedirect,
  clearReturnedNearReceiver,
  completeNearReceiverRedirect,
  getReturnedNearReceiver,
} from './receiverWallet'

const wallet = { id: 'my-near-wallet', name: 'MyNearWallet', icon: '/near.svg' }
afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  clearReturnedNearReceiver()
  history.replaceState({}, '', '/')
  vi.restoreAllMocks()
})
it('captures receiver intent while leaving the authorization callback for the signing SDK', () => {
  history.replaceState({}, '', '/swap?inputCurrency=ETH&outputCurrency=near')
  const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => undefined)
  localStorage.setItem('near_app_wallet_auth_key', JSON.stringify({ accountId: 'old.near', allKeys: [] }))
  beginNearReceiverRedirect(wallet, 'https://app.mynearwallet.com')
  const login = new URL(assign.mock.calls[0][0])
  const callback = new URL(login.searchParams.get('success_url') || '')
  callback.searchParams.set('account_id', 'receiver.near')
  callback.searchParams.set('all_keys', 'public-keys')
  history.replaceState({}, '', callback)
  completeNearReceiverRedirect()
  expect(getReturnedNearReceiver()).toEqual({ ...wallet, address: 'receiver.near', side: 'output' })
  expect(new URL(location.href).searchParams.get('all_keys')).toBe('public-keys')
  expect(new URL(location.href).searchParams.has('receiverWalletRequest')).toBe(false)
  expect(new URL(location.href).searchParams.get('inputCurrency')).toBe('ETH')
  const session = new WalletConnection(
    {
      config: { networkId: 'mainnet', walletUrl: 'https://app.mynearwallet.com' },
      connection: { signer: { keyStore: {} } },
    } as any,
    'near_app',
  )
  expect(session.getAccountId()).toBe('receiver.near')
  expect(session.isSignedIn()).toBe(true)
  expect(new URL(location.href).searchParams.has('account_id')).toBe(false)
})
it('ignores uncorrelated callbacks and leaves ordinary sender login untouched', () => {
  history.replaceState({}, '', '/swap?receiverWalletRequest=unknown&account_id=unrelated.near')
  completeNearReceiverRedirect()
  expect(getReturnedNearReceiver()).toBeUndefined()
  expect(location.search).toBe('')
  history.replaceState({}, '', '/swap?account_id=sender.near')
  completeNearReceiverRedirect()
  expect(location.search).toBe('?account_id=sender.near')
})

// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest'

import { RECEIVER_WALLETS_KEY, beginNearReceiverRedirect, completeNearReceiverRedirect } from './receiverWallet'

const wallet = { id: 'my-near-wallet', name: 'MyNearWallet', icon: '/near.svg' }
afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  history.replaceState({}, '', '/')
  vi.restoreAllMocks()
})

it('restores a redirect receiver before the SDK can consume its callback and preserves sender storage and pair URL', () => {
  history.replaceState({}, '', '/swap?inputCurrency=ETH&outputCurrency=near')
  const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => undefined)
  localStorage.setItem('near-wallet-selector:selectedWalletId', 'sender')
  localStorage.setItem(RECEIVER_WALLETS_KEY, JSON.stringify({ sol: { address: 'sol-receiver' } }))
  beginNearReceiverRedirect(wallet, 'https://app.mynearwallet.com')
  const login = new URL(assign.mock.calls[0][0])
  expect(login.pathname).toBe('/login/')
  expect(login.searchParams.has('public_key')).toBe(false)
  expect(login.searchParams.has('contract_id')).toBe(false)
  const callback = new URL(login.searchParams.get('success_url') || '')
  callback.searchParams.set('account_id', 'receiver.near')
  callback.searchParams.set('all_keys', 'unused')
  history.replaceState({}, '', callback)
  completeNearReceiverRedirect()
  expect(JSON.parse(localStorage.getItem(RECEIVER_WALLETS_KEY) || '{}')).toEqual({
    sol: { address: 'sol-receiver' },
    near: { ...wallet, address: 'receiver.near' },
  })
  expect(localStorage.getItem('near-wallet-selector:selectedWalletId')).toBe('sender')
  expect(location.search).toBe('?inputCurrency=ETH&outputCurrency=near')
  completeNearReceiverRedirect()
  expect(JSON.parse(localStorage.getItem(RECEIVER_WALLETS_KEY) || '{}').near.address).toBe('receiver.near')
})

it('ignores an unrelated callback or cancelled login without replacing the saved receiver', () => {
  localStorage.setItem(RECEIVER_WALLETS_KEY, JSON.stringify({ near: { ...wallet, address: 'saved.near' } }))
  history.replaceState({}, '', '/swap?receiverWalletRequest=unknown&account_id=unrelated.near')
  completeNearReceiverRedirect()
  expect(JSON.parse(localStorage.getItem(RECEIVER_WALLETS_KEY) || '{}').near.address).toBe('saved.near')
  expect(location.search).toBe('')

  history.replaceState({}, '', '/swap?account_id=sender.near')
  completeNearReceiverRedirect()
  expect(location.search).toBe('?account_id=sender.near')
})

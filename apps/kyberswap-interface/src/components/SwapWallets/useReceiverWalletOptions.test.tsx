// @vitest-environment happy-dom
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { readBitcoinReceiver, useReceiverWalletOptions } from 'components/SwapWallets/useReceiverWalletOptions'
import { NonEvmChain } from 'types/crossChain'

const mocks = vi.hoisted(() => ({ setupSelector: vi.fn(), adapters: [] as any[] }))
vi.mock('@near-wallet-selector/core', () => ({ setupWalletSelector: mocks.setupSelector }))
vi.mock('components/Web3Provider/nearWalletConfig', () => ({
  walletSelectorConfig: { network: 'mainnet', modules: [] },
}))
vi.mock('components/Web3Provider/BitcoinProvider', () => ({ useBitcoinWallet: () => ({ availableWallets: [] }) }))
vi.mock('components/Web3Provider/BitcoinProvider/providers/ledger', () => ({ createLedgerProvider: vi.fn() }))
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ wallets: mocks.adapters.map(adapter => ({ adapter })) }),
}))

let root: ReturnType<typeof createRoot>
let result: ReturnType<typeof useReceiverWalletOptions>
const Harness = ({ chain }: { chain: NonEvmChain }) => {
  result = useReceiverWalletOptions(chain)
  return null
}
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mocks.adapters = []
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
  localStorage.clear()
})

it('creates an independent Bitcoin connection without changing the selected sender', async () => {
  const provider = {
    getNetwork: vi.fn().mockResolvedValue('livenet'),
    requestAccounts: vi.fn().mockResolvedValue(['receiver-btc']),
    getPublicKey: vi.fn().mockResolvedValue('public-key'),
    on: vi.fn(),
    disconnect: vi.fn(),
    switchNetwork: vi.fn(),
  }
  vi.stubGlobal('unisat_wallet', provider)
  localStorage.setItem('bitcoinWallet', 'xverse')
  const receiver = await readBitcoinReceiver('unisat')
  expect(receiver.address).toBe('receiver-btc')
  expect(localStorage.getItem('bitcoinWallet')).toBe('xverse')
  expect(receiver.family).toBe(NonEvmChain.Bitcoin)
  expect(receiver.family === NonEvmChain.Bitcoin && receiver.getPublicKey()).toBe('public-key')
  expect(provider.disconnect).not.toHaveBeenCalled()
  expect(provider.switchNetwork).not.toHaveBeenCalled()
})

it('retains a live Solana signer without selecting the global adapter or disconnecting', async () => {
  const adapter = {
    name: 'Phantom',
    icon: '/phantom.svg',
    readyState: WalletReadyState.Installed,
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    publicKey: { toString: () => 'receiver-sol' },
  }
  mocks.adapters = [adapter]
  await act(async () => root.render(<Harness chain={NonEvmChain.Solana} />))
  const [receiver] = await result.wallets[0].connect()
  adapter.publicKey = { toString: () => 'changed-in-extension' }
  await act(async () => root.render(<Harness chain={NonEvmChain.Solana} />))
  expect(receiver.getAddress()).toBe('changed-in-extension')
  expect(receiver.family === NonEvmChain.Solana && receiver.wallet).toBe(adapter)
  expect(adapter.connect).toHaveBeenCalledOnce()
  expect(adapter.disconnect).not.toHaveBeenCalled()
})

it('uses a separate NEAR selector with private storage and returns accounts without altering sender selection', async () => {
  const signIn = vi.fn().mockResolvedValue([{ accountId: 'receiver.near' }])
  const signOut = vi.fn()
  mocks.setupSelector.mockResolvedValue({
    store: {
      getState: () => ({
        modules: [
          {
            id: 'meteor',
            type: 'injected',
            metadata: { name: 'Meteor', iconUrl: '/meteor.svg', available: true },
            wallet: async () => ({
              id: 'meteor',
              metadata: { name: 'Meteor', iconUrl: '/meteor.svg' },
              type: 'injected',
              signIn,
              signOut,
            }),
          },
        ],
      }),
    },
  })
  localStorage.setItem('near-wallet-selector:selectedWalletId', 'sender')
  await act(async () => root.render(<Harness chain={NonEvmChain.Near} />))
  const config = mocks.setupSelector.mock.calls[0][0]
  expect(config.allowMultipleSelectors).toBe(true)
  await config.storage.setItem('near-wallet-selector:selectedWalletId', 'receiver')
  expect(localStorage.getItem('near-wallet-selector:selectedWalletId')).toBe('sender')
  const [receiver] = await result.wallets[0].connect()
  expect(receiver).toMatchObject({ id: 'meteor', address: 'receiver.near', family: NonEvmChain.Near })
  expect(receiver.family === NonEvmChain.Near && receiver.wallet.signIn).toBe(signIn)
  expect(signOut).not.toHaveBeenCalled()
})

// @vitest-environment happy-dom
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import {
  readBitcoinReceiver,
  useReceiverWalletOptions,
} from 'components/SwapForm/CrossChain/hooks/useReceiverWalletOptions'
import { NonEvmChain } from 'types/crossChain'

const mocks = vi.hoisted(() => ({ setupSelector: vi.fn(), adapters: [] as any[] }))
vi.mock('@near-wallet-selector/core', () => ({ setupWalletSelector: mocks.setupSelector }))
vi.mock('components/Web3Provider/nearWalletConfig', () => ({
  walletSelectorConfig: { network: 'mainnet', modules: [] },
}))
vi.mock('components/Web3Provider/BitcoinProvider', () => ({ useBitcoinWallet: () => ({ availableWallets: [] }) }))
vi.mock('components/Web3Provider/BitcoinProvider/providers/ledger', () => ({ createLedgerProvider: vi.fn() }))
vi.mock('@solana/wallet-standard-wallet-adapter-react', () => ({ useStandardWalletAdapters: () => mocks.adapters }))

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

it('reads a Bitcoin address without writing sender state, subscribing to account changes, or revoking access', async () => {
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
  expect(provider.on).not.toHaveBeenCalled()
  expect(provider.disconnect).not.toHaveBeenCalled()
  expect(provider.switchNetwork).not.toHaveBeenCalled()
})

it('does not change the sender network or globally disconnect OKX to recover a failed receiver read', async () => {
  const disconnect = vi.fn()
  vi.stubGlobal('okxwallet', { bitcoin: { connect: vi.fn().mockResolvedValue(null), disconnect } })
  await expect(readBitcoinReceiver('okx')).rejects.toThrow('Could not read the wallet address')
  expect(disconnect).not.toHaveBeenCalled()

  const switchNetwork = vi.fn()
  vi.stubGlobal('unisat_wallet', { getNetwork: vi.fn().mockResolvedValue('testnet'), switchNetwork })
  await expect(readBitcoinReceiver('unisat')).rejects.toThrow('mainnet')
  expect(switchNetwork).not.toHaveBeenCalled()
})

it('captures a Solana address once without selecting a sender adapter or calling disconnect', async () => {
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
  expect(receiver.address).toBe('receiver-sol')
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
            wallet: async () => ({ type: 'injected', signIn, signOut }),
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
  expect(await result.wallets[0].connect()).toEqual([
    { id: 'meteor', name: 'Meteor', icon: '/meteor.svg', address: 'receiver.near' },
  ])
  expect(signOut).not.toHaveBeenCalled()
})

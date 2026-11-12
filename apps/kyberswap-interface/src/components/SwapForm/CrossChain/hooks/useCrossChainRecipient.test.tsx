// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useEvmRecipient } from 'components/SwapForm/hooks/useEvmRecipient'
import { Chain, NonEvmChain } from 'types/crossChain'

import { useCrossChainRecipient } from './useCrossChainRecipient'

vi.mock('components/SwapForm/hooks/useRecipientAddress', () => ({
  useRecipientAddress: (value: string) => ({
    address: value === 'alice.eth' ? '0xresolved' : value === 'pending.eth' ? undefined : value || undefined,
    loading: value === 'pending.eth',
    error: false,
  }),
}))

const mocks = vi.hoisted(() => ({ account: '0xapp', wallets: undefined as any }))
vi.mock('components/SwapWallets/SwapWalletContext', () => ({ useSwapWallets: () => mocks.wallets }))
vi.mock('@near-wallet-selector/react-hook', () => ({ useWalletSelector: () => ({ signedAccountId: 'global.near' }) }))
vi.mock('@solana/wallet-adapter-react', () => ({ useWallet: () => ({}) }))
vi.mock('components/Web3Provider/BitcoinProvider', () => ({ useBitcoinWallet: () => ({ walletInfo: {} }) }))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ account: mocks.account }) }))
vi.mock('constants/index', () => ({ ZERO_ADDRESS: '0xzero' }))
vi.mock('services/crossChain/utils', () => ({
  BTC_DEFAULT_RECEIVER: 'btc-preview',
  CROSS_CHAIN_FEE_RECEIVER: 'evm-preview',
  CROSS_CHAIN_FEE_RECEIVER_SOLANA: 'sol-preview',
}))
let root: ReturnType<typeof createRoot>
let result: ReturnType<typeof useCrossChainRecipient>
const Harness = ({ from, to }: { from: Chain; to: Chain }) => {
  result = useCrossChainRecipient(from, to)
  return null
}
const render = (from: Chain = 1, to: Chain = NonEvmChain.Near) =>
  act(async () => root.render(<Harness from={from} to={to} />))
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mocks.account = '0xapp'
  mocks.wallets = {
    inputAddress: '0xapp',
    outputAddress: 'receiver.near',
    outputConnection: { address: 'receiver.near' },
  }
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it('derives sender and receiver from connections, with paste owned separately', async () => {
  await render()
  expect(result.sender).toBe('0xapp')
  expect(result.recipient).toBe('receiver.near')
  await act(async () => result.applyRecipient('paste.near'))
  mocks.wallets.outputAddress = 'new.near'
  await render()
  expect(result.recipient).toBe('paste.near')
  expect(result.receiverWallet?.address).toBe('new.near')
  await act(async () => result.selectWalletRecipient())
  expect(result.recipient).toBe('new.near')
  expect(result.pastedRecipient).toBe('paste.near')
})
it('preserves pasted text and collapse state across reverse and back', async () => {
  await render()
  await act(async () => {
    result.applyRecipient('paste.near')
  })
  await act(async () => {
    result.toggleRecipient()
  })
  mocks.wallets = { inputAddress: 'receiver.near', outputAddress: '0xapp', outputConnection: {} }
  await render(NonEvmChain.Near, 1)
  expect(result.recipientInputValue).toBe('paste.near')
  expect(result.hasCustomRecipient).toBe(true)
  mocks.wallets = { inputAddress: '0xapp', outputAddress: 'receiver.near', outputConnection: {} }
  await render()
  expect(result.recipient).toBe('paste.near')
  expect(result.isPastedRecipient).toBe(true)
  expect(result.showRecipientInput).toBe(false)
})
it('does not substitute global wallets for disconnected slots', async () => {
  mocks.wallets.inputAddress = ''
  mocks.wallets.outputAddress = ''
  mocks.wallets.outputConnection = undefined
  await render(NonEvmChain.Near, 1)
  expect(result.sender).toBe('0xzero')
  expect(result.recipient).toBe('')
  expect(result.isReadOnly).toBe(true)
  await act(async () => result.applyRecipient('0xpaste'))
  expect(result.isReadOnly).toBe(true)
})
it('keeps the EVM receiver independent from the app connection for non-EVM input', async () => {
  mocks.wallets.outputAddress = '0xreceiver'
  await render(NonEvmChain.Near, 1)
  mocks.account = '0xchanged'
  await render(NonEvmChain.Near, 1)
  expect(result.recipient).toBe('0xreceiver')
  expect(result.hasCustomRecipient).toBe(false)
})
it('preserves legacy EVM recipient behavior outside the wallet controller', async () => {
  mocks.wallets = undefined
  await render(1, 56)
  expect(result.recipient).toBe('0xapp')
  await act(async () => result.setRecipient('0xcustom'))
  mocks.account = '0xnew'
  await render(1, 56)
  expect(result.recipient).toBe('0xcustom')
  await act(async () => result.selectWalletRecipient())
  expect(result.recipient).toBe('0xnew')
})

it('keeps the EVM input empty until edited while defaulting the receiver to the connected wallet', async () => {
  await render(1, 56)
  expect(result.recipientInputValue).toBe('')
  expect(result.hasCustomRecipient).toBe(false)
  expect(result.showRecipientInput).toBe(false)
  expect(result.receiver).toBe('0xapp')
  expect(result.isReadOnly).toBe(false)

  await act(async () => result.toggleRecipient())
  expect(result.recipientInputValue).toBe('')
  expect(result.receiver).toBe('0xapp')
  await act(async () => result.setRecipient('0xpasted'))
  expect(result.recipientInputValue).toBe('0xpasted')
  expect(result.receiver).toBe('0xpasted')

  mocks.account = '0xnew'
  await render(1, 56)
  expect(result.recipientInputValue).toBe('0xpasted')
  expect(result.receiver).toBe('0xpasted')
  await act(async () => result.selectWalletRecipient())
  expect(result.recipientInputValue).toBe('')
  expect(result.receiver).toBe('0xnew')
})

it.each([
  [1, 56],
  [1, NonEvmChain.Near],
] as const)('applies a recipient and expands the form input for %s to %s', async (from, to) => {
  await render(from, to)
  if (result.showRecipientInput) await act(async () => result.toggleRecipient())
  await act(async () => result.applyRecipient('custom-address'))
  expect(result.recipient).toBe('custom-address')
  expect(result.receiver).toBe('custom-address')
  expect(result.recipientInputValue).toBe('custom-address')
  expect(result.showRecipientInput).toBe(true)
  if (typeof from !== 'number' || typeof to !== 'number') expect(result.isPastedRecipient).toBe(true)
})

it('clearing the EVM input restores the connected wallet', async () => {
  await render(1, 56)
  await act(async () => result.applyRecipient('0xcustom'))
  await act(async () => result.setRecipient(''))
  expect(result.recipient).toBe('0xapp')
  expect(result.recipientInputValue).toBe('')
  expect(result.hasCustomRecipient).toBe(false)
  expect(result.showRecipientInput).toBe(true)
  expect(result.isReadOnly).toBe(false)
})

it('keeps ENS text in the form but uses its resolved address for quotes', async () => {
  await render(1, 56)
  await act(async () => result.applyRecipient('alice.eth'))
  expect(result.recipientInputValue).toBe('alice.eth')
  expect(result.receiver).toBe('0xresolved')
  expect(result.isReadOnly).toBe(false)
  await act(async () => result.setRecipient('pending.eth'))
  expect(result.receiver).not.toBe('0xresolved')
  expect(result.isReadOnly).toBe(true)
})

it('applying an empty recipient restores wallet mode', async () => {
  await render()
  const wallet = result.recipient
  await act(async () => result.applyRecipient('paste.near'))
  await act(async () => result.applyRecipient(''))
  expect(result.recipient).toBe(wallet)
  expect(result.hasCustomRecipient).toBe(false)
})

it('shares one EVM recipient draft across both quote modes', async () => {
  let shared: ReturnType<typeof useEvmRecipient>
  const SharedForm = ({ to }: { to: Chain }) => {
    shared = useEvmRecipient(mocks.account)
    result = useCrossChainRecipient(1, to, shared)
    return null
  }
  await act(async () => root.render(<SharedForm to={1} />))
  await act(async () => shared.applyRecipient('0xcustom'))
  await act(async () => root.render(<SharedForm to={8453} />))
  expect(result.recipient).toBe('0xcustom')
  expect(result.showRecipientInput).toBe(true)
  await act(async () => result.setRecipient('0xupdated'))
  await act(async () => root.render(<SharedForm to={1} />))
  expect(result.recipientInputValue).toBe('0xupdated')
})

// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { Chain, NonEvmChain } from 'types/crossChain'

import { useCrossChainRecipient } from './useCrossChainRecipient'

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
it('keeps one paste address and collapse state unchanged across reverse and back', async () => {
  await render()
  await act(async () => {
    result.applyRecipient('paste.near')
  })
  await act(async () => {
    result.toggleRecipient()
  })
  mocks.wallets = { inputAddress: 'receiver.near', outputAddress: '0xapp', outputConnection: {} }
  await render(NonEvmChain.Near, 1)
  expect(result.recipient).toBe('paste.near')
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
it.each([NonEvmChain.Near, NonEvmChain.Bitcoin, NonEvmChain.Solana])(
  'keeps EVM receiver independent from app connection for %s input',
  async from => {
    mocks.wallets.outputAddress = '0xreceiver'
    await render(from, 1)
    mocks.account = '0xchanged'
    await render(from, 1)
    expect(result.recipient).toBe('0xreceiver')
    expect(result.canUseMyWallet).toBe(false)
  },
)
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

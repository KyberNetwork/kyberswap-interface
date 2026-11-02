// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useCrossChainRecipient } from 'components/SwapForm/CrossChain/hooks/useCrossChainRecipient'
import { ReceiverWallet } from 'components/SwapForm/CrossChain/receiverWallet'
import { Chain, NonEvmChain } from 'types/crossChain'

const mocks = vi.hoisted(() => ({ sender: 'sender-address', account: '0xsender' }))
vi.mock('@near-wallet-selector/react-hook', () => ({ useWalletSelector: () => ({ signedAccountId: mocks.sender }) }))
vi.mock('@solana/wallet-adapter-react', () => ({ useWallet: () => ({ publicKey: { toString: () => mocks.sender } }) }))
vi.mock('components/Web3Provider/BitcoinProvider', () => ({
  useBitcoinWallet: () => ({ walletInfo: { address: mocks.sender } }),
}))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ account: mocks.account }) }))
vi.mock('constants/index', () => ({ ZERO_ADDRESS: '0xzero' }))
vi.mock('pages/Swap/crossChain/utils', () => ({
  BTC_DEFAULT_RECEIVER: 'btc-default',
  CROSS_CHAIN_FEE_RECEIVER: 'evm-default',
  CROSS_CHAIN_FEE_RECEIVER_SOLANA: 'sol-default',
}))

let root: ReturnType<typeof createRoot>
let recipient: ReturnType<typeof useCrossChainRecipient>
const wallet = (address: string): ReceiverWallet => ({ id: 'wallet', name: 'Wallet', icon: '/wallet.svg', address })
const Harness = ({ chain = NonEvmChain.Near, fromChain = chain }: { chain?: Chain; fromChain?: Chain }) => {
  recipient = useCrossChainRecipient(fromChain, chain)
  return null
}

beforeEach(() => {
  localStorage.clear()
  mocks.sender = 'sender-address'
  mocks.account = '0xsender'
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
  localStorage.clear()
})

it.each([NonEvmChain.Near, NonEvmChain.Solana, NonEvmChain.Bitcoin])(
  'owns sender, connected receiver, and pasted receiver separately for %s',
  async chain => {
    await act(async () => root.render(<Harness chain={chain} />))
    expect(recipient.sender).toBe('sender-address')
    expect(recipient.recipient).toBe('')
    expect(recipient.pastedRecipient).toBe('')

    await act(async () => recipient.connectReceiverWallet(wallet('receiver-address')))
    expect(recipient.sender).toBe('sender-address')
    expect(recipient.recipient).toBe('receiver-address')
    expect(recipient.pastedRecipient).toBe('')

    await act(async () => recipient.applyRecipient('pasted-address'))
    mocks.sender = 'new-sender-address'
    await act(async () => root.render(<Harness chain={chain} />))
    expect(recipient.sender).toBe('new-sender-address')
    expect(recipient.receiverWallet?.address).toBe('receiver-address')
    expect(recipient.receiver).toBe('pasted-address')

    mocks.sender = ''
    await act(async () => root.render(<Harness chain={chain} />))
    await act(async () => recipient.selectWalletRecipient())
    expect(recipient.receiver).toBe('receiver-address')
    expect(recipient.pastedRecipient).toBe('pasted-address')
    expect(recipient.showNonEvmRecipient).toBe(false)

    await act(async () => recipient.disconnectReceiverWallet())
    expect(recipient.recipient).toBe('')
    expect(recipient.pastedRecipient).toBe('pasted-address')
    await act(async () => recipient.applyRecipient(recipient.pastedRecipient))
    await act(async () => recipient.disconnectReceiverWallet())
    expect(recipient.receiver).toBe('pasted-address')
    expect(recipient.showNonEvmRecipient).toBe(true)
  },
)

it('uses an explicit mode even when all three addresses are identical', async () => {
  await act(async () => root.render(<Harness />))
  await act(async () => recipient.connectReceiverWallet(wallet(mocks.sender)))
  await act(async () => recipient.applyRecipient(mocks.sender))
  expect(recipient.showNonEvmRecipient).toBe(true)
  await act(async () => recipient.selectWalletRecipient())
  expect(recipient.showNonEvmRecipient).toBe(false)
  expect(recipient.pastedRecipient).toBe(mocks.sender)
  await act(async () => recipient.disconnectReceiverWallet())
  expect(recipient.sender).toBe(mocks.sender)
  expect(recipient.recipient).toBe('')
})

it('keeps each chain and collapse state through A to B to A and expands on Apply', async () => {
  await act(async () => root.render(<Harness />))
  await act(async () => recipient.connectReceiverWallet(wallet('receiver.near')))
  await act(async () => recipient.applyRecipient('pasted.near'))
  await act(async () => recipient.toggleRecipient())
  expect(recipient.receiver).toBe('pasted.near')
  await act(async () => root.render(<Harness chain={NonEvmChain.Solana} />))
  expect(recipient.recipient).toBe('')
  await act(async () => recipient.connectReceiverWallet(wallet('receiver-sol')))
  await act(async () => root.render(<Harness />))
  expect(recipient.receiver).toBe('pasted.near')
  expect(recipient.receiverWallet?.address).toBe('receiver.near')
  expect(recipient.showRecipientInput).toBe(false)
  await act(async () => recipient.applyRecipient('next.near'))
  expect(recipient.showRecipientInput).toBe(true)
  await act(async () => recipient.connectReceiverWallet(wallet('new.near')))
  expect(recipient.receiver).toBe('new.near')
  expect(recipient.pastedRecipient).toBe('next.near')
})

it('restores only the saved receiver wallet after F5, independently of sender and paste', async () => {
  localStorage.setItem('bitcoinWallet', 'unisat')
  await act(async () => root.render(<Harness />))
  await act(async () => recipient.connectReceiverWallet(wallet('receiver.near')))
  await act(async () => recipient.applyRecipient('pasted.near'))
  await act(async () => root.render(null))
  mocks.sender = 'different-sender'
  await act(async () => root.render(<Harness />))
  expect(recipient.sender).toBe('different-sender')
  expect(recipient.receiverWallet).toEqual(wallet('receiver.near'))
  expect(recipient.receiver).toBe('receiver.near')
  expect(recipient.pastedRecipient).toBe('')
  expect(recipient.showNonEvmRecipient).toBe(false)
  await act(async () => recipient.disconnectReceiverWallet())
  await act(async () => root.render(null))
  await act(async () => root.render(<Harness />))
  expect(recipient.recipient).toBe('')
  expect(localStorage.getItem('bitcoinWallet')).toBe('unisat')
})

it.each([56, NonEvmChain.Near, NonEvmChain.Solana, NonEvmChain.Bitcoin])(
  'resolves EVM receivers independently of source %s, account changes, and collapse',
  async fromChain => {
    await act(async () => root.render(<Harness chain={1} fromChain={fromChain} />))
    expect(recipient.recipientMode).toBe('evm')
    expect(recipient.recipient).toBe('0xsender')
    await act(async () => recipient.toggleRecipient())
    expect(recipient.recipient).toBe('0xsender')
    await act(async () => recipient.setRecipient('0xreceiver'))
    await act(async () => recipient.toggleRecipient())
    expect(recipient.showRecipientInput).toBe(false)
    expect(recipient.receiver).toBe('0xreceiver')
    mocks.account = '0xchanged'
    await act(async () => root.render(<Harness chain={1} fromChain={fromChain} />))
    expect(recipient.receiver).toBe('0xreceiver')
    expect(recipient.canUseMyWallet).toBe(true)
    await act(async () => recipient.selectWalletRecipient())
    expect(recipient.receiver).toBe('0xchanged')
    expect(recipient.canUseMyWallet).toBe(false)
    mocks.account = ''
    await act(async () => root.render(<Harness chain={1} fromChain={fromChain} />))
    expect(recipient.recipient).toBe('')
    expect(recipient.isReadOnly).toBe(true)
    await act(async () => recipient.setRecipient('0xcustom'))
    mocks.account = '0xreconnected'
    await act(async () => root.render(<Harness chain={1} fromChain={fromChain} />))
    expect(recipient.receiver).toBe('0xcustom')
    await act(async () => recipient.setRecipient(''))
    expect(recipient.recipient).toBe('')
    expect(recipient.isReadOnly).toBe(true)
  },
)

it('keeps EVM custom and non-EVM wallet/paste separate across destination changes', async () => {
  await act(async () => root.render(<Harness chain={1} fromChain={56} />))
  await act(async () => recipient.setRecipient('0xcustom'))
  await act(async () => root.render(<Harness chain={NonEvmChain.Near} fromChain={56} />))
  expect(recipient.recipientMode).toBe('nonEvm')
  expect(recipient.recipient).toBe('')
  await act(async () => recipient.connectReceiverWallet(wallet('receiver.near')))
  await act(async () => recipient.applyRecipient('paste.near'))
  await act(async () => root.render(<Harness chain={1} fromChain={56} />))
  expect(recipient.receiver).toBe('0xcustom')
  await act(async () => root.render(<Harness chain={NonEvmChain.Near} fromChain={56} />))
  expect(recipient.receiver).toBe('paste.near')
  expect(recipient.receiverWallet?.address).toBe('receiver.near')
})

it('marks placeholder recipient and sender quotes as read-only until both sides are selected', async () => {
  await act(async () => root.render(<Harness />))
  expect(recipient.isReadOnly).toBe(true)
  await act(async () => recipient.connectReceiverWallet(wallet('receiver.near')))
  expect(recipient.isReadOnly).toBe(false)
  await act(async () => recipient.applyRecipient(''))
  expect(recipient.isReadOnly).toBe(true)
  await act(async () => recipient.applyRecipient('pasted.near'))
  expect(recipient.isReadOnly).toBe(false)
  mocks.sender = ''
  await act(async () => root.render(<Harness />))
  expect(recipient.receiver).toBe('pasted.near')
  expect(recipient.isReadOnly).toBe(true)
})

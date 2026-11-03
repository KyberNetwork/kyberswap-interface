// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import type { SwapWalletConnection } from 'components/SwapForm/CrossChain/walletConnection'
import { Chain, NonEvmChain } from 'types/crossChain'

import { useSwapWallets } from './SwapWalletContext'
import { SwapWalletProvider } from './SwapWalletProvider'

const mocks = vi.hoisted(() => ({
  account: '0xapp',
  modal: undefined as any,
  openApp: vi.fn(),
  solana: {} as any,
  bitcoin: {} as any,
  config: {} as any,
}))
vi.mock('hooks', () => ({
  useActiveWeb3React: () => ({ account: mocks.account }),
  useWeb3React: () => ({ connector: mocks.config.state.connections.get(mocks.config.state.current)?.connector }),
}))
vi.mock('wagmi', () => ({ useConfig: () => mocks.config }))
vi.mock('@near-wallet-selector/react-hook', () => ({ useWalletSelector: () => ({}) }))
vi.mock('@solana/wallet-adapter-react', () => ({ useWallet: () => mocks.solana }))
vi.mock('components/Web3Provider/BitcoinProvider', () => ({ useBitcoinWallet: () => mocks.bitcoin }))
vi.mock('state/application/hooks', () => ({ useWalletModalToggle: () => mocks.openApp }))
vi.mock('components/SwapForm/CrossChain/CrossChainReceiverWalletModal', () => ({
  CrossChainReceiverWalletModal: (props: any) => {
    mocks.modal = props
    return null
  },
}))

let root: ReturnType<typeof createRoot>
let wallets: NonNullable<ReturnType<typeof useSwapWallets>>
const Harness = () => {
  const context = useSwapWallets()
  if (!context) throw new Error('Missing swap wallet provider')
  wallets = context
  return null
}
const render = (input: Chain, output: Chain) =>
  act(async () =>
    root.render(
      <SwapWalletProvider inputChain={input} outputChain={output}>
        <Harness />
      </SwapWalletProvider>,
    ),
  )
const connector = (id: string) => ({ id, uid: id, name: id, emitter: { on: vi.fn(), off: vi.fn() } })
const session = (family: NonEvmChain, initial: string) => {
  let address = initial
  const listeners = new Set<() => void>()
  const wallet = { connect: vi.fn(), sendBitcoin: vi.fn(), signAndSendTransactions: vi.fn() }
  const connection = {
    family,
    wallet,
    id: initial,
    name: initial,
    icon: '',
    address: initial,
    derivationPath: "m/84'/0'/1'/0/0",
    getPublicKey: () => 'btc-key',
    getAddress: () => address,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  } as unknown as SwapWalletConnection
  return {
    connection,
    wallet,
    change: (next: string) => {
      address = next
      listeners.forEach(listener => listener())
    },
  }
}
const choose = async (side: 'input' | 'output', connection: SwapWalletConnection) => {
  await act(async () => (side === 'input' ? wallets.connectInput() : wallets.connectOutput()))
  expect(mocks.modal).toBeDefined()
  await act(async () => {
    mocks.modal.onSelect(connection)
    mocks.modal.onDismiss()
  })
}
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mocks.account = '0xapp'
  mocks.modal = undefined
  mocks.solana = {}
  mocks.bitcoin = { walletInfo: {} }
  const app = connector('app')
  mocks.config = {
    subscribe: () => () => undefined,
    state: { connections: new Map([[app.uid, { connector: app, accounts: ['0xapp'], chainId: 1 }]]), current: app.uid },
    _internal: { events: { connect: vi.fn(), change: vi.fn(), disconnect: vi.fn() } },
    setState(update: any) {
      this.state = update(this.state)
      mocks.account = this.state.connections.get(this.state.current)?.accounts[0] || ''
    },
  }
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it('swaps retained sessions synchronously and preserves Ledger signer/path across a round trip', async () => {
  const btc = session(NonEvmChain.Bitcoin, 'ledger-address')
  await render(1, NonEvmChain.Bitcoin)
  await choose('output', btc.connection)
  const evm = wallets.inputConnection
  await act(async () => {
    wallets.reverseConnections()
  })
  await render(NonEvmChain.Bitcoin, 1)
  expect(wallets.inputConnection).toBe(btc.connection)
  expect(wallets.inputAddress).toBe('ledger-address')
  expect(wallets.outputConnection).toBe(evm)
  await act(async () => {
    wallets.reverseConnections()
  })
  await render(1, NonEvmChain.Bitcoin)
  expect(wallets.outputConnection).toBe(btc.connection)
  expect(wallets.outputConnection?.derivationPath).toBe("m/84'/0'/1'/0/0")
  expect(btc.wallet.connect).not.toHaveBeenCalled()
})
it('does not borrow a global default when reversing an empty output into input', async () => {
  mocks.solana = {
    wallet: {
      adapter: {
        name: 'Global Solana',
        icon: '',
        publicKey: { toString: () => 'global-sol' },
        on: vi.fn(),
        off: vi.fn(),
      },
    },
  }
  await render(1, NonEvmChain.Solana)
  await act(async () => wallets.reverseConnections())
  await render(NonEvmChain.Solana, 1)
  expect(wallets.inputConnection).toBeUndefined()
  expect(wallets.inputAddress).toBe('')
  expect(wallets.outputAddress).toBe('0xapp')
})
it('activates the independently chosen EVM receiver only when it becomes input', async () => {
  const receiverConnector = connector('receiver')
  const { evmConnection } = await import('components/SwapForm/CrossChain/readEvmReceiver')
  const receiver = evmConnection(receiverConnector as any, mocks.config, {
    connector: receiverConnector,
    accounts: ['0xreceiver'],
    chainId: 1,
  } as any)
  await render(NonEvmChain.Near, 1)
  await choose('output', receiver)
  expect(mocks.account).toBe('0xapp')
  await act(async () => wallets.reverseConnections())
  await render(1, NonEvmChain.Near)
  expect(mocks.account).toBe('0xreceiver')
  expect(wallets.inputAddress).toBe('0xreceiver')
  await act(async () => wallets.disconnectInput())
  expect(wallets.inputAddress).toBe('')
  expect(mocks.config.state.current).toBe(null)
})
it('follows a new app EVM account while preserving the independently connected output', async () => {
  const near = session(NonEvmChain.Near, 'receiver.near')
  await render(1, NonEvmChain.Near)
  await choose('output', near.connection)
  mocks.account = '0xchanged'
  const current = mocks.config.state.connections.get('app')
  mocks.config.state.connections.set('app', { ...current, accounts: ['0xchanged'] })
  await render(1, NonEvmChain.Near)
  expect(wallets.inputAddress).toBe('0xchanged')
  expect(wallets.outputConnection).toBe(near.connection)
})
it('tracks live changes and disconnect without falling back to another wallet', async () => {
  const sol = session(NonEvmChain.Solana, 'sol-selected')
  await render(NonEvmChain.Solana, 1)
  await choose('input', sol.connection)
  await act(async () => sol.change('sol-new'))
  expect(wallets.inputAddress).toBe('sol-new')
  await act(async () => sol.change(''))
  expect(wallets.inputAddress).toBe('')
  await act(async () => wallets.disconnectInput())
  expect(wallets.inputConnection).toBeUndefined()
})
it('keeps EVM-to-EVM reversal on the existing app wallet', async () => {
  await render(1, 56)
  await act(async () => wallets.reverseConnections())
  await render(56, 1)
  expect(mocks.account).toBe('0xapp')
  expect(wallets.inputAddress).toBe('0xapp')
})

it('releases owned resources only on replacement/disconnect, never while reversing', async () => {
  const btc = session(NonEvmChain.Bitcoin, 'ledger-address')
  const release = vi.fn().mockResolvedValue(undefined)
  btc.connection.release = release
  await render(1, NonEvmChain.Bitcoin)
  await choose('output', btc.connection)
  await act(async () => wallets.reverseConnections())
  await render(NonEvmChain.Bitcoin, 1)
  expect(release).not.toHaveBeenCalled()
  await act(async () => wallets.disconnectInput())
  expect(release).toHaveBeenCalledOnce()
  expect(wallets.inputAddress).toBe('')
})

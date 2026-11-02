// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { Chain, NonEvmChain } from 'pages/Swap/crossChain/adapters/types'

import { useHistoryWallet } from './HistoryPanel'

const wallets = vi.hoisted(() => ({
  evm: '0xEVM',
  solana: 'SolanaSender',
  bitcoin: 'BitcoinSender',
  near: 'sender.near',
}))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ account: wallets.evm }) }))
vi.mock('@solana/wallet-adapter-react', () => ({ useWallet: () => ({ publicKey: wallets.solana }) }))
vi.mock('@near-wallet-selector/react-hook', () => ({ useWalletSelector: () => ({ signedAccountId: wallets.near }) }))
vi.mock('components/Web3Provider/BitcoinProvider', () => ({
  useBitcoinWallet: () => ({ walletInfo: { address: wallets.bitcoin } }),
}))
vi.mock('pages/Swap/crossChain/transactions/useUnifiedTransactionHistory', () => ({
  useUnifiedTransactionHistory: vi.fn(),
}))
let root: ReturnType<typeof createRoot>
let selected: string
const Harness = ({ chain }: { chain: Chain }) => {
  selected = useHistoryWallet(chain)
  return null
}
const render = (chain: Chain) => act(async () => root.render(<Harness chain={chain} />))
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  Object.assign(wallets, { evm: '0xEVM', solana: 'SolanaSender', bitcoin: 'BitcoinSender', near: 'sender.near' })
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it('defaults to EVM even when unrelated non-EVM wallets are connected', async () => {
  await render(1)
  expect(selected).toBe('0xevm')
  await render(8453)
  expect(selected).toBe('0xevm')
  wallets.evm = ''
  await render(1)
  expect(selected).toBe('')
})

it.each([
  [NonEvmChain.Solana, 'solana', 'SolanaSender'],
  [NonEvmChain.Bitcoin, 'bitcoin', 'BitcoinSender'],
  [NonEvmChain.Near, 'near', 'sender.near'],
] as const)(
  'prefers the connected input sender for %s and falls back to EVM on disconnect',
  async (chain, family, address) => {
    await render(chain)
    expect(selected).toBe(address)
    wallets[family] = 'NewSender'
    await render(chain)
    expect(selected).toBe('NewSender')
    wallets[family] = ''
    await render(chain)
    expect(selected).toBe('0xevm')
    wallets.evm = ''
    await render(chain)
    expect(selected).toBe('')
  },
)

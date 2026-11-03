// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useHistoryWallet } from 'pages/Swap/transactions/HistoryPanel'
import { Chain, NonEvmChain } from 'types/crossChain'

const wallets = vi.hoisted(() => ({
  selected: undefined as any,
  evm: '0xEVM',
  solana: 'SolanaSender',
  bitcoin: 'BitcoinSender',
  near: 'sender.near',
}))
vi.mock('pages/Swap/SwapWalletContext', () => ({ useSwapWallets: () => wallets.selected }))
vi.mock('pages/Swap/transactions/useHistoryPagination', () => ({
  useHistoryPagination: vi.fn(),
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
  wallets.selected = undefined
  Object.assign(wallets, { evm: '0xEVM', solana: 'SolanaSender', bitcoin: 'BitcoinSender', near: 'sender.near' })
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it.each([1, NonEvmChain.Near, NonEvmChain.Solana, NonEvmChain.Bitcoin])(
  'uses only the input slot for history on %s and stays empty after disconnect',
  async chain => {
    wallets.selected = { inputAddress: 'SelectedSender' }
    await render(chain)
    expect(selected).toBe(typeof chain === 'number' ? 'selectedsender' : 'SelectedSender')
    wallets.selected.inputAddress = ''
    await render(chain)
    expect(selected).toBe('')
  },
)

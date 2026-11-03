// @vitest-environment happy-dom
import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { BackendTransaction } from 'services/crossChainTransactions'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { ZERO_ADDRESS } from 'constants/index'
import TransactionHistoryList from 'pages/Swap/transactions/TransactionHistoryList'
import { type HistoryTransaction, mergeTransactionHistory } from 'pages/Swap/transactions/history'
import type { Currency } from 'types/crossChain'

const lookup = vi.hoisted(() => ({ evm: vi.fn(), solana: vi.fn(), near: vi.fn() }))
vi.mock('hooks/useTokens', () => ({ useCurrencyLookup: lookup.evm }))
vi.mock('pages/Swap/crossChain/hooks/useSolanaTokens', () => ({ useSolanaTokens: lookup.solana }))
vi.mock('pages/Swap/crossChain/adapters/NearIntentsAdapter/useNearIntentsTokens', () => ({
  useNearIntentsTokens: lookup.near,
}))
vi.mock('react-use', () => ({ useMedia: () => false }))
vi.mock('pages/Swap/crossChain/factory', () => ({
  registry: { getAdapter: () => undefined },
}))
vi.mock('pages/Swap/crossChain/utils', () => ({ normalizeAdapterName: (name: string) => name }))
vi.mock('pages/Swap/crossChain/components/GasDropTransactionLine', () => ({ GasDropTransactionLine: () => null }))
vi.mock('pages/Swap/crossChain/components/TokenLogoWithChain', () => ({ TokenLogoWithChain: () => null }))
vi.mock('components/Copy', () => ({ default: () => null }))

const address = '0x1111111111111111111111111111111111111111'
const usdc = new Token(ChainId.MAINNET, address, 6, 'USDC')
const backend: BackendTransaction = {
  id: 'history-id',
  quoteId: 'quote',
  sourceTxHash: 'source',
  sender: 'sender',
  provider: 'Relay',
  fromChain: 'ethereum',
  toChain: 'solana',
  fromToken: address,
  toToken: 'sol-token',
  fromAmount: '1234500',
  quotedOutput: '2500000000',
  quotedMinOutput: '2400000000',
  actualOutput: '2500000000',
  verification: 'verified',
  status: 'success',
  destTxHash: 'destination',
  recipient: 'recipient',
  inputUsd: null,
  outputUsd: null,
  timeEstimate: 60,
  createdAt: '2026-10-27T00:00:00Z',
  completedAt: null,
  expiredAt: null,
}
const rows = (patch: Partial<BackendTransaction> = {}) =>
  mergeTransactionHistory({
    server: [{ ...backend, ...patch }],
    local: [],
    sender: backend.sender,
  })
let root: ReturnType<typeof createRoot>
let container: HTMLDivElement
const render = (transactions = rows(), filter = '') =>
  act(async () => root.render(<TransactionHistoryList transactions={transactions} filter={filter} />))
const renderedRows = () => container.querySelector('.peer') as HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  lookup.evm.mockReset().mockImplementation((id: string) => ({ currency: id === address ? usdc : undefined }))
  lookup.solana.mockReset().mockReturnValue({ solanaTokens: [{ id: 'sol-token', decimals: 9, symbol: 'SOL' }] })
  lookup.near.mockReset().mockReturnValue({ nearTokens: [] })
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it('keeps API token IDs in history and uses existing hooks to format EVM/Solana amounts', async () => {
  expect(rows()[0].sourceToken).toBe(address)
  await render()
  expect(renderedRows().textContent).toContain('-1.2345 USDC')
  expect(renderedRows().textContent).toContain('+2.5 SOL')
})

it('renders same-chain swaps with both chain endpoints and one transaction action', async () => {
  await render(rows({ toChain: 'ethereum', toToken: address, destTxHash: 'source', actualOutput: '2500000' }))
  expect(renderedRows().textContent).toContain('Tx Hash:')
  expect(renderedRows().textContent).not.toContain('Deposit:')
  expect(renderedRows().textContent).not.toContain('Fill:')
  expect(renderedRows().textContent).toContain('-1.2345 USDC')
  expect(renderedRows().textContent).toContain('+2.5 USDC')
  expect(renderedRows().querySelectorAll('a')).toHaveLength(1)
  const chainLogos = renderedRows().querySelectorAll('img[alt="Ethereum"]')
  expect(chainLogos).toHaveLength(2)
  expect(chainLogos[0].nextElementSibling?.tagName.toLowerCase()).toBe('svg')
  expect(chainLogos[0].nextElementSibling?.nextElementSibling).toBe(chainLogos[1])
})

it('keeps incomplete indexed swaps visible without inventing token metadata', async () => {
  await render(rows({ fromToken: '', toToken: '', fromAmount: '0', actualOutput: '0' }))
  expect(renderedRows().textContent).toContain('Unknown token')
  expect(renderedRows().textContent).not.toContain('+0 SOL')
})

it('keeps filtered rows mounted for lookup and shows a symbol match once metadata arrives', async () => {
  lookup.evm.mockReturnValue({ currency: undefined })
  await render(rows(), 'usdc')
  expect(renderedRows().textContent).toBe('')
  lookup.evm.mockReturnValue({ currency: usdc })
  await render(rows(), 'usdc')
  expect(renderedRows().textContent).toContain('USDC')
  await render(rows(), 'not-a-token')
  expect(renderedRows().textContent).toBe('')
  await render(rows(), address)
  expect(renderedRows().textContent).toContain('USDC')
})

it('preserves local Currency objects and never formats unresolved IDs with invented decimals', async () => {
  const local: HistoryTransaction = { ...rows()[0], sourceToken: usdc }
  lookup.evm.mockReturnValue({ currency: undefined })
  await render([local])
  expect(renderedRows().textContent).toContain('-1.2345 USDC')
  await render(rows())
  expect(renderedRows().textContent).toContain('--- 0x1111')
})

it('resolves NEAR/BTC and keeps zero-address native-token searches working after lookup', async () => {
  lookup.near.mockReturnValue({
    nearTokens: [{ blockchain: 'near', assetId: 'near', contractAddress: '', symbol: 'NEAR', decimals: 24 }],
  })
  await render(
    rows({
      fromChain: 'near',
      fromToken: 'near',
      fromAmount: '1000000000000000000000000',
      toChain: 'bitcoin',
      toToken: 'btc',
      actualOutput: '100000000',
    }),
  )
  expect(renderedRows().textContent).toContain('-1 NEAR')
  expect(renderedRows().textContent).toContain('+1 BTC')

  lookup.evm.mockReturnValue({ currency: { decimals: 18, symbol: 'ETH' } as Currency })
  await render(rows({ fromToken: ZERO_ADDRESS, fromAmount: '1000000000000000000', actualOutput: '0' }), ZERO_ADDRESS)
  expect(renderedRows().textContent).toContain('-1 ETH')
  expect(renderedRows().textContent).toContain('+0 SOL')
})

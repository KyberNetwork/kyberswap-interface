// @vitest-environment happy-dom
import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { BackendTransaction } from 'services/crossChainTransactions'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import type { Currency } from 'pages/Swap/crossChain/adapters/types'
import { type HistoryTransaction, mergeTransactionHistory } from 'pages/Swap/crossChain/transactions/history'

import TransactionHistoryList from './TransactionHistoryList'

const lookup = vi.hoisted(() => ({ evm: vi.fn(), solana: vi.fn(), near: vi.fn() }))
vi.mock('hooks/useTokens', () => ({ useCurrencyLookup: lookup.evm }))
vi.mock('pages/Swap/crossChain/hooks/useSolanaTokens', () => ({ useSolanaTokens: lookup.solana }))
vi.mock('pages/Swap/crossChain/adapters/NearIntentsAdapter/useNearIntentsTokens', () => ({
  useNearIntentsTokens: lookup.near,
}))
vi.mock('react-use', () => ({ useMedia: () => false }))
vi.mock('pages/Swap/crossChain/factory', () => ({
  registry: { getAdapter: () => undefined },
  CrossChainSwapFactory: { getKyberCrossBridgeSource: () => undefined },
}))
vi.mock('pages/Swap/crossChain/utils', () => ({ normalizeAdapterName: (name: string) => name }))
vi.mock('./GasDrop', () => ({ GasDropTransactionLine: () => null }))
vi.mock('./TokenLogoWithChain', () => ({ TokenLogoWithChain: () => null }))
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
  expect(lookup.evm).toHaveBeenCalledWith(address, ChainId.MAINNET)
  expect(lookup.solana).toHaveBeenCalledWith('sol-token', false)
})

it('keeps filtered rows mounted for lookup and shows a symbol match once metadata arrives', async () => {
  lookup.evm.mockReturnValue({ currency: undefined })
  await render(rows(), 'usdc')
  expect(renderedRows().children).toHaveLength(0)
  lookup.evm.mockReturnValue({ currency: usdc })
  await render(rows(), 'usdc')
  expect(renderedRows().children).toHaveLength(1)
  expect(renderedRows().textContent).toContain('USDC')
  await render(rows(), 'not-a-token')
  expect(renderedRows().children).toHaveLength(0)
  await render(rows(), address)
  expect(renderedRows().children).toHaveLength(1)
})

it('preserves local Currency objects and never formats unresolved IDs with invented decimals', async () => {
  const local: HistoryTransaction = { ...rows()[0], sourceToken: usdc }
  lookup.evm.mockReturnValue({ currency: undefined })
  await render([local])
  expect(renderedRows().textContent).toContain('-1.2345 USDC')
  expect(lookup.evm).not.toHaveBeenCalledWith(address, ChainId.MAINNET)
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
  expect(lookup.near).toHaveBeenCalledWith(false)

  lookup.evm.mockReturnValue({ currency: { decimals: 18, symbol: 'ETH' } as Currency })
  await render(rows({ fromToken: ZERO_ADDRESS, fromAmount: '1000000000000000000', actualOutput: '0' }), ZERO_ADDRESS)
  expect(lookup.evm).toHaveBeenCalledWith(ETHER_ADDRESS, ChainId.MAINNET)
  expect(renderedRows().textContent).toContain('-1 ETH')
  expect(renderedRows().textContent).toContain('+0 SOL')
})

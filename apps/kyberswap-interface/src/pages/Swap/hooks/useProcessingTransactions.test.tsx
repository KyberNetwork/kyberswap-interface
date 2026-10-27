// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { BackendTransaction } from 'services/crossChainTransactions'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { NonEvmChain, type NormalizedTxResponse } from 'pages/CrossChainSwap/adapters/types'

import { useProcessingTransactions } from './useProcessingTransactions'

let account: string | undefined
let solana: string | undefined
let local: NormalizedTxResponse[]
let server: BackendTransaction[]
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ account }) }))
vi.mock('@solana/wallet-adapter-react', () => ({ useWallet: () => ({ publicKey: solana }) }))
vi.mock('@near-wallet-selector/react-hook', () => ({ useWalletSelector: () => ({}) }))
vi.mock('components/Web3Provider/BitcoinProvider', () => ({ useBitcoinWallet: () => ({}) }))
vi.mock('state/crossChainSwap', () => ({ useCrossChainTransactions: () => local }))
vi.mock('state/hooks', () => ({ useAppSelector: () => server }))
vi.mock('services/crossChainTransactions', () => ({ selectBackendTransactions: vi.fn() }))

const row = (id: number, overrides: Partial<NormalizedTxResponse> = {}): NormalizedTxResponse => ({
  id: String(id),
  sourceTxHash: `hash-${id}`,
  sourceChain: 1,
  targetChain: 8453,
  sender: '0xsender',
  recipient: 'recipient',
  adapter: 'Relay',
  sourceToken: { decimals: 6, symbol: 'USDC' } as NormalizedTxResponse['sourceToken'],
  targetToken: { decimals: 6, symbol: 'USDC' } as NormalizedTxResponse['targetToken'],
  inputAmount: '100',
  outputAmount: '90',
  amountInUsd: 1,
  amountOutUsd: 0.9,
  platformFeePercent: 0,
  timestamp: id,
  status: 'Processing',
  ...overrides,
})
let root: ReturnType<typeof createRoot>
let transactions: ReturnType<typeof useProcessingTransactions>
const Harness = () => {
  transactions = useProcessingTransactions()
  return null
}
const render = () => act(async () => root.render(<Harness />))
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  account = '0xSENDER'
  solana = undefined
  local = []
  server = []
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it('keeps all processing rows newest first, including legacy pending rows, without a three-item data limit', async () => {
  local = [
    row(1),
    row(2),
    row(3),
    row(4, { status: undefined }),
    row(5, { status: 'Success' }),
    row(6, { status: 'Failed' }),
    row(7, { status: 'Refunded' }),
    row(8, { sender: '0xother' }),
  ]
  await render()
  expect(transactions.map(tx => tx.id)).toEqual(['4', '3', '2', '1'])
})

it('removes completed rows as history updates and scopes rows to connected wallets', async () => {
  solana = 'SolanaWallet'
  local = [
    row(1),
    row(2, { sender: solana, sourceChain: NonEvmChain.Solana }),
    row(3, { sender: 'solanawallet', sourceChain: NonEvmChain.Solana }),
  ]
  await render()
  expect(transactions.map(tx => tx.id)).toEqual(['2', '1'])
  local = [row(1, { status: 'Success' }), local[1]]
  await render()
  expect(transactions.map(tx => tx.id)).toEqual(['2'])
  solana = undefined
  account = undefined
  await render()
  expect(transactions).toEqual([])
})

it('deduplicates backend history and lets verified settlement remove a locally processing row', async () => {
  local = [row(1)]
  server = [
    {
      id: 'backend-1',
      quoteId: 'quote-1',
      sourceTxHash: 'hash-1',
      sender: '0xsender',
      recipient: 'recipient',
      fromChain: 'ethereum',
      toChain: 'base',
      fromToken: 'usdc',
      toToken: 'usdc',
      fromAmount: '100',
      quotedOutput: '90',
      quotedMinOutput: '89',
      actualOutput: null,
      destTxHash: null,
      provider: 'relay',
      status: 'in_progress',
      verification: 'verified',
      inputUsd: 1,
      outputUsd: 0.9,
      timeEstimate: 60,
      createdAt: new Date(1).toISOString(),
      completedAt: null,
      expiredAt: null,
    },
  ]
  await render()
  expect(transactions).toHaveLength(1)
  server = [{ ...server[0], status: 'success', actualOutput: '91' }]
  await render()
  expect(transactions).toEqual([])
})

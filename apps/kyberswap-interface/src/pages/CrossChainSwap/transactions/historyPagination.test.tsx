// @vitest-environment happy-dom
import { configureStore } from '@reduxjs/toolkit'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import api, { type BackendTransaction } from 'services/crossChainTransactions'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import type { NormalizedTxResponse } from 'pages/CrossChainSwap/adapters/types'

import { getLoadedHistory } from './history'
import { useUnifiedTransactionHistory } from './useUnifiedTransactionHistory'

let sender: string
vi.mock('constants/env', () => ({ CROSSCHAIN_AGGREGATOR_API: 'https://history.test' }))
vi.mock('state/crossChainSwap', () => ({ useCrossChainTransactions: () => local }))

const timestamp = (n: number) => Date.UTC(2026, 9, 27, 0, 0, n)
const localRow = (n: number): NormalizedTxResponse =>
  ({
    id: `local-${n}`,
    sourceTxHash: `hash-${n}`,
    sender: '0xsender',
    sourceChain: 1,
    targetChain: 8453,
    adapter: 'Relay',
    sourceToken: { decimals: 6, symbol: 'USDC' },
    targetToken: { decimals: 6, symbol: 'USDC' },
    timestamp: timestamp(n),
    inputAmount: '100',
    outputAmount: '90',
    amountInUsd: 1,
    amountOutUsd: 0.9,
    platformFeePercent: 0,
    recipient: 'recipient',
  } as NormalizedTxResponse)
const serverRow = (n: number): BackendTransaction => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  quoteId: `quote-${n}`,
  sourceTxHash: `hash-${n}`,
  sender: '0xsender',
  provider: 'relay',
  fromChain: 'ethereum',
  toChain: 'base',
  fromToken: 'token',
  toToken: 'token',
  fromAmount: '100',
  quotedOutput: '90',
  quotedMinOutput: '89',
  actualOutput: '90',
  inputUsd: 1,
  outputUsd: 0.9,
  timeEstimate: 60,
  recipient: 'recipient',
  destTxHash: null,
  status: 'success',
  verification: 'verified',
  createdAt: new Date(timestamp(n)).toISOString(),
  completedAt: null,
  expiredAt: null,
})
const range = (high: number, low: number) => Array.from({ length: high - low + 1 }, (_, i) => high - i)
const response = (rows: BackendTransaction[], nextCursor: string | null = null) =>
  new Response(JSON.stringify({ code: 0, data: { transactions: rows, nextCursor } }), {
    headers: { 'Content-Type': 'application/json' },
  })
let local: NormalizedTxResponse[]
let root: ReturnType<typeof createRoot>
let history: ReturnType<typeof useUnifiedTransactionHistory>
const createStore = () =>
  configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: getDefault => getDefault().concat(api.middleware),
  })
let store: ReturnType<typeof createStore>
const fetcher = vi.fn()
const Harness = ({ sender }: { sender: string }) => {
  history = useUnifiedTransactionHistory(sender)
  return null
}
const render = () =>
  act(async () =>
    root.render(
      <Provider store={store}>
        <Harness key={sender} sender={sender} />
      </Provider>,
    ),
  )
const waitFor = (assertion: () => void) =>
  act(async () => {
    await vi.waitFor(assertion)
  })
const hashes = () => history.transactions.map(tx => tx.sourceTxHash)
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  sender = '0xsender'
  local = []
  store = createStore()
  root = createRoot(document.createElement('div'))
  fetcher.mockReset().mockImplementation(async () => response([]))
  vi.stubGlobal('fetch', fetcher)
})
afterEach(async () => {
  await act(async () => root.unmount())
  store.dispatch(api.util.resetApiState())
  vi.unstubAllGlobals()
})

it('paginates 25 local rows when the API has no cursor', async () => {
  local = range(25, 1).map(localRow)
  await render()
  await waitFor(() => expect(history.loadingMore).toBe(false))
  expect(hashes()).toEqual(range(25, 16).map(n => `hash-${n}`))
  expect(history.canGoNext).toBe(true)
  await act(async () => history.goNext())
  expect(hashes()).toEqual(range(15, 6).map(n => `hash-${n}`))
  await act(async () => history.goNext())
  expect(hashes()).toEqual(range(5, 1).map(n => `hash-${n}`))
  expect(history.canGoNext).toBe(false)
  await act(async () => history.goPrevious())
  expect(history.currentPage).toBe(2)
  expect(fetcher).toHaveBeenCalledOnce()
  sender = '0xother'
  await render()
  await waitFor(() => expect(history.loadingMore).toBe(false))
  expect(history.currentPage).toBe(1)
  expect(hashes()).toEqual([])
  sender = '0xsender'
  await render()
  expect(history.currentPage).toBe(1)
  expect(hashes()).toEqual(range(25, 16).map(n => `hash-${n}`))
})

it('merges local and API rows before slicing, without duplicates or moving old local rows ahead of unloaded history', async () => {
  local = [localRow(32), localRow(31), localRow(30), localRow(5)]
  fetcher.mockImplementation(async (request: Request) => {
    const cursor = new URL(request.url).searchParams.get('cursor')
    return cursor === 'second'
      ? response(range(20, 11).map(serverRow), 'third')
      : cursor === 'third'
      ? response(range(10, 1).map(serverRow))
      : response(range(30, 21).map(serverRow), 'second')
  })
  await render()
  await waitFor(() => expect(hashes()).toEqual(range(32, 23).map(n => `hash-${n}`)))
  expect(fetcher).toHaveBeenCalledOnce()
  await act(async () => history.goNext())
  expect(hashes()).toEqual(range(22, 13).map(n => `hash-${n}`))
  await act(async () => history.goNext())
  expect(hashes()).toEqual(range(12, 3).map(n => `hash-${n}`))
  await act(async () => history.goNext())
  expect(hashes()).toEqual(['hash-2', 'hash-1'])
  expect(history.canGoNext).toBe(false)
  await act(async () => history.goPrevious())
  expect(hashes()).toEqual(range(12, 3).map(n => `hash-${n}`))
  expect(fetcher).toHaveBeenCalledTimes(3)
})

it('continues across an empty cursor page and clamps after local rows disappear', async () => {
  local = range(25, 1).map(localRow)
  fetcher.mockImplementation(async (request: Request) =>
    new URL(request.url).searchParams.get('cursor') ? response([]) : response([], 'empty'),
  )
  await render()
  await waitFor(() => expect(history.loadingMore).toBe(false))
  await act(async () => history.goNext())
  await act(async () => history.goNext())
  expect(history.currentPage).toBe(3)
  local = [localRow(25)]
  await render()
  expect(history.currentPage).toBe(1)
  expect(hashes()).toEqual(['hash-25'])
})

it('ignores a next-page completion after switching wallets', async () => {
  local = [localRow(32), localRow(31)]
  let release!: (response: Response) => void
  fetcher.mockImplementation(async (request: Request) => {
    const params = new URL(request.url).searchParams
    if (params.get('sender') === '0xother') return response([])
    if (params.has('cursor'))
      return new Promise<Response>(resolve => {
        release = resolve
      })
    return response(range(30, 21).map(serverRow), 'next')
  })
  await render()
  await waitFor(() => expect(history.transactions).toHaveLength(10))
  let next!: Promise<void>
  await act(async () => {
    next = history.goNext()
  })
  await waitFor(() => expect(release).toBeDefined())
  sender = '0xother'
  await render()
  await act(async () => {
    release(response([], 'more-old-wallet-rows'))
    await next
  })
  expect(history.currentPage).toBe(1)
  expect(history.transactions).toEqual([])
  expect(fetcher).toHaveBeenCalledTimes(3)
})

it('does not paginate or request history while disconnected', async () => {
  sender = ''
  local = range(25, 1).map(localRow)
  await render()
  expect(history.transactions).toEqual([])
  expect(history.canGoNext).toBe(false)
  expect(fetcher).not.toHaveBeenCalled()
})

it('holds timestamp ties until the cursor has covered them', () => {
  const row = serverRow(10)
  const page = { transactions: [row], nextCursor: 'next' }
  expect(getLoadedHistory([page], [localRow(10), localRow(9)], [], '0xsender').transactions).toEqual([])
  expect(
    getLoadedHistory([{ ...page, nextCursor: null }], [localRow(10), localRow(9)], [], '0xsender').transactions,
  ).toHaveLength(2)
})

it('keeps settled detail visible after local removal until the list catches up', async () => {
  local = [localRow(30)]
  await render()
  await waitFor(() => expect(history.loadingMore).toBe(false))
  expect(hashes()).toEqual(['hash-30'])

  const settled = { ...serverRow(30), actualOutput: '95' }
  await act(async () => {
    store.dispatch(
      api.util.upsertQueryEntries([
        {
          endpointName: 'getTransaction',
          arg: { sourceTxHash: settled.sourceTxHash, chain: settled.fromChain, quoteId: settled.quoteId },
          value: settled,
        },
      ]),
    )
    local = []
  })
  await render()
  expect(hashes()).toEqual(['hash-30'])
  expect(history.transactions[0]).toMatchObject({ status: 'Success', outputAmount: '95', fromBackend: true })

  fetcher.mockImplementation(async () => response([serverRow(30)]))
  await act(async () => history.refresh())
  await waitFor(() => expect(history.loadingMore).toBe(false))
  expect(hashes()).toEqual(['hash-30'])
  expect(history.transactions[0].outputAmount).toBe('95')
})

it('applies sender and cursor boundaries to unlisted settled details', () => {
  const cached = [
    serverRow(31),
    serverRow(21),
    serverRow(5),
    { ...serverRow(32), sender: '0xother' },
    { ...serverRow(33), status: 'in_progress' as const },
  ]
  const page = { transactions: range(30, 21).map(serverRow), nextCursor: 'next' }
  expect(getLoadedHistory([page], [], cached, '0xsender').transactions.map(tx => tx.sourceTxHash)).toEqual(
    range(31, 22).map(n => `hash-${n}`),
  )
  expect(
    getLoadedHistory([{ ...page, nextCursor: null }], [], cached, '0xsender').transactions.map(tx => tx.sourceTxHash),
  ).toEqual([...range(31, 21).map(n => `hash-${n}`), 'hash-5'])
})

it('keeps the current page on cursor failure and retries without skipping newly loaded rows', async () => {
  let fail = true
  fetcher.mockImplementation(async (request: Request) => {
    if (!new URL(request.url).searchParams.has('cursor')) return response(range(20, 11).map(serverRow), 'next')
    return fail
      ? new Response(JSON.stringify({ code: 4000 }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      : response(range(10, 1).map(serverRow))
  })
  await render()
  await waitFor(() => expect(history.error).toBe(true))
  expect(history.currentPage).toBe(1)
  expect(history.transactions).toHaveLength(9)
  fail = false
  await act(async () => history.goNext())
  expect(history.currentPage).toBe(1)
  expect(hashes()).toEqual(range(20, 11).map(n => `hash-${n}`))
  await act(async () => history.goNext())
  expect(history.currentPage).toBe(2)
  expect(hashes()).toEqual(range(10, 1).map(n => `hash-${n}`))
})

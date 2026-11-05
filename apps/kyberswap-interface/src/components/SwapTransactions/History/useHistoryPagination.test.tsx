// @vitest-environment happy-dom
import { configureStore } from '@reduxjs/toolkit'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import detailApi, { type BackendTransaction } from 'services/crossChainTransactions'
import type { IndexedTransaction } from 'services/walletTransactions'
import api, { useGetTransactionsInfiniteQuerySubscription } from 'services/walletTransactionsApi'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useHistoryPagination } from 'components/SwapTransactions/History/useHistoryPagination'
import TransactionUpdater from 'components/SwapTransactions/TransactionUpdater'
import { getLoadedHistory, localTransactionToHistory } from 'components/SwapTransactions/history'
import type { LocalTransaction } from 'state/crossChainSwap/model'
import { addTransaction, finalizeTransaction } from 'state/transactions/actions'
import transactionsReducer from 'state/transactions/reducer'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import type { NormalizedTxResponse } from 'types/crossChain'

vi.mock('@near-wallet-selector/react-hook', () => ({ useWalletSelector: () => ({}) }))
vi.mock('@solana/wallet-adapter-react', () => ({ useWallet: () => ({}) }))
vi.mock('components/Web3Provider/BitcoinProvider', () => ({ useBitcoinWallet: () => ({}) }))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({}) }))
vi.mock('components/SwapWallets/SwapWalletContext', () => ({
  useSwapWallets: () => ({ inputAddress: sender, inputConnection: { family: 'evm' } }),
}))
vi.mock('state/crossChainSwap/useRestoreMyNearWalletTransaction', () => ({
  useRestoreMyNearWalletTransaction: () => undefined,
}))
vi.mock('state/crossChainSwap/useBackendTransactionUpdater', () => ({
  useBackendTransactionUpdater: () => undefined,
}))
vi.mock('state/crossChainSwap/useProviderTransactionUpdater', () => ({
  useProviderTransactionUpdater: () => undefined,
}))

let sender: string
vi.mock('constants/env', async importOriginal => ({
  ...(await importOriginal<typeof import('constants/env')>()),
  CROSSCHAIN_AGGREGATOR_API: 'https://aggregator.test',
}))

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
const serverRow = (n: number): BackendTransaction & IndexedTransaction => ({
  historyType: 'cross_chain',
  historyWallet: '0xsender',
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
const walletRow = (row: BackendTransaction) => ({
  events: [
    { chainName: row.toChain, rawAmount: row.actualOutput ?? '0', token: row.toToken, wallet: row.recipient },
    { chainName: row.fromChain, rawAmount: `-${row.fromAmount}`, token: row.fromToken, wallet: row.sender },
  ],
  extra: {
    sourceTxHash: row.sourceTxHash,
    quoteId: row.quoteId,
    provider: row.provider,
    verification: row.verification,
    actualOutput: row.actualOutput,
    quotedOutput: row.quotedOutput,
    quotedMinOutput: row.quotedMinOutput,
    destTxHash: row.destTxHash,
  },
  fromChainName: row.fromChain,
  toChainName: row.toChain,
  timestamp: row.createdAt,
  status: row.status,
  wallet: row.sender,
  txType: 'cross_chain',
})
const response = (rows: BackendTransaction[]) =>
  new Response(JSON.stringify({ code: 0, data: rows.map(walletRow) }), {
    headers: { 'Content-Type': 'application/json' },
  })
let autoPoll = false
let local: LocalTransaction[]
let root: ReturnType<typeof createRoot>
let history: ReturnType<typeof useHistoryPagination>
const createStore = () =>
  configureStore({
    reducer: {
      crossChainSwap: (_state: { transactions: LocalTransaction[] } | undefined) => ({ transactions: local }),
      transactions: transactionsReducer,
      [api.reducerPath]: api.reducer,
      [detailApi.reducerPath]: detailApi.reducer,
    },
    middleware: getDefault => getDefault().concat(api.middleware, detailApi.middleware),
    enhancers: getDefault => getDefault({ autoBatch: { type: 'tick' } }),
  })
let store: ReturnType<typeof createStore>
const fetcher = vi.fn()
const Harness = ({ sender }: { sender: string }) => {
  useGetTransactionsInfiniteQuerySubscription(sender, { skip: !sender })
  history = useHistoryPagination(sender)
  return autoPoll ? <TransactionUpdater /> : null
}
const render = () =>
  act(async () => {
    store.dispatch({ type: 'test/syncLocal' })
    root.render(
      <Provider store={store}>
        <Harness key={sender} sender={sender} />
      </Provider>,
    )
  })
const waitFor = (assertion: () => void) =>
  act(async () => {
    await vi.waitFor(assertion)
  })
const hashes = () => history.transactions.map(tx => tx.sourceTxHash)
const hasQueryError = () => api.endpoints.getTransactions.select(sender)(store.getState()).isError
const refetchHistory = () =>
  store.dispatch(api.endpoints.getTransactions.initiate(sender, { subscribe: false, forceRefetch: true }))
beforeEach(() => {
  vi.stubEnv('VITE_KYBER_AI_API_URL', 'https://history.test/api')
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  sender = '0xsender'
  local = []
  autoPoll = false
  store = createStore()
  root = createRoot(document.createElement('div'))
  fetcher.mockReset().mockImplementation(async () => response([]))
  vi.stubGlobal('fetch', fetcher)
})
afterEach(async () => {
  await act(async () => root.unmount())
  store.dispatch(api.util.resetApiState())
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
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
  expect((fetcher.mock.calls[0][0] as Request).url).toEqual(
    expect.stringContaining('/v1/wallets/uni/0xsender/transactions?offset=0&limit=10'),
  )
  sender = '0xother'
  await render()
  await waitFor(() => expect(history.loadingMore).toBe(false))
  expect(history.currentPage).toBe(1)
  expect(hashes()).toEqual([])
  sender = '0xsender'
  await render()
  expect(history.currentPage).toBe(1)
  expect(hashes()).toEqual(range(25, 16).map(n => `hash-${n}`))
  sender = ''
  fetcher.mockClear()
  await render()
  expect(history.transactions).toEqual([])
  expect(history.canGoNext).toBe(false)
  expect(fetcher).not.toHaveBeenCalled()
})

it('merges local and API rows before slicing, without duplicates or moving old local rows ahead of unloaded history', async () => {
  local = [localRow(32), localRow(31), localRow(30), localRow(5)]
  fetcher.mockImplementation(async (request: Request) => {
    const cursor = new URL(request.url).searchParams.get('offset')
    return cursor === '10'
      ? response(range(20, 11).map(serverRow))
      : cursor === '20'
      ? response(range(10, 1).map(serverRow))
      : cursor === '30'
      ? response([])
      : response(range(30, 21).map(serverRow))
  })
  await render()
  await waitFor(() => expect(hashes()).toEqual(range(32, 23).map(n => `hash-${n}`)))
  expect(history.searchTransactions.map(tx => tx.sourceTxHash)).toEqual([
    ...range(32, 21).map(n => `hash-${n}`),
    'hash-5',
  ])
  expect(history.hasMore).toBe(true)
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
  expect(fetcher).toHaveBeenCalledTimes(4)
  expect(fetcher.mock.calls.map(([request]) => new URL(request.url).searchParams.get('offset'))).toEqual([
    '0',
    '10',
    '20',
    '30',
  ])
})

it('loads another search cursor without moving the normal history page', async () => {
  local = [localRow(21)]
  fetcher.mockImplementation(async (request: Request) =>
    response((new URL(request.url).searchParams.get('offset') === '10' ? range(10, 1) : range(20, 11)).map(serverRow)),
  )
  await render()
  await waitFor(() => expect(history.searchTransactions).toHaveLength(11))
  await act(async () => {
    await history.loadMore()
  })
  expect(history.searchTransactions).toHaveLength(21)
  expect(history.currentPage).toBe(1)
  expect(history.searchTransactions[20].sourceTxHash).toBe('hash-1')
})

it('clamps after local rows disappear', async () => {
  local = range(25, 1).map(localRow)
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
    if (new URL(request.url).pathname.includes('/0xother/')) return response([])
    if (params.get('offset') !== '0')
      return new Promise<Response>(resolve => {
        release = resolve
      })
    return response(range(30, 21).map(serverRow))
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
    release(response([]))
    await next
  })
  expect(history.currentPage).toBe(1)
  expect(history.transactions).toEqual([])
  expect(fetcher).toHaveBeenCalledTimes(3)
})

it('holds timestamp ties until the cursor has covered them', () => {
  const row = serverRow(10)
  const page = { transactions: [row], nextCursor: 'next' }
  const local = [localRow(10), localRow(9)].map(localTransactionToHistory)
  expect(getLoadedHistory([page], local, '0xsender').transactions).toEqual([])
  expect(getLoadedHistory([{ ...page, nextCursor: null }], local, '0xsender').transactions).toHaveLength(2)
})

it('ignores detail cache and keeps persisted local settlement until KD catches up', async () => {
  const settled = { ...serverRow(30), actualOutput: '95' }
  local = [{ ...localRow(30), status: 'Success', outputAmount: '95', settlement: settled }]
  await render()
  await waitFor(() => expect(history.loadingMore).toBe(false))
  expect(hashes()).toEqual(['hash-30'])
  expect(history.transactions[0]).toMatchObject({ status: 'Success', outputAmount: '95', usesBackendData: true })

  await act(async () => {
    store.dispatch(
      detailApi.util.upsertQueryEntries([
        {
          endpointName: 'getTransaction',
          arg: { sourceTxHash: 'hash-31', chain: 'ethereum' },
          value: serverRow(31),
        },
        {
          endpointName: 'getTransaction',
          arg: { sourceTxHash: settled.sourceTxHash, chain: settled.fromChain, quoteId: settled.quoteId },
          value: { ...settled, actualOutput: '999' },
        },
      ]),
    )
  })
  expect(hashes()).toEqual(['hash-30'])
  expect(history.transactions[0].outputAmount).toBe('95')

  // Reload loses RTK cache but preserves local JSON.
  local = JSON.parse(JSON.stringify(local))
  await act(async () => store.dispatch(api.util.resetApiState()))
  await render()
  await waitFor(() => expect(history.loadingMore).toBe(false))
  expect(history.transactions[0].outputAmount).toBe('95')

  fetcher.mockImplementation(async () =>
    response([{ ...serverRow(30), status: 'in_progress', verification: 'pending' }]),
  )
  await act(async () => {
    await refetchHistory()
  })
  await waitFor(() => expect(history.loadingMore).toBe(false))
  expect(history.transactions[0]).toMatchObject({ status: 'Success', outputAmount: '95' })

  fetcher.mockImplementation(async () => response([{ ...serverRow(30), fromToken: '', toToken: '' }]))
  await act(async () => {
    await refetchHistory()
  })
  await waitFor(() => expect(history.loadingMore).toBe(false))
  expect(history.transactions[0]).toMatchObject({ sourceToken: 'token', outputAmount: '95' })

  fetcher.mockImplementation(async () => response([serverRow(30)]))
  await act(async () => {
    await refetchHistory()
  })
  await waitFor(() => expect(history.loadingMore).toBe(false))
  expect(hashes()).toEqual(['hash-30'])
  expect(history.transactions[0].outputAmount).toBe('90')
})

it('keeps the current page on cursor failure and retries without skipping newly loaded rows', async () => {
  let fail = true
  fetcher.mockImplementation(async (request: Request) => {
    if (new URL(request.url).searchParams.get('offset') === '0') return response(range(20, 11).map(serverRow))
    if (new URL(request.url).searchParams.get('offset') === '20') return response([])
    return fail
      ? new Response(JSON.stringify({ code: 4000 }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      : response(range(10, 1).map(serverRow))
  })
  await render()
  await waitFor(() => expect(hasQueryError()).toBe(true))
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

it('shows a submitted same-chain swap before API indexing, updates its receipt, then dedupes the indexed result', async () => {
  // An unavailable index must not prevent local history rendering.
  fetcher.mockImplementation(async () => new Response('', { status: 503 }))
  await render()
  await waitFor(() => expect(hasQueryError()).toBe(true))
  await act(async () => {
    store.dispatch(
      addTransaction({
        chainId: 1,
        hash: 'hash-33',
        from: sender,
        type: TRANSACTION_TYPE.SWAP,
        extraInfo: {
          tokenAddressIn: '0x0000000000000000000000000000000000000001',
          tokenAddressOut: '0x0000000000000000000000000000000000000002',
          tokenSymbolIn: 'USDC',
          tokenSymbolOut: 'USDT',
          tokenAmountIn: '1',
          tokenAmountOut: '0.9',
          swap: {
            inputAmount: '1000001',
            outputAmount: '900001',
            inputDecimals: 6,
            outputDecimals: 6,
            recipient: sender,
          },
        },
      }),
    )
  })
  expect(hashes()).toEqual(['hash-33'])
  expect(history.transactions[0]).toMatchObject({ status: 'Processing', inputAmount: '1000001' })
  await act(async () => {
    store.dispatch(finalizeTransaction({ chainId: 1, hash: 'hash-33', receipt: { status: 1, blockHash: 'block' } }))
  })
  expect(history.transactions[0].status).toBe('Success')
  fetcher.mockImplementation(async () => response([{ ...serverRow(33), toChain: 'ethereum', actualOutput: '910001' }]))
  await act(async () => {
    await refetchHistory()
  })
  await waitFor(() => expect(history.transactions[0].usesBackendData).toBe(true))
  expect(hashes()).toEqual(['hash-33'])
  expect(history.transactions[0].outputAmount).toBe('910001')
  sender = '0xother'
  await render()
  await waitFor(() => expect(history.loadingMore).toBe(false))
  expect(hashes()).toEqual([])
})

it('does not let a late next-page request undo previous-page navigation', async () => {
  local = [localRow(32), localRow(31)]
  let release!: (value: Response) => void
  fetcher.mockImplementation(async (request: Request) => {
    if (new URL(request.url).searchParams.get('offset') === '0') return response(range(30, 21).map(serverRow))
    return new Promise<Response>(resolve => {
      release = resolve
    })
  })
  await render()
  await waitFor(() => expect(history.transactions).toHaveLength(10))
  let next!: Promise<void>
  await act(async () => {
    next = history.goNext()
  })
  await waitFor(() => expect(release).toBeDefined())
  await act(async () => history.goPrevious())
  await act(async () => {
    release(response(range(20, 11).map(serverRow)))
    await next
  })
  expect(history.currentPage).toBe(1)
  expect(hashes()).toEqual(range(32, 23).map(n => `hash-${n}`))
})

it('refreshes a locally processing row through the mounted updater without manual refetch or remount', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
  autoPoll = true
  local = [{ ...localRow(1), status: 'Processing' }]
  let settled = false
  fetcher.mockImplementation(async () => response([{ ...serverRow(1), status: settled ? 'success' : 'in_progress' }]))
  await render()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100)
  })
  expect(history.transactions[0].status).toBe('Processing')
  settled = true
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10_100)
  })
  expect(fetcher.mock.calls.length).toBeGreaterThan(1)
  expect(history.transactions[0]).toMatchObject({ status: 'Success', usesBackendData: true })
})

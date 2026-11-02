import type { BackendTransaction } from 'services/crossChainTransactions'
import { describe, expect, it, vi } from 'vitest'

import { localTransactionToHistory, mergeTransactionHistory } from 'pages/Swap/transactions/history'
import reducer, {
  addTransaction,
  enqueueTransactionSync,
  finishTransactionSync,
  patchProviderTransactions,
  saveTransactionSync,
  selectTransactionSyncs,
} from 'state/crossChainSwap/index'
import { localTransactionKey } from 'state/crossChainSwap/model'
import type { NormalizedTxResponse } from 'types/crossChain'

vi.mock('state/hooks', () => ({ useAppSelector: vi.fn() }))

const transaction: NormalizedTxResponse = {
  id: 'provider-id',
  sourceTxHash: '0xhash',
  sender: '0xsender',
  recipient: 'recipient',
  sourceChain: 1,
  targetChain: 8453,
  adapter: 'debridge',
  status: 'Processing',
  sourceToken: { symbol: 'IN', decimals: 6 } as NormalizedTxResponse['sourceToken'],
  targetToken: { symbol: 'OUT', decimals: 6 } as NormalizedTxResponse['targetToken'],
  inputAmount: '100',
  outputAmount: '90',
  targetTxHash: 'provider-order-id',
  timestamp: 1000,
  amountInUsd: 1,
  amountOutUsd: 0.9,
  platformFeePercent: 0,
}
const backend: BackendTransaction = {
  id: '00000000-0000-4000-8000-000000000001',
  quoteId: 'quote',
  sourceTxHash: '0xhash',
  sender: '0xsender',
  recipient: 'recipient',
  fromChain: 'ethereum',
  toChain: 'base',
  fromToken: 'input',
  toToken: 'output',
  fromAmount: '100',
  quotedOutput: '90',
  quotedMinOutput: '80',
  actualOutput: '95',
  destTxHash: '0xfill',
  provider: 'debridge',
  verification: 'verified',
  status: 'success',
  inputUsd: 1,
  outputUsd: 0.9,
  timeEstimate: 60,
  createdAt: new Date(1000).toISOString(),
  completedAt: null,
  expiredAt: null,
}
const initial = () =>
  reducer(undefined, enqueueTransactionSync({ transaction, quoteId: 'quote', quoteToken: 'secret' }))
const entryOf = (state: ReturnType<typeof initial>) => selectTransactionSyncs({ crossChainSwap: state })[0]

describe('persisted local settlement', () => {
  it.each(['success', 'failed', 'refunded'] as const)('retains %s after sync cleanup and JSON reload', status => {
    let state = initial()
    const entry = entryOf(state)
    state = reducer(state, saveTransactionSync({ ...entry, backend: { ...backend, status } }))
    state = reducer(state, finishTransactionSync(entry.key))
    expect(state.transactions).toHaveLength(1)
    expect(selectTransactionSyncs({ crossChainSwap: state })).toEqual([])
    expect(JSON.stringify(state)).not.toContain('secret')
    const reloaded = JSON.parse(JSON.stringify(state))
    const rows = mergeTransactionHistory({
      server: [],
      local: reloaded.transactions.map(localTransactionToHistory),
      sender: transaction.sender,
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      status: status === 'success' ? 'Success' : status === 'failed' ? 'Failed' : 'Refunded',
      outputAmount: '95',
      targetTxHash: '0xfill',
      fromBackend: true,
    })
    expect(state.transactions[0]).toMatchObject({ outputAmount: '95', targetTxHash: '0xfill' })
  })

  it('blocks late provider, broadcast and sync responses from undoing a settlement or restarting sync', () => {
    let state = initial()
    const entry = { ...entryOf(state), backend }
    state = reducer(state, saveTransactionSync(entry))
    state = reducer(state, finishTransactionSync(entry.key))
    const finished = state
    state = reducer(
      state,
      patchProviderTransactions([
        { key: localTransactionKey(transaction), update: { status: 'Processing', outputAmount: '1' } },
      ]),
    )
    state = reducer(state, addTransaction({ ...transaction, adapter: 'other' }))
    state = reducer(state, saveTransactionSync(entry))
    state = reducer(state, enqueueTransactionSync({ transaction, quoteId: 'quote', quoteToken: 'secret' }))
    expect(state).toEqual(finished)
  })

  it('leaves provider history intact on rejected registration and does not resume stale sync', () => {
    let state = initial()
    const entry = { ...entryOf(state), recordingStatus: 'permanent_error' as const }
    state = reducer(state, saveTransactionSync(entry))
    state = reducer(state, finishTransactionSync(entry.key))
    state = reducer(state, saveTransactionSync(entry))
    expect(state.transactions).toEqual([transaction])
    state = reducer(
      state,
      patchProviderTransactions([{ key: localTransactionKey(transaction), update: { status: 'Success' } }]),
    )
    expect(state.transactions[0].status).toBe('Success')
  })

  it('preserves canonical fields on a verified conflict without leaking local token metadata', () => {
    let state = initial()
    const entry = entryOf(state)
    const canonical = {
      ...backend,
      quoteId: 'other-quote',
      provider: 'relay',
      toToken: 'other-token',
      destTxHash: null,
    }
    state = reducer(state, saveTransactionSync({ ...entry, backend: canonical }))
    state = reducer(state, finishTransactionSync(entry.key))
    expect(
      mergeTransactionHistory({
        server: [],
        local: state.transactions.map(localTransactionToHistory),
        sender: transaction.sender,
      })[0],
    ).toMatchObject({ targetToken: 'other-token', adapter: 'relay', targetTxHash: undefined })
    expect(
      mergeTransactionHistory({
        server: [canonical],
        local: state.transactions.map(localTransactionToHistory),
        sender: transaction.sender,
      }),
    ).toHaveLength(1)
  })
})

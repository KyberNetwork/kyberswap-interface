import { type Middleware, type PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit'
import { save } from 'redux-localstorage-simple'

import type { NormalizedTxResponse } from 'pages/Swap/crossChain/adapters/types'
import {
  type LocalTransaction,
  type OutboxEntry,
  REGISTRATION_RETRY_WINDOW,
  canRemoveOutboxEntry,
  isBackendResolved,
  localTransactionKey,
  outboxKey,
} from 'pages/Swap/crossChain/transactions/model'
import { useAppSelector } from 'state/hooks'

const MAX_CROSS_CHAIN_TRANSACTIONS = 120
// Never evict a transaction still being polled or registered.
const trimHistory = (transactions: LocalTransaction[]) => {
  let completed = 0
  return transactions.filter(
    tx => tx.sync || !tx.status || tx.status === 'Processing' || completed++ < MAX_CROSS_CHAIN_TRANSACTIONS,
  )
}

export type CrossChainQuoteMode = 'direct' | 'stream'

export interface CrossChainSwapState {
  gasDropFeatureEnabled: boolean
  kyberCrossExcludedSources: string[]
  transactions: LocalTransaction[]
  excludedSources: string[]
}

type BroadcastTransaction = {
  transaction: NormalizedTxResponse
  quoteId: string
  quoteToken: string
  sender?: string
}

const slice = createSlice({
  name: 'crossChainSwap',
  initialState: {
    gasDropFeatureEnabled: false,
    kyberCrossExcludedSources: [] as string[],
    transactions: [] as LocalTransaction[],
    excludedSources: [] as string[],
  } as CrossChainSwapState,
  reducers: {
    addTransaction: (state, { payload }: { payload: NormalizedTxResponse }) => {
      const key = localTransactionKey(payload)
      const current = state.transactions.find(tx => localTransactionKey(tx) === key)
      if (current) {
        // A late adapter confirmation may enrich routing fields, but cannot undo
        // the provider result already stored for this broadcast.
        const { status, outputAmount, targetTxHash, estimatedAmountOut, timestamp } = current
        Object.assign(current, payload, { status, outputAmount, targetTxHash, estimatedAmountOut, timestamp })
      } else state.transactions = trimHistory([payload, ...state.transactions])
    },
    enqueueTransactionSync: {
      prepare: (payload: BroadcastTransaction) => ({ payload: { ...payload, now: Date.now() } }),
      reducer: (state, { payload }: PayloadAction<BroadcastTransaction & { now: number }>) => {
        const { transaction, quoteId, quoteToken, sender = transaction.sender, now } = payload
        const key = outboxKey(sender, transaction.sourceChain, transaction.sourceTxHash, quoteId)
        let current = state.transactions.find(
          tx => localTransactionKey(tx) === localTransactionKey({ ...transaction, sender }),
        )
        if (!current) {
          state.transactions.unshift({ ...transaction, sender })
          current = state.transactions[0]
        }
        if (current.sync?.key === key) return
        current.sync = {
          key,
          sender,
          sourceChain: transaction.sourceChain,
          sourceTxHash: transaction.sourceTxHash,
          quoteId,
          quoteToken,
          recordingStatus: 'queued',
          createdAt: now,
          registrationExpiresAt: now + REGISTRATION_RETRY_WINDOW,
          attempts: 0,
          detailAttempts: 0,
          nextRetryAt: now,
        }
      },
    },
    saveTransactionSync: (state, { payload }: { payload: OutboxEntry }) => {
      const { transaction, feStatus: _, ...sync } = payload
      const current = state.transactions.find(tx => localTransactionKey(tx) === localTransactionKey(transaction))
      if (current) current.sync = sync
      else state.transactions = [{ ...transaction, status: payload.feStatus, sync }, ...state.transactions]
    },
    finishTransactionSync: (state, { payload: key }: { payload: string }) => {
      const index = state.transactions.findIndex(tx => tx.sync?.key === key)
      const tx = state.transactions[index]
      if (!tx?.sync || !canRemoveOutboxEntry({ ...tx.sync, transaction: tx, feStatus: tx.status || 'Processing' }))
        return
      if (isBackendResolved(tx.sync.backend)) state.transactions.splice(index, 1)
      else delete tx.sync // Registration expired/rejected: keep ordinary local history.
    },
    patchProviderTransactions: (
      state,
      { payload }: { payload: { key: string; update: Partial<NormalizedTxResponse> }[] },
    ) => {
      for (const { key, update } of payload) {
        const current = state.transactions.find(tx => localTransactionKey(tx) === key)
        // Missing means BE already handed it to server history. Never recreate it.
        if (!current || isBackendResolved(current.sync?.backend)) continue
        Object.assign(current, update)
      }
    },
    updateGasDropFeatureEnabled: (state, { payload }: { payload: boolean }) => {
      state.gasDropFeatureEnabled = payload
    },
    updateKyberCrossExcludedSources: (state, { payload }: { payload: string[] }) => {
      state.kyberCrossExcludedSources = payload
    },
    updateExcludedSources: (state, { payload }: { payload: string[] }) => {
      state.excludedSources = payload
    },
  },
})

export const {
  enqueueTransactionSync,
  addTransaction,
  saveTransactionSync,
  finishTransactionSync,
  patchProviderTransactions,
  updateExcludedSources,
  updateKyberCrossExcludedSources,
  updateGasDropFeatureEnabled,
} = slice.actions

export const useGasDropFeatureEnabled = () =>
  useAppSelector(state => state.crossChainSwap.gasDropFeatureEnabled ?? false)

export default slice.reducer

export const useCrossChainTransactions = () => useAppSelector(state => state.crossChainSwap.transactions)

// Derived views of the persisted Redux rows; there is no separate outbox store.
export const selectTransactionSyncs = createSelector(
  [(state: { crossChainSwap: CrossChainSwapState }) => state.crossChainSwap.transactions],
  transactions =>
    transactions.flatMap(({ sync, ...transaction }): OutboxEntry[] =>
      sync ? [{ ...sync, transaction, feStatus: transaction.status || 'Processing' }] : [],
    ),
)
export const selectTransactionSync = (state: { crossChainSwap: CrossChainSwapState }, key: string) =>
  selectTransactionSyncs(state).find(entry => entry.key === key)

// One writer for this persisted array. Save changed rows synchronously so wallet
// navigation cannot discard a broadcast; unrelated Redux actions do not rewrite it.
// This serializes writes within one tab only. Concurrent tabs still overwrite the
// whole array and can lose pending rows or restore removed ones.
export const persistCrossChainTransactions: Middleware<object, { crossChainSwap: CrossChainSwapState }> = store => {
  const persist = (save({ states: ['crossChainSwap.transactions'] }) as Middleware)(store)(action => action)
  return next => action => {
    const previous = store.getState().crossChainSwap.transactions
    const result = next(action)
    if (previous !== store.getState().crossChainSwap.transactions) persist(action)
    return result
  }
}

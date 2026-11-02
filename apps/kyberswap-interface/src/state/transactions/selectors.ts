import { createSelector } from '@reduxjs/toolkit'

import type { AppState } from 'state'
import {
  type LocalTransaction,
  getLocalTransactionStatus,
  isTransactionForWallet,
  transactionIdentity,
} from 'state/crossChainSwap/model'
import type { TransactionDetails } from 'state/transactions/type'
import { isProcessingTransactionStatus } from 'types/crossChain'

export const isTransactionRecent = (tx: Pick<TransactionDetails, 'addedTime'>, now = Date.now()) =>
  now - tx.addedTime < 86_400_000

export const selectLocalTransactions = createSelector(
  [(state: Pick<AppState, 'transactions'>) => state.transactions],
  transactions =>
    Object.values(transactions).flatMap(chain => Object.values(chain ?? {}).flatMap(group => group ?? [])),
)

// The header counts local execution state only. Cross-chain execution supersedes
// a source-chain receipt (and any matching legacy pending row) until settlement.
export const countPendingTransactions = (
  transactions: TransactionDetails[],
  crossChain: LocalTransaction[],
  account: string | undefined,
  chainId: number,
  now = Date.now(),
) => {
  if (!account) return 0
  const wallet = account.toLowerCase()
  const pending = new Set(
    transactions
      .filter(
        tx => tx.chainId === chainId && tx.from.toLowerCase() === wallet && !tx.receipt && isTransactionRecent(tx, now),
      )
      .map(tx => transactionIdentity(tx.chainId, tx.hash, '')),
  )
  for (const tx of crossChain) {
    if (!isTransactionForWallet(tx, wallet)) continue
    const key = transactionIdentity(tx.sourceChain, tx.sourceTxHash, '')
    const status = getLocalTransactionStatus(tx)
    if (isProcessingTransactionStatus(status)) pending.add(key)
    else pending.delete(key)
  }
  return pending.size
}

export const selectPendingTransactionCount = (
  state: Pick<AppState, 'transactions' | 'crossChainSwap'>,
  account: string | undefined,
  chainId: number,
) => countPendingTransactions(selectLocalTransactions(state), state.crossChainSwap.transactions, account, chainId)

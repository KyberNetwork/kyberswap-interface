import { createSelector } from '@reduxjs/toolkit'

import type { AppState } from 'state'
import { type LocalTransaction, transactionIdentity } from 'state/crossChainSwap/model'
import type { TransactionDetails } from 'state/transactions/type'

export const isTransactionRecent = (tx: Pick<TransactionDetails, 'addedTime'>, now = Date.now()) =>
  now - tx.addedTime < 86_400_000

export const selectLocalTransactions = createSelector(
  [(state: Pick<AppState, 'transactions'>) => state.transactions],
  transactions =>
    Object.values(transactions).flatMap(chain => Object.values(chain ?? {}).flatMap(group => group ?? [])),
)

// The header counts pending same-chain transactions on the active wallet/network.
// Exclude source transactions that also appear in cross-chain history.
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
    if (tx.sourceChain !== tx.targetChain) pending.delete(transactionIdentity(tx.sourceChain, tx.sourceTxHash, ''))
  }
  return pending.size
}

export const selectPendingTransactionCount = (
  state: Pick<AppState, 'transactions' | 'crossChainSwap'>,
  account: string | undefined,
  chainId: number,
) => countPendingTransactions(selectLocalTransactions(state), state.crossChainSwap.transactions, account, chainId)

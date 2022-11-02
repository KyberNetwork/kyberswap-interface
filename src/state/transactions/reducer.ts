import { createReducer } from '@reduxjs/toolkit'

import { findTx } from 'utils'

import {
  addTransaction,
  checkedSubgraph,
  checkedTransaction,
  clearAllTransactions,
  finalizeTransaction,
} from './actions'
import { GroupedTxsByHash } from './type'

const now = () => new Date().getTime()

interface TransactionState {
  [chainId: number]: GroupedTxsByHash | undefined
}

const initialState: TransactionState = {}

export default createReducer(initialState, builder =>
  builder
    .addCase(
      addTransaction,
      (transactions, { payload: { chainId, from, hash, approval, type, summary, arbitrary, firstTxHash } }) => {
        // if (firstTxHash && transactions[chainId]?.[firstTxHash]) {
        //   throw Error('Attempted to add existing transaction.')
        // }
        const chainTxs = transactions[chainId] ?? {}
        const txs = (firstTxHash && chainTxs[firstTxHash]) || []
        txs.push({ hash, approval, type, summary, arbitrary, from, addedTime: now() })
        chainTxs[txs[0].hash] = txs
        transactions[chainId] = chainTxs
      },
    )
    .addCase(clearAllTransactions, (transactions, { payload: { chainId } }) => {
      if (!transactions[chainId]) return
      transactions[chainId] = {}
    })
    .addCase(checkedTransaction, (transactions, { payload: { chainId, hash, blockNumber } }) => {
      const tx = findTx(transactions[chainId], hash)
      if (!tx) return
      if (!tx.lastCheckedBlockNumber) tx.lastCheckedBlockNumber = blockNumber
      else tx.lastCheckedBlockNumber = Math.max(blockNumber, tx.lastCheckedBlockNumber)
    })
    .addCase(finalizeTransaction, (transactions, { payload: { hash, chainId, receipt, needCheckSubgraph } }) => {
      const tx = findTx(transactions[chainId], hash)
      if (!tx) return
      tx.receipt = receipt
      tx.confirmedTime = now()
      tx.needCheckSubgraph = needCheckSubgraph
    })
    .addCase(checkedSubgraph, (transactions, { payload: { chainId, hash } }) => {
      const tx = findTx(transactions[chainId], hash)
      if (!tx) return
      tx.needCheckSubgraph = false
    }),
)

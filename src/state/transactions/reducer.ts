import { ChainId } from '@kyberswap/ks-sdk-core'
import { createReducer } from '@reduxjs/toolkit'

import { findTx } from 'utils'
import { getTransactionGroupByType } from 'utils/transaction'

import {
  addTransaction,
  checkedTransaction,
  clearAllTransactions,
  finalizeTransaction,
  modifyTransaction,
  removeTx,
  replaceTx,
} from './actions'
import { GroupedTxsByHash, TransactionDetails, TransactionExtraInfo } from './type'

type TransactionState = {
  [chainId in ChainId]?: GroupedTxsByHash | undefined
}

const initialState: TransactionState = {}

const clearOldTransactions = (transactions: GroupedTxsByHash | undefined): GroupedTxsByHash | undefined => {
  if (!transactions) return undefined
  const chainTxs = Object.values(transactions ?? {}).filter(Boolean) as TransactionDetails[][]
  chainTxs.sort((a, b) => a[0].addedTime - b[0].addedTime)
  const slicedChainTxs = chainTxs.slice(-10).filter(tx => tx[0].addedTime > Date.now() - 7 * 24 * 60 * 60 * 1000)
  const result = slicedChainTxs.reduce((acc, cur) => ({ ...acc, [cur[0].hash]: cur }), {}) as GroupedTxsByHash
  return result
}

export default createReducer(initialState, builder =>
  builder
    .addCase(
      addTransaction,
      (
        transactions,
        { payload: { sentAtBlock, to, nonce, data, chainId, from, hash, type, firstTxHash, extraInfo } },
      ) => {
        const chainTxs = transactions[chainId] ?? {}
        const txs = (firstTxHash && chainTxs[firstTxHash]) || []
        if (!hash || txs.find(e => e.hash === hash)) {
          // duplicate or not found hash
          return
        }
        txs.push({
          sentAtBlock,
          to,
          nonce,
          data,
          hash,
          type,
          from,
          addedTime: Date.now(),
          chainId,
          extraInfo,
          group: getTransactionGroupByType(type),
        })
        chainTxs[txs[0].hash] = txs
        transactions[chainId] = clearOldTransactions(chainTxs)
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
      tx.confirmedTime = Date.now()
      const newExtraInfo: TransactionExtraInfo = { ...tx.extraInfo, needCheckSubgraph }
      tx.extraInfo = newExtraInfo
    })
    .addCase(modifyTransaction, (transactions, { payload: { chainId, hash, extraInfo, needCheckSubgraph } }) => {
      const tx = findTx(transactions[chainId], hash)
      if (!tx) return
      const newExtraInfo: TransactionExtraInfo = { ...tx.extraInfo, ...extraInfo }
      if (needCheckSubgraph !== undefined) newExtraInfo.needCheckSubgraph = needCheckSubgraph
      tx.extraInfo = newExtraInfo
    })
    .addCase(replaceTx, (transactions, { payload: { chainId, oldHash, newHash } }) => {
      const chainTxs = transactions[chainId] ?? {}
      const txGroup = chainTxs[oldHash] || Object.values(chainTxs).find(txs => txs?.some(tx => tx?.hash === oldHash))
      if (!txGroup) return
      const txIndex = txGroup.findIndex(tx => tx?.hash === oldHash)
      if (txIndex < 0) return
      txGroup[txIndex].hash = newHash
      if (chainTxs[oldHash]) {
        chainTxs[newHash] = txGroup
        if (oldHash !== newHash) delete chainTxs[oldHash]
      }
      transactions[chainId] = chainTxs
    })
    .addCase(removeTx, (transactions, { payload: { chainId, hash } }) => {
      const chainTxs = transactions[chainId] ?? {}
      if (chainTxs[hash]) {
        delete chainTxs[hash]
      } else {
        const txGroup = Object.values(chainTxs).find(txs => txs?.some(tx => tx?.hash === hash))
        if (!txGroup) return
        if (txGroup.length === 1) {
          delete transactions[chainId]?.[hash]
        } else {
          const txIndex = txGroup.findIndex(tx => tx?.hash === hash)
          if (txIndex < 0) return
          txGroup.splice(txIndex, 1)
        }
      }
      transactions[chainId] = chainTxs
    }),
)

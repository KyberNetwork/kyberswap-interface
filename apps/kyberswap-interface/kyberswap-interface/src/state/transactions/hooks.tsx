import { TransactionResponse } from '@ethersproject/abstract-provider'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useBlockNumber, useKyberSwapConfig } from 'state/application/hooks'
import { AppDispatch, AppState } from 'state/index'
import { findTx } from 'utils'

import { addTransaction } from './actions'
import { GroupedTxsByHash, TransactionDetails, TransactionExtraInfo1Token, TransactionHistory } from './type'

// helper that can take a ethers library transaction response and add it to the list of transactions
export function useTransactionAdder(): (tx: TransactionHistory) => void {
  const { chainId, account } = useActiveWeb3React()
  const { readProvider } = useKyberSwapConfig(chainId)
  const { library } = useWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  const blockNumber = useBlockNumber()

  const blockNumberRef = useRef(blockNumber)
  useEffect(() => {
    blockNumberRef.current = blockNumber
  }, [blockNumber])

  return useCallback(
    async ({ hash, desiredChainId, type, firstTxHash, extraInfo }: TransactionHistory) => {
      if (!account) return

      let tx: TransactionResponse | undefined
      try {
        tx = await library?.getTransaction(hash)
        if (!tx) tx = await readProvider?.getTransaction(hash)
      } catch (error) {}

      dispatch(
        addTransaction({
          hash,
          from: account,
          to: tx?.to,
          nonce: tx?.nonce,
          data: tx?.data,
          sentAtBlock: blockNumberRef.current,
          chainId: desiredChainId ?? chainId,
          type,
          firstTxHash,
          extraInfo,
        }),
      )
    },
    [account, chainId, dispatch, readProvider, library],
  )
}

const filterTxsMapByAccount = (obj: GroupedTxsByHash | undefined, account: string | undefined) => {
  if (!obj) return
  const result: GroupedTxsByHash = {}
  Object.keys(obj).forEach(key => {
    const arr = obj[key] ?? []
    if (isOwnTransactionGroup(arr, account)) {
      result[key] = obj[key]
    }
  })
  return result
}
// returns all the transactions for the current chain
export function useAllTransactions(allChain = false): GroupedTxsByHash | undefined {
  const { chainId, account } = useActiveWeb3React()
  const transactions = useSelector<AppState, AppState['transactions']>(state => state.transactions)

  return useMemo(() => {
    if (!allChain) return filterTxsMapByAccount(transactions[chainId], account)
    return Object.values(transactions).reduce((rs, obj) => {
      return { ...rs, ...filterTxsMapByAccount(obj, account) }
    }, {})
  }, [allChain, transactions, chainId, account])
}

export function useSortRecentTransactions(recentOnly = true, allChain = false) {
  const allTransactions = useAllTransactions(allChain)
  const { account } = useActiveWeb3React()
  return useMemo(() => {
    const txGroups: TransactionDetails[][] = allTransactions
      ? (Object.values(allTransactions).filter(Boolean) as TransactionDetails[][])
      : []
    return txGroups
      .filter(txs => {
        const isMyGroup = isOwnTransactionGroup(txs, account)
        return recentOnly ? isTransactionGroupRecent(txs) && isMyGroup : isMyGroup
      })
      .sort(newTransactionsGroupFirst)
  }, [allTransactions, recentOnly, account])
}

export function useIsTransactionPending(transactionHash?: string): boolean {
  const transactions = useAllTransactions()

  if (!transactionHash) return false

  const tx = findTx(transactions, transactionHash)
  if (!tx) return false

  return !tx.receipt
}

function isOwnTransactionGroup(txs: TransactionDetails[], account: string | undefined): boolean {
  return !!account && txs[0]?.from === account && !!txs[0]?.group
}

/**
 * Returns whether a transaction happened in the last day (86400 seconds * 1000 milliseconds / second)
 * @param tx to check for recency
 */
function isTransactionGroupRecent(txs: TransactionDetails[]): boolean {
  return new Date().getTime() - (txs[0]?.addedTime ?? 0) < 86_400_000
}

// we want the latest one to come first, so return negative if a is after b
function newTransactionsGroupFirst(a: TransactionDetails[], b: TransactionDetails[]) {
  return (b[0]?.addedTime ?? 0) - (a[0]?.addedTime ?? 0)
}

/**
 * Returns whether a transaction happened in the last day (86400 seconds * 1000 milliseconds / second)
 * @param tx to check for recency
 */
export function isTransactionRecent(tx: TransactionDetails): boolean {
  return new Date().getTime() - tx.addedTime < 86_400_000
}

// we want the latest one to come first, so return negative if a is after b
export function newTransactionsFirst(a: TransactionDetails, b: TransactionDetails) {
  return b.addedTime - a.addedTime
}

// returns whether a token has a pending approval transaction
export function useHasPendingApproval(tokenAddress: string | undefined, spender: string | undefined): boolean {
  const allTransactions = useAllTransactions()
  return useMemo(
    () =>
      typeof tokenAddress === 'string' &&
      typeof spender === 'string' &&
      !!allTransactions &&
      Object.values(allTransactions)
        .flat()
        .some(tx => {
          if (!tx || tx.receipt || !tx.extraInfo) return false
          const extraInfo = tx.extraInfo as TransactionExtraInfo1Token
          return extraInfo.contract === spender && extraInfo.tokenAddress === tokenAddress && isTransactionRecent(tx)
        }),
    [allTransactions, spender, tokenAddress],
  )
}

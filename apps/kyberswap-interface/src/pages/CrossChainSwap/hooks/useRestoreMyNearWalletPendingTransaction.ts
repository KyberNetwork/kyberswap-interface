import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { NormalizedTxResponse } from 'pages/CrossChainSwap/adapters/types'
import { useCrossChainTransactions } from 'state/crossChainSwap'

const MY_NEAR_WALLET_PENDING_TRANSACTION_KEY = 'cross-chain-swap-my-near-wallet-tx'

export const saveMyNearWalletPendingTransaction = (transaction: NormalizedTxResponse) => {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(MY_NEAR_WALLET_PENDING_TRANSACTION_KEY, JSON.stringify(transaction))
}

const getMyNearWalletPendingTransaction = (): NormalizedTxResponse | null => {
  if (typeof window === 'undefined') return null

  const rawTransaction = window.localStorage.getItem(MY_NEAR_WALLET_PENDING_TRANSACTION_KEY)
  if (!rawTransaction) return null

  try {
    const parsedTransaction: unknown = JSON.parse(rawTransaction)

    if (!parsedTransaction || typeof parsedTransaction !== 'object') return null

    const transaction = parsedTransaction as Partial<NormalizedTxResponse>
    if (!transaction.id || !transaction.sourceTxHash) return null

    return transaction as NormalizedTxResponse
  } catch {
    return null
  }
}

const removeMyNearWalletPendingTransaction = () => {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(MY_NEAR_WALLET_PENDING_TRANSACTION_KEY)
}

export const useRestoreMyNearWalletPendingTransaction = () => {
  const [transactions, setTransactions] = useCrossChainTransactions()
  const [searchParams, setSearchParams] = useSearchParams()
  const transactionHashes = searchParams.get('transactionHashes')

  useEffect(() => {
    if (!transactionHashes) return

    const transaction = getMyNearWalletPendingTransaction()
    if (!transaction) return

    setTransactions([transaction, ...transactions])
    removeMyNearWalletPendingTransaction()

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('transactionHashes')
    setSearchParams(nextSearchParams, { replace: true })
  }, [searchParams, setSearchParams, setTransactions, transactionHashes, transactions])
}

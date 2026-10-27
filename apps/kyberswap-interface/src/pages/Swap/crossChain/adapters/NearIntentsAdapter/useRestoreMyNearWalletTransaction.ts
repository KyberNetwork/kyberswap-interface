import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { addTransaction, enqueueTransactionSync } from 'state/crossChainSwap'
import { useAppDispatch } from 'state/hooks'

import {
  getMyNearWalletPendingTransaction,
  getNearTransferHash,
  removeMyNearWalletPendingTransaction,
} from './pendingTransaction'

export const useRestoreMyNearWalletTransaction = () => {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const transactionHashes = searchParams.get('transactionHashes')

  useEffect(() => {
    if (!transactionHashes) return

    const transaction = getMyNearWalletPendingTransaction()
    if (!transaction) return

    // My NEAR Wallet returns the real broadcast transfer hash in the redirect.
    // The deposit address is only the provider's tracking id and must never be
    // registered as sourceTxHash.
    const sourceTxHash = getNearTransferHash(transactionHashes.split(','), transaction.expectedTransactions)
    if (!sourceTxHash) return
    const { quoteId, quoteToken, expectedTransactions: _, ...metadata } = transaction
    const restored = { ...metadata, sourceTxHash }

    if (quoteId && quoteToken) {
      dispatch(enqueueTransactionSync({ quoteId, quoteToken, sender: restored.sender, transaction: restored }))
    } else {
      dispatch(addTransaction(restored))
    }
    removeMyNearWalletPendingTransaction()

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('transactionHashes')
    setSearchParams(nextSearchParams, { replace: true })
  }, [dispatch, searchParams, setSearchParams, transactionHashes])
}

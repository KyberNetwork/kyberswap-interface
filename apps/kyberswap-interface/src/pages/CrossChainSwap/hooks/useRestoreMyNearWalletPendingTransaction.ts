import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  getMyNearWalletPendingTransaction,
  removeMyNearWalletPendingTransaction,
} from 'pages/CrossChainSwap/nearPendingTransaction'
import { addTransaction } from 'state/crossChainSwap'
import { useAppDispatch } from 'state/hooks'

export const useRestoreMyNearWalletPendingTransaction = () => {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const transactionHashes = searchParams.get('transactionHashes')

  useEffect(() => {
    if (!transactionHashes) return

    const transaction = getMyNearWalletPendingTransaction()
    if (!transaction) return

    dispatch(addTransaction(transaction))
    removeMyNearWalletPendingTransaction()

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('transactionHashes')
    setSearchParams(nextSearchParams, { replace: true })
  }, [dispatch, searchParams, setSearchParams, transactionHashes])
}

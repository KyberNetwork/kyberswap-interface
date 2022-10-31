import { useMemo } from 'react'

import { isTransactionRecent, useAllTransactions } from 'state/transactions/hooks'

const usePendingTransactions = () => {
  const allTransactions = useAllTransactions()
  return useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs.filter(tx => isTransactionRecent(tx) && !tx.receipt).map(tx => tx.hash)
  }, [allTransactions])
}
export default usePendingTransactions

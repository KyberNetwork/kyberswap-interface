import { useAllTransactions } from 'state/transactions/hooks'
import { isTransactionRecent } from 'state/transactions/selectors'

// Balance refresh follows only the current chain's local receipts.
const useTransactionStatus = () => {
  const transactions = useAllTransactions()
  return Object.values(transactions ?? {}).some(group => group?.some(tx => !tx.receipt && isTransactionRecent(tx)))
}

export default useTransactionStatus

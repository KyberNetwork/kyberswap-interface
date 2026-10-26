import { useTransactionHistory } from 'pages/CrossChainSwap/hooks/useTransactionHistory'

// Lazy status owner shared by swap pages; each page controls its mount lifetime.
const TransactionHistoryUpdater = () => {
  useTransactionHistory()
  return null
}

export default TransactionHistoryUpdater

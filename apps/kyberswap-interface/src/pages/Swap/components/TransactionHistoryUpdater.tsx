import { useTransactionHistory } from 'pages/CrossChainSwap/hooks/useTransactionHistory'

// Lazy lifecycle boundary mounted by SwapPage, independently of mode and History visibility.
const TransactionHistoryUpdater = () => {
  useTransactionHistory()
  return null
}

export default TransactionHistoryUpdater

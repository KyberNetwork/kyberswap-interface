import TransactionHistoryList from 'pages/CrossChainSwap/components/TransactionHistoryList'
import { useTransactionHistory } from 'pages/CrossChainSwap/hooks/useTransactionHistory'

// Legacy screens own polling while this history view is mounted.
const TransactionHistory = () => <TransactionHistoryList transactions={useTransactionHistory()} />

export default TransactionHistory

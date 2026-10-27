import { useRestoreMyNearWalletTransaction } from 'pages/CrossChainSwap/adapters/NearIntentsAdapter/useRestoreMyNearWalletTransaction'
import { useTransactionHistory } from 'pages/CrossChainSwap/hooks/useTransactionHistory'
import { useBackendTransactionUpdater } from 'pages/CrossChainSwap/transactions/useBackendTransactionUpdater'

// Lazy status owner shared by swap pages; each page controls its mount lifetime.
const TransactionHistoryUpdater = () => {
  useRestoreMyNearWalletTransaction()
  useTransactionHistory()
  useBackendTransactionUpdater()
  return null
}

export default TransactionHistoryUpdater

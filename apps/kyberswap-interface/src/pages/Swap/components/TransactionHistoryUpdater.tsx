import { useRestoreMyNearWalletTransaction } from 'pages/Swap/crossChain/adapters/NearIntentsAdapter/useRestoreMyNearWalletTransaction'
import { useTransactionHistory } from 'pages/Swap/crossChain/hooks/useTransactionHistory'
import { useBackendTransactionUpdater } from 'pages/Swap/crossChain/transactions/useBackendTransactionUpdater'

// Lazy status owner shared by swap pages; each page controls its mount lifetime.
const TransactionHistoryUpdater = () => {
  useRestoreMyNearWalletTransaction()
  useTransactionHistory()
  useBackendTransactionUpdater()
  return null
}

export default TransactionHistoryUpdater

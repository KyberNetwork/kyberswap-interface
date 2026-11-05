import { selectIndexedTransactions } from 'services/walletTransactionsApi'

import { localTransactionToHistory, mergeTransactionHistory } from 'components/SwapTransactions/history'
import { useSwapWallets } from 'components/SwapWallets/SwapWalletContext'
import { useCrossChainTransactions } from 'state/crossChainSwap'
import { useAppSelector } from 'state/hooks'
import { isProcessingTransactionStatus } from 'types/crossChain'

// Read local history and loaded KD pages. Local sync runs independently of
// panel visibility; indexed rows are refreshed through the KD history query.
export const useProcessingTransactions = () => {
  const swapWallets = useSwapWallets()
  const inputAddress =
    swapWallets?.inputConnection?.family === 'evm' ? swapWallets.inputAddress.toLowerCase() : swapWallets?.inputAddress

  const local = useCrossChainTransactions().map(localTransactionToHistory)
  const server = useAppSelector(selectIndexedTransactions)

  // This panel tracks cross-chain execution. Same-chain index rows are displayed
  // and refreshed by History, alongside the existing single-chain wallet status UI.
  const crossChainServer = server.filter(row => row.historyType !== 'swap')
  if (!inputAddress) return []
  return mergeTransactionHistory({ local, server: crossChainServer, sender: inputAddress })
    .filter(tx => isProcessingTransactionStatus(tx.status))
    .sort((left, right) => right.timestamp - left.timestamp)
}

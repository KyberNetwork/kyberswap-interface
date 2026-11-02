import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'
import { selectIndexedTransactions } from 'services/walletTransactionsApi'

import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useActiveWeb3React } from 'hooks'
import { localTransactionToHistory, mergeTransactionHistory } from 'pages/Swap/transactions/history'
import { useCrossChainTransactions } from 'state/crossChainSwap'
import { transactionIdentity } from 'state/crossChainSwap/model'
import { useAppSelector } from 'state/hooks'
import { isProcessingTransactionStatus } from 'types/crossChain'

// Read local history and loaded KD pages. Local sync runs independently of
// panel visibility; indexed rows are refreshed through the KD history query.
export const useProcessingTransactions = () => {
  const { account } = useActiveWeb3React()
  const { publicKey } = useWallet()
  const { walletInfo } = useBitcoinWallet()
  const { signedAccountId } = useWalletSelector()

  const local = useCrossChainTransactions().map(localTransactionToHistory)
  const server = useAppSelector(selectIndexedTransactions)

  const senders = new Set([account?.toLowerCase(), publicKey?.toString(), walletInfo?.address, signedAccountId])

  // This panel tracks cross-chain execution. Same-chain index rows are displayed
  // and refreshed by History, alongside the existing single-chain wallet status UI.
  const crossChainServer = server.filter(row => row.historyType !== 'swap')
  const transactions = [...senders]
    .flatMap(sender => (sender ? mergeTransactionHistory({ local, server: crossChainServer, sender }) : []))
    .filter(tx => isProcessingTransactionStatus(tx.status))
  // Both source and recipient wallets can be connected at the same time.
  return [
    ...new Map(transactions.map(tx => [transactionIdentity(tx.sourceChain, tx.sourceTxHash, ''), tx])).values(),
  ].sort((left, right) => right.timestamp - left.timestamp)
}

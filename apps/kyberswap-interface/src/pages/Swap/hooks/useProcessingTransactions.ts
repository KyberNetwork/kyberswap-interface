import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'
import { selectBackendTransactions } from 'services/crossChainTransactions'

import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useActiveWeb3React } from 'hooks'
import { isProcessingTransactionStatus } from 'pages/CrossChainSwap/adapters/types'
import { mergeTransactionHistory } from 'pages/CrossChainSwap/transactions/history'
import { useCrossChainTransactions } from 'state/crossChainSwap'
import { useAppSelector } from 'state/hooks'

// Read the same local/cache history as the full panel. Status polling remains
// owned by TransactionHistoryUpdater, independent of this panel's visibility.
export const useProcessingTransactions = () => {
  const { account } = useActiveWeb3React()
  const { publicKey } = useWallet()
  const { walletInfo } = useBitcoinWallet()
  const { signedAccountId } = useWalletSelector()
  const local = useCrossChainTransactions()
  const server = useAppSelector(selectBackendTransactions)
  const senders = new Set([account?.toLowerCase(), publicKey?.toString(), walletInfo?.address, signedAccountId])

  return [...senders]
    .flatMap(sender => (sender ? mergeTransactionHistory({ local, server, sender }) : []))
    .filter(tx => isProcessingTransactionStatus(tx.status))
    .sort((left, right) => right.timestamp - left.timestamp)
}

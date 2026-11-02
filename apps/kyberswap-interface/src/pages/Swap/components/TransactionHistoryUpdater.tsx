import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'
import { useGetTransactionsInfiniteQuerySubscription } from 'services/walletTransactionsApi'

import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useActiveWeb3React } from 'hooks'
import { useRestoreMyNearWalletTransaction } from 'pages/Swap/crossChain/adapters/NearIntentsAdapter/useRestoreMyNearWalletTransaction'
import { useTransactionHistory } from 'pages/Swap/crossChain/hooks/useTransactionHistory'
import { useBackendTransactionUpdater } from 'pages/Swap/crossChain/transactions/useBackendTransactionUpdater'

const WalletHistorySubscription = ({ sender }: { sender: string }) => {
  useGetTransactionsInfiniteQuerySubscription(sender, {
    skip: !sender,
    pollingInterval: 10_000,
    refetchOnMountOrArgChange: 15,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })
  return null
}

// The page-level owner keeps one live KD subscription per connected wallet. The
// History panel only reads this cache and owns cursor navigation.
const WalletHistorySubscriptions = () => {
  const { account } = useActiveWeb3React()
  const { publicKey } = useWallet()
  const { walletInfo } = useBitcoinWallet()
  const { signedAccountId } = useWalletSelector()
  const senders = useMemo(
    () =>
      [
        ...new Set(
          [account?.toLowerCase(), publicKey?.toString(), walletInfo?.address, signedAccountId].filter(Boolean),
        ),
      ] as string[],
    [account, publicKey, walletInfo?.address, signedAccountId],
  )
  return (
    <>
      {senders.map(sender => (
        <WalletHistorySubscription key={sender} sender={sender} />
      ))}
    </>
  )
}

const TransactionHistoryUpdater = () => {
  useRestoreMyNearWalletTransaction()
  useTransactionHistory()
  useBackendTransactionUpdater()
  return <WalletHistorySubscriptions />
}

export default TransactionHistoryUpdater

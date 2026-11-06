import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'
import { useGetTransactionsInfiniteQuerySubscription } from 'services/walletTransactionsApi'

import { useSwapWallets } from 'components/SwapWallets/SwapWalletContext'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useActiveWeb3React } from 'hooks'
import { useBackendTransactionUpdater } from 'state/crossChainSwap/useBackendTransactionUpdater'
import { useProviderTransactionUpdater } from 'state/crossChainSwap/useProviderTransactionUpdater'
import { useRestoreMyNearWalletTransaction } from 'state/crossChainSwap/useRestoreMyNearWalletTransaction'

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

// Unified Swap polls its input signer; legacy pages poll their connected wallets.
// History consumes this cache, so closing it does not stop polling.
const WalletHistorySubscriptions = () => {
  const swapWallets = useSwapWallets()
  const { account } = useActiveWeb3React()
  const { publicKey } = useWallet()
  const { walletInfo } = useBitcoinWallet()
  const { signedAccountId } = useWalletSelector()

  const inputAddress =
    swapWallets?.inputConnection?.family === 'evm' ? swapWallets.inputAddress.toLowerCase() : swapWallets?.inputAddress
  const fallbackSenders = useMemo(
    () =>
      [
        ...new Set(
          [account?.toLowerCase(), publicKey?.toString(), walletInfo?.address, signedAccountId].filter(Boolean),
        ),
      ] as string[],
    [account, publicKey, walletInfo?.address, signedAccountId],
  )

  const senders = swapWallets ? (inputAddress ? [inputAddress] : []) : fallbackSenders

  return (
    <>
      {senders.map(sender => (
        <WalletHistorySubscription key={sender} sender={sender} />
      ))}
    </>
  )
}

const TransactionUpdater = () => {
  useRestoreMyNearWalletTransaction()
  useProviderTransactionUpdater()
  useBackendTransactionUpdater()
  return <WalletHistorySubscriptions />
}

export default TransactionUpdater

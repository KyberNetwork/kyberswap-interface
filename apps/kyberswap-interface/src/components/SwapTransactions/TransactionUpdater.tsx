import { Suspense, lazy } from 'react'
import { useGetTransactionsInfiniteQuerySubscription } from 'services/walletTransactionsApi'

import { useSwapWallets } from 'components/SwapWallets/SwapWalletContext'
import { useActiveWeb3React } from 'hooks'
import { useCrossChainTransactions } from 'state/crossChainSwap'
import { useBackendTransactionUpdater } from 'state/crossChainSwap/useBackendTransactionUpdater'
import { useRestoreMyNearWalletTransaction } from 'state/crossChainSwap/useRestoreMyNearWalletTransaction'

const LegacyWalletHistorySubscriptions = lazy(() => import('./LegacyWalletHistorySubscriptions'))
const ProviderTransactionUpdater = lazy(() => import('./ProviderTransactionUpdater'))

export const WalletHistorySubscription = ({ sender }: { sender: string }) => {
  useGetTransactionsInfiniteQuerySubscription(sender, {
    skip: !sender,
    pollingInterval: 10_000,
    refetchOnMountOrArgChange: 15,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })
  return null
}

/** Keep settlement polling mounted while the form activates its lazy wallet providers. */
export const TransactionStatusUpdater = () => {
  const transactions = useCrossChainTransactions()
  useRestoreMyNearWalletTransaction()
  useBackendTransactionUpdater()

  // Existing transfers also need terminal enrichment after settlement, not only processing polls.
  return <Suspense fallback={null}>{transactions.length > 0 && <ProviderTransactionUpdater />}</Suspense>
}

export const WalletHistorySubscriptions = ({ evmOnly = false }: { evmOnly?: boolean }) => {
  const { account } = useActiveWeb3React()
  const wallets = useSwapWallets()
  const sender = wallets?.inputAddress ?? account ?? ''

  if (evmOnly || wallets) {
    return (
      <WalletHistorySubscription
        sender={wallets?.inputConnection?.family !== 'evm' && wallets ? sender : sender.toLowerCase()}
      />
    )
  }
  return (
    <Suspense fallback={null}>
      <LegacyWalletHistorySubscriptions />
    </Suspense>
  )
}

const TransactionUpdater = ({ evmOnly = false }: { evmOnly?: boolean }) => (
  <>
    <TransactionStatusUpdater />
    <WalletHistorySubscriptions evmOnly={evmOnly} />
  </>
)

export default TransactionUpdater

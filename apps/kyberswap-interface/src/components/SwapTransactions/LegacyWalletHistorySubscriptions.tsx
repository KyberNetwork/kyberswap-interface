import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'

import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useActiveWeb3React } from 'hooks'

import { WalletHistorySubscription } from './TransactionUpdater'

// Legacy KyberCross polls all connected wallets; Unified Swap uses its input signer.
const LegacyWalletHistorySubscriptions = () => {
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

export default LegacyWalletHistorySubscriptions

import { Trans } from '@lingui/macro'
import { useMemo } from 'react'
import { Activity } from 'react-feather'
import { useMedia } from 'react-use'

import { ButtonLight } from 'components/Button'
import CoinbaseSubscribeBtn from 'components/CoinbaseSubscribeBtn'
import WalletModal from 'components/Header/web3/WalletModal'
import Loader from 'components/Loader'
import { RowBetween } from 'components/Row'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { CONNECTOR_ICON_OVERRIDE_MAP } from 'components/Web3Provider'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useENSName from 'hooks/useENSName'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useNetworkModalToggle, useWalletModalToggle } from 'state/application/hooks'
import { isTransactionRecent, newTransactionsFirst, useAllTransactions } from 'state/transactions/hooks'
import { TransactionDetails } from 'state/transactions/type'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils/address'
import { cn } from 'utils/cn'

const STATUS_BASE_CLASS = cn(
  'flex w-fit cursor-pointer select-none flex-row flex-nowrap items-center gap-2 rounded-full px-3 py-2 font-medium focus:outline-none',
)

const Text = ({
  className,
  children,
  style,
}: {
  className?: string
  children: React.ReactNode
  style?: React.CSSProperties
}) => (
  <p style={style} className={cn('w-max shrink-0 whitespace-nowrap text-base font-medium', className)}>
    {children}
  </p>
)

function Web3StatusInner() {
  const { chainId, account, walletKey, isWrongNetwork } = useActiveWeb3React()
  const { connector } = useWeb3React()
  const { trackingHandler } = useTracking()
  const uptoMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const { ENSName } = useENSName(account ?? undefined)

  const allTransactions = useAllTransactions()

  const sortedRecentTransactions = useMemo(() => {
    const txs: TransactionDetails[] = allTransactions
      ? (Object.values(allTransactions)?.flat().filter(Boolean) as TransactionDetails[])
      : []
    return txs.filter(isTransactionRecent).sort(newTransactionsFirst)
  }, [allTransactions])

  const pendingLength = sortedRecentTransactions.filter(tx => !tx.receipt).length

  const hasPendingTransactions = !!pendingLength
  const toggleWalletModal = useWalletModalToggle()
  const toggleNetworkModal = useNetworkModalToggle()

  const icon = CONNECTOR_ICON_OVERRIDE_MAP[connector?.id || ''] ?? connector?.icon

  if (isWrongNetwork) {
    return (
      <button
        onClick={toggleNetworkModal}
        className={cn(
          STATUS_BASE_CLASS,
          'border border-red1 bg-red1 text-white hover:brightness-90 focus:brightness-90',
        )}
      >
        <Activity className="ml-1 mr-2 size-4" />
        <Text>
          <Trans>Wrong Network</Trans>
        </Text>
      </button>
    )
  }
  if (account) {
    return (
      <button
        id={TutorialIds.BUTTON_ADDRESS_WALLET}
        data-testid="web3-status-connected"
        onClick={e => {
          // Blur the trigger before the modal mounts. WalletModal sets
          // `bypassFocusLock={true}` (WalletConnect QR popup compatibility), so
          // focus would otherwise stay on this button while @reach/dialog sets
          // `aria-hidden` on its #app sibling — Chrome blocks that and warns.
          ;(e.currentTarget as HTMLElement).blur()
          toggleWalletModal()
          trackingHandler(TRACKING_EVENT_TYPE.WUI_WALLET_CLICK)
          trackingHandler(TRACKING_EVENT_TYPE.WALLET_MODAL_OPENED, {
            trigger: 'header_button',
            wallet_address: account,
          })
        }}
        className={cn(
          STATUS_BASE_CLASS,
          'border hover:border-border-primary hover:brightness-105 focus:border-primary focus:brightness-105',
          hasPendingTransactions
            ? 'border-primary bg-primary text-white hover:brightness-90 focus:brightness-90'
            : 'border-background bg-background text-subText',
        )}
      >
        {hasPendingTransactions ? (
          <RowBetween className="gap-2">
            <Text>
              <Trans>{pendingLength} Pending</Trans>
            </Text>{' '}
            <Loader className="text-white" />
          </RowBetween>
        ) : (
          <>
            {walletKey && <img src={icon} alt="" className="size-5 min-w-5 shrink-0" />}
            <Text>{ENSName || shortenAddress(chainId, account, uptoMedium ? 2 : undefined)}</Text>
            <CoinbaseSubscribeBtn onlyShowIfNotSubscribe />
          </>
        )}
      </button>
    )
  }

  return (
    <ButtonLight
      onClick={e => {
        // See note above on Web3StatusConnected.onClick — blur to avoid the
        // Chrome "blocked aria-hidden on a focused descendant" warning.
        ;(e.currentTarget as HTMLElement).blur()
        toggleWalletModal()
      }}
      className="h-[42px] px-3 py-2"
      id={TutorialIds.BUTTON_CONNECT_WALLET}
      data-testid="button-connect-wallet"
    >
      <Trans>Connect</Trans>
    </ButtonLight>
  )
}

export default function SelectWallet() {
  return (
    <div className="pointer-events-auto flex h-[42px] w-fit cursor-pointer flex-row items-center whitespace-nowrap rounded-full">
      <Web3StatusInner />
      <WalletModal />
    </div>
  )
}

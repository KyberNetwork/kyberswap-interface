import { Trans } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { isAndroid, isIOS } from 'react-device-detect'
import { useConnect } from 'wagmi'

import METAMASK_ICON from 'assets/wallets-connect/metamask.svg'
import EvmWalletOption from 'components/Header/web3/WalletModal/EvmWalletOption'
import { Options, Terms, WalletModalShell } from 'components/Header/web3/WalletModal/components'
import { useOrderedConnections } from 'components/Header/web3/WalletModal/useConnections'
import WalletPopup from 'components/WalletPopup'
import { registerPortoConnector } from 'components/Web3Provider'
import { setMetaMaskMobileLink, useMetaMaskMobileLink } from 'components/Web3Provider/metamaskMobileLink'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { ApplicationModal } from 'state/application/actions'
import { useCloseModal, useModalOpen, useOpenModal, useOpenNetworkModal } from 'state/application/hooks'
import { useIsAcceptedTerm } from 'state/user/hooks'

// Store page shown alongside the mobile "Open MetaMask" deep link, for users without the app.
const METAMASK_STORE_URL = isAndroid
  ? 'https://play.google.com/store/apps/details?id=io.metamask'
  : isIOS
  ? 'https://apps.apple.com/app/metamask/id1438144202'
  : 'https://metamask.io/download/'

const WalletModal = () => {
  const { isWrongNetwork, account } = useActiveWeb3React()
  const walletModalOpen = useModalOpen(ApplicationModal.WALLET)
  const closeWalletModal = useCloseModal(ApplicationModal.WALLET)
  const openWalletModal = useOpenModal(ApplicationModal.WALLET)
  const openNetworkModal = useOpenNetworkModal()

  const { isPending: isSomeOptionPending, isIdle, isError, reset } = useConnect()

  const [isAcceptedTerm, setIsAcceptedTerm] = useIsAcceptedTerm()

  const { trackingHandler } = useTracking()

  const connectors = useOrderedConnections()

  const [isPinnedPopupWallet, setPinnedPopupWallet] = useState(false)

  // On a native mobile browser the MetaMask SDK surfaces its connection deep link here (see
  // metamaskMobileLink). We render it as a tappable anchor instead of opening it automatically.
  const metaMaskLink = useMetaMaskMobileLink()
  const resetConnect = () => {
    setMetaMaskMobileLink(null)
    reset()
  }
  const onDismiss = () => {
    resetConnect()
    closeWalletModal()
  }

  const handleAcceptTermChange = (checked: boolean) => {
    if (checked && !isAcceptedTerm) {
      trackingHandler(TRACKING_EVENT_TYPE.WALLET_CONNECT_ACCEPT_TERM_CLICK)
    }
    setIsAcceptedTerm(checked)
  }

  // Porto registers itself during idle to keep its SDK out of the entry chunk (see
  // registerPortoConnector), which leaves a gap on a slow cold load where the list would render without
  // it. Opening this modal is the point where that stops being acceptable, so ask for it here too — the
  // call de-dupes, so whichever happens first wins.
  useEffect(() => {
    if (walletModalOpen) void registerPortoConnector()
  }, [walletModalOpen])

  // Drop a stale deep link once the attempt settles (success/error) or the modal closes, so the
  // "Open MetaMask" view never lingers into the next time the modal opens.
  useEffect(() => {
    if (!walletModalOpen || !isSomeOptionPending) {
      setMetaMaskMobileLink(null)
    }
  }, [walletModalOpen, isSomeOptionPending])

  useEffect(() => {
    if (isWrongNetwork) {
      openNetworkModal()
    }
  }, [isWrongNetwork, openNetworkModal])

  if (account) {
    return (
      <WalletPopup
        isPinned={isPinnedPopupWallet}
        setPinned={setPinnedPopupWallet}
        isModalOpen={walletModalOpen}
        onDismissModal={onDismiss}
        onOpenModal={openWalletModal}
      />
    )
  }

  return (
    <WalletModalShell
      title={isSomeOptionPending ? <Trans>Connecting Wallet</Trans> : <Trans>Connect your Wallet</Trans>}
      isOpen={walletModalOpen}
      onBack={isSomeOptionPending || isError ? resetConnect : undefined}
      onDismiss={onDismiss}
    >
      {metaMaskLink ? (
        <div className="flex flex-col items-center gap-4 pb-1 pt-2 text-center">
          <img src={METAMASK_ICON} alt="MetaMask" className="size-12 rounded-lg" />
          <span className="text-sm text-subText">
            <Trans>Tap the button below to open the MetaMask app and approve the connection.</Trans>
          </span>
          <a
            href={metaMaskLink}
            className="w-full rounded-full bg-primary py-2 text-center text-base font-medium !text-darkText hover:brightness-110"
          >
            <Trans>Open MetaMask</Trans>
          </a>
          <a
            href={METAMASK_STORE_URL}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-subText underline"
          >
            <Trans>No MetaMask app yet? Install it</Trans>
          </a>
        </div>
      ) : (
        <>
          {isIdle && <Terms checked={isAcceptedTerm} onChange={handleAcceptTermChange} />}

          <Options>
            {connectors.map(c => (
              <EvmWalletOption connector={c} key={c.uid} />
            ))}
          </Options>
        </>
      )}
    </WalletModalShell>
  )
}

export default WalletModal

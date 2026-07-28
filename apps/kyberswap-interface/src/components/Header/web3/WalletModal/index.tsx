import { Trans } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { isAndroid, isIOS } from 'react-device-detect'
import { useConnect } from 'wagmi'

import METAMASK_ICON from 'assets/wallets-connect/metamask.svg'
import {
  Content,
  Header,
  Options,
  Section,
  Shell,
  Terms,
  WalletOption,
} from 'components/Header/web3/WalletModal/components'
import { useOrderedConnections } from 'components/Header/web3/WalletModal/useConnections'
import Modal from 'components/Modal'
import WalletPopup from 'components/WalletPopup'
import { registerPortoConnector } from 'components/Web3Provider'
import { setMetaMaskMobileLink, useMetaMaskMobileLink } from 'components/Web3Provider/metamaskMobileLink'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { ApplicationModal } from 'state/application/actions'
import {
  useCloseModal,
  useModalOpen,
  useOpenModal,
  useOpenNetworkModal,
  useWalletModalToggle,
} from 'state/application/hooks'
import { useIsAcceptedTerm } from 'state/user/hooks'

// Store page shown alongside the mobile "Open MetaMask" deep link, for users without the app.
const METAMASK_STORE_URL = isAndroid
  ? 'https://play.google.com/store/apps/details?id=io.metamask'
  : isIOS
  ? 'https://apps.apple.com/app/metamask/id1438144202'
  : 'https://metamask.io/download/'

export {
  Content,
  Header,
  Icon,
  OptionButton,
  Options,
  Section,
  Shell,
  Terms,
} from 'components/Header/web3/WalletModal/components'

export default function WalletModal() {
  const { isWrongNetwork, account } = useActiveWeb3React()
  const walletModalOpen = useModalOpen(ApplicationModal.WALLET)
  const toggleWalletModal = useWalletModalToggle()
  const closeWalletModal = useCloseModal(ApplicationModal.WALLET)
  const openWalletModal = useOpenModal(ApplicationModal.WALLET)
  const openNetworkModal = useOpenNetworkModal()

  const { isPending: isSomeOptionPending, isIdle, isError, reset } = useConnect()

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

  const [isAcceptedTerm, setIsAcceptedTerm] = useIsAcceptedTerm()

  const { trackingHandler } = useTracking()

  useEffect(() => {
    if (isWrongNetwork) {
      openNetworkModal()
    }
  }, [isWrongNetwork, openNetworkModal])

  const connectors = useOrderedConnections()

  const [isPinnedPopupWallet, setPinnedPopupWallet] = useState(false)

  function getModalContent() {
    const isConnectingBackVisible = isSomeOptionPending || isError

    const handleAcceptTermChange = (checked: boolean) => {
      if (checked && !isAcceptedTerm) {
        trackingHandler(TRACKING_EVENT_TYPE.WALLET_CONNECT_ACCEPT_TERM_CLICK)
      }
      setIsAcceptedTerm(checked)
    }

    return (
      <Section>
        <Header
          title={!isSomeOptionPending ? <Trans>Connect your Wallet</Trans> : <Trans>Connecting Wallet</Trans>}
          onBack={isConnectingBackVisible ? resetConnect : undefined}
          onClose={() => {
            resetConnect()
            toggleWalletModal()
          }}
        />
        {metaMaskLink ? (
          <Content className="flex flex-col items-center gap-4 pb-1 pt-2 text-center">
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
          </Content>
        ) : (
          <div className="flex flex-col gap-4">
            {isIdle && <Terms checked={isAcceptedTerm} onChange={handleAcceptTermChange} />}
            <Content>
              <Options>
                {connectors.map(c => (
                  <WalletOption connector={c} key={c.uid} />
                ))}
              </Options>
            </Content>
          </div>
        )}
      </Section>
    )
  }

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
    <Modal
      isOpen={walletModalOpen}
      onDismiss={onDismiss}
      minHeight={false}
      maxHeight={90}
      maxWidth={600}
      bypassScrollLock={true}
      bypassFocusLock={true}
      zindex={99999}
    >
      <Shell>{getModalContent()}</Shell>
    </Modal>
  )
}

import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { ChevronLeft } from 'react-feather'
import { useConnect } from 'wagmi'

import { ReactComponent as Close } from 'assets/images/x.svg'
import Option from 'components/Header/web3/WalletModal/Option'
import { useOrderedConnections } from 'components/Header/web3/WalletModal/useConnections'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import WalletPopup from 'components/WalletPopup'
import { TERM_FILES_PATH } from 'constants/index'
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
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'

export const CloseIcon = ({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) => (
  <div onClick={onClick} className={cn('h-6 cursor-pointer self-end text-text hover:opacity-60', className)}>
    {children}
  </div>
)

export const ContentWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('mt-4 gap-4 rounded-b-[20px]', className)}>{children}</div>
)

export const TermAndCondition = ({
  children,
  onClick,
  className,
  style,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
}) => (
  <div
    onClick={onClick}
    style={style}
    className={cn(
      'flex cursor-pointer items-center rounded-2xl bg-buttonBlack/30 p-2 text-xs font-medium leading-4 accent-primary hover:bg-buttonBlack/50',
      className,
    )}
  >
    {children}
  </div>
)

export const UpperSection = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('relative p-6', className)}>{children}</div>
)

export const OptionGrid = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('grid grid-cols-2 items-center gap-4 max-sm:grid-cols-1', className)}>{children}</div>
)

const HoverText = ({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) => (
  <div
    onClick={onClick}
    className={cn('flex cursor-pointer items-center gap-1 text-xl hover:cursor-pointer', className)}
  >
    {children}
  </div>
)

export default function WalletModal() {
  const { isWrongNetwork, account } = useActiveWeb3React()
  const walletModalOpen = useModalOpen(ApplicationModal.WALLET)
  const toggleWalletModal = useWalletModalToggle()
  const closeWalletModal = useCloseModal(ApplicationModal.WALLET)
  const openWalletModal = useOpenModal(ApplicationModal.WALLET)
  const openNetworkModal = useOpenNetworkModal()

  const { isPending: isSomeOptionPending, isIdle, isError, reset } = useConnect()
  const onDismiss = () => {
    reset()
    closeWalletModal()
  }

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
    return (
      <UpperSection>
        <RowBetween className="mb-[26px] gap-5">
          {(isSomeOptionPending || isError) && (
            <HoverText onClick={() => reset()} className="mr-4 flex-1">
              <ChevronLeft className="text-primary" />
            </HoverText>
          )}
          <HoverText>
            {!isSomeOptionPending ? <Trans>Connect your Wallet</Trans> : <Trans>Connecting Wallet</Trans>}
          </HoverText>
          <CloseIcon
            onClick={() => {
              reset()
              toggleWalletModal()
            }}
          >
            <Close />
          </CloseIcon>
        </RowBetween>
        {isIdle && (
          <TermAndCondition
            onClick={() => {
              if (!isAcceptedTerm) {
                trackingHandler(TRACKING_EVENT_TYPE.WALLET_CONNECT_ACCEPT_TERM_CLICK)
              }
              setIsAcceptedTerm(!isAcceptedTerm)
            }}
          >
            <input
              type="checkbox"
              checked={isAcceptedTerm}
              onChange={() => {}}
              data-testid="accept-term"
              className="mr-3 size-3.5 min-w-3.5 cursor-pointer"
            />
            <span className="text-subText">
              <Trans>Accept </Trans>{' '}
              <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS} onClick={e => e.stopPropagation()}>
                <Trans>KyberSwap&lsquo;s Terms of Use</Trans>
              </ExternalLink>{' '}
              <Trans>and</Trans>{' '}
              <ExternalLink href={TERM_FILES_PATH.PRIVACY_POLICY} onClick={e => e.stopPropagation()}>
                <Trans>Privacy Policy</Trans>
              </ExternalLink>
              {'. '}
              <span className="text-[10px]">
                <Trans>Last updated: {dayjs(TERM_FILES_PATH.VERSION).format('DD MMM YYYY')}</Trans>
              </span>
            </span>
          </TermAndCondition>
        )}
        <ContentWrapper>
          <OptionGrid>
            {connectors.map(c => (
              <Option connector={c} key={c.uid} />
            ))}
          </OptionGrid>
        </ContentWrapper>
      </UpperSection>
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
      <div className="m-0 flex w-full flex-col flex-nowrap p-0">{getModalContent()}</div>
    </Modal>
  )
}

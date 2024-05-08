import { Trans } from '@lingui/macro'
import { ActivationStatus, useActivationState } from 'connection/activate'
import { ConnectionType } from 'connection/types'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import { useEffect, useState } from 'react'
import { ChevronLeft } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as Close } from 'assets/images/x.svg'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import WalletPopup from 'components/WalletPopup'
import { TERM_FILES_PATH } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import {
  useCloseModal,
  useModalOpen,
  useOpenModal,
  useOpenNetworkModal,
  useWalletModalToggle,
} from 'state/application/hooks'
import { useAppDispatch } from 'state/hooks'
import { clearRecentConnectionMeta } from 'state/user/actions'
import { useIsAcceptedTerm } from 'state/user/hooks'
import { ExternalLink } from 'theme'

import PendingView from './PendingView'
import { useConnections } from './useConnections'

const CloseIcon = styled.div`
  height: 24px;
  align-self: flex-end;
  cursor: pointer;
  color: ${({ theme }) => theme.text};
  &:hover {
    opacity: 0.6;
  }
`

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 0;
  width: 100%;
`

const ContentWrapper = styled.div`
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
`

export const TermAndCondition = styled.div`
  padding: 8px;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  background-color: ${({ theme }) => rgba(theme.buttonBlack, 0.35)};
  color: ${props => (props.color === 'blue' ? ({ theme }) => theme.primary : 'inherit')};
  accent-color: ${({ theme }) => theme.primary};
  border-radius: 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  :hover {
    background-color: ${({ theme }) => rgba(theme.buttonBlack, 0.5)};
  }
`

const UpperSection = styled.div`
  position: relative;
  padding: 24px;
  position: relative;
`

const gap = '1rem'
const OptionGrid = styled.div`
  display: flex;
  gap: ${gap};
  align-items: center;
  flex-wrap: wrap;
  margin-top: 16px;
  & > * {
    width: calc(33.33% - ${gap} * 2 / 3);
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    & > * {
      width: calc(50% - ${gap} / 2);
    }
  `}
`

const HoverText = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 20px;
  :hover {
    cursor: pointer;
  }
`

export default function WalletModal() {
  const { isWrongNetwork, account } = useActiveWeb3React()

  const { activationState, cancelActivation } = useActivationState()

  const theme = useTheme()
  const dispatch = useAppDispatch()

  const walletModalOpen = useModalOpen(ApplicationModal.WALLET)
  const toggleWalletModal = useWalletModalToggle()
  const closeWalletModal = useCloseModal(ApplicationModal.WALLET)
  const openWalletModal = useOpenModal(ApplicationModal.WALLET)
  const openNetworkModal = useOpenNetworkModal()

  const onDismiss = () => {
    cancelActivation()
    closeWalletModal()
  }

  const [isAcceptedTerm, setIsAcceptedTerm] = useIsAcceptedTerm()

  const { mixpanelHandler } = useMixpanel()

  useEffect(() => {
    if (isWrongNetwork) {
      openNetworkModal()
    }
  }, [isWrongNetwork, openNetworkModal])

  const { orderedConnections } = useConnections()

  const [isPinnedPopupWallet, setPinnedPopupWallet] = useState(false)

  const isSomeOptionPending = activationState.status === ActivationStatus.PENDING

  function getModalContent() {
    return (
      <UpperSection>
        <RowBetween marginBottom="26px" gap="20px">
          {(isSomeOptionPending || activationState.status === ActivationStatus.ERROR) && (
            <HoverText
              onClick={() => {
                cancelActivation()
              }}
              style={{ marginRight: '1rem', flex: 1 }}
            >
              <ChevronLeft color={theme.primary} />
            </HoverText>
          )}
          <HoverText>
            {!isSomeOptionPending ? <Trans>Connect your Wallet</Trans> : <Trans>Connecting Wallet</Trans>}
          </HoverText>
          <CloseIcon
            onClick={() => {
              cancelActivation()
              toggleWalletModal()
            }}
          >
            <Close />
          </CloseIcon>
        </RowBetween>
        {activationState.status === ActivationStatus.IDLE && (
          <TermAndCondition
            onClick={() => {
              if (!isAcceptedTerm) {
                mixpanelHandler(MIXPANEL_TYPE.WALLET_CONNECT_ACCEPT_TERM_CLICK)
              } else {
                dispatch(clearRecentConnectionMeta())
              }
              setIsAcceptedTerm(!isAcceptedTerm)
            }}
          >
            <input
              type="checkbox"
              checked={isAcceptedTerm}
              data-testid="accept-term"
              style={{ marginRight: '12px', height: '14px', width: '14px', minWidth: '14px', cursor: 'pointer' }}
            />
            <Text color={theme.subText}>
              <Trans>Accept </Trans>{' '}
              <ExternalLink href={TERM_FILES_PATH.KYBERSWAP_TERMS} onClick={e => e.stopPropagation()}>
                <Trans>KyberSwap&lsquo;s Terms of Use</Trans>
              </ExternalLink>{' '}
              <Trans>and</Trans>{' '}
              <ExternalLink href={TERM_FILES_PATH.PRIVACY_POLICY} onClick={e => e.stopPropagation()}>
                <Trans>Privacy Policy</Trans>
              </ExternalLink>
              {'. '}
              <Text fontSize={10} as="span">
                <Trans>Last updated: {dayjs(TERM_FILES_PATH.VERSION).format('DD MMM YYYY')}</Trans>
              </Text>
            </Text>
          </TermAndCondition>
        )}
        <ContentWrapper>
          {activationState.status !== ActivationStatus.IDLE ? (
            <PendingView />
          ) : (
            <OptionGrid>{orderedConnections}</OptionGrid>
          )}
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
      bypassScrollLock={isSomeOptionPending && activationState.connection.type === ConnectionType.WALLET_CONNECT_V2}
      bypassFocusLock={
        isSomeOptionPending && activationState.connection.type === ConnectionType.WALLET_CONNECT_V2
        // walletView === WALLET_VIEWS.PENDING && ['WALLET_CONNECT', 'KRYSTAL_WC', 'BLOCTO'].includes(pendingWalletKey)
      }
    >
      <Wrapper>{getModalContent()}</Wrapper>
    </Modal>
  )
}

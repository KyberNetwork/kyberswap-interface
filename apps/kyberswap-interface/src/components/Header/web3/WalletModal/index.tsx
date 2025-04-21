import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { darken, rgba } from 'polished'
import { useEffect, useState } from 'react'
import { ChevronLeft } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'
import { useConnect } from 'wagmi'

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
import { useIsAcceptedTerm } from 'state/user/hooks'
import { ExternalLink } from 'theme'

import Option from './Option'
import { useOrderedConnections } from './useConnections'
import { useNEARWallet } from 'components/Web3Provider/NearProvider'
import { useSearchParams } from 'react-router-dom'
import { NETWORKS_INFO } from 'constants/networks'
import { ChainId } from '@kyberswap/ks-sdk-core'

enum ChainType {
  Evm = 'Evm',
  Near = 'Near',
}

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
  display: grid;
  grid-template-columns: 1fr 2fr;
  margin-top: 1rem;
  gap: 1rem;
`

const ChainColumn = styled.div`
  display: flex;
  flex-direction: column;
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

const ChainOption = styled.div<{ selected: boolean }>`
  height: 36px;
  width: 100%;
  border-radius: 18px;
  display: flex;
  gap: 8px;
  font-size: 14px;
  align-items: center;
  cursor: pointer;
  padding: 8px 10px;
  background-color: ${({ selected, theme }) => (selected ? darken(0.1, theme.tableHeader) : undefined)};

  &:hover {
    background-color: ${({ theme }) => darken(0.1, theme.tableHeader)};
    color: ${({ theme }) => theme.text} !important;
  }

  img {
    width: 20px;
    height: 20px;
    border-radius: 8px;
  }
`

const OptionGrid = styled.div`
  display: grid;
  gap: 1rem;
  align-items: center;
  grid-template-columns: repeat(2, 1fr);

  ${({ theme }) => theme.mediaWidth.upToSmall`
     grid-template-columns: 1fr;
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

  const theme = useTheme()

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

  const { mixpanelHandler } = useMixpanel()

  useEffect(() => {
    if (isWrongNetwork) {
      openNetworkModal()
    }
  }, [isWrongNetwork, openNetworkModal])

  const connectors = useOrderedConnections()

  const [isPinnedPopupWallet, setPinnedPopupWallet] = useState(false)

  const { connect } = useNEARWallet()
  const [searchParams, setSearchParams] = useSearchParams()
  const rawChainType = searchParams.get('chainType')

  // Validate that chainType is a valid enum value, default to Evm if not
  const chainType = Object.values(ChainType).includes(rawChainType as ChainType)
    ? (rawChainType as ChainType)
    : ChainType.Evm

  function getModalContent() {
    return (
      <UpperSection>
        <RowBetween marginBottom="26px" gap="20px">
          {(isSomeOptionPending || isError) && (
            <HoverText
              onClick={() => {
                reset()
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
                mixpanelHandler(MIXPANEL_TYPE.WALLET_CONNECT_ACCEPT_TERM_CLICK)
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
          <ChainColumn>
            <Text color={theme.subText} fontSize={14} ml="16px" mb="12px" fontWeight="500x">
              CHAIN
            </Text>
            <ChainOption
              selected={chainType === ChainType.Evm}
              role="button"
              onClick={() => {
                searchParams.set('chainType', ChainType.Evm)
                setSearchParams(searchParams)
              }}
            >
              <img src={NETWORKS_INFO[ChainId.MAINNET].icon} alt="EVM" />
              <Text>EVM</Text>
            </ChainOption>
            <ChainOption
              style={{ marginTop: '0.5rem' }}
              selected={chainType === ChainType.Near}
              role="button"
              onClick={() => {
                toggleWalletModal()
                reset()
                connect()
              }}
            >
              <img
                src={
                  'https://storage.googleapis.com/ks-setting-1d682dca/000c677f-2ebc-44cc-8d76-e4c6d07627631744962669170.png'
                }
                alt="Near"
              />
              <Text>Near</Text>
            </ChainOption>
          </ChainColumn>
          <div>
            <Text color={theme.subText} fontSize={14} ml="16px" mb="12px" fontWeight="500x">
              WALLET
            </Text>

            <OptionGrid>
              {connectors.map(c => (
                <Option connector={c} key={c.uid} />
              ))}
            </OptionGrid>
          </div>
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
      bypassScrollLock={
        true
        //isSomeOptionPending
        //&& activationState.connection.type === ConnectionType.WALLET_CONNECT_V2
      }
      bypassFocusLock={
        true
        //isSomeOptionPending
        //&& activationState.connection.type === ConnectionType.WALLET_CONNECT_V2
        // walletView === WALLET_VIEWS.PENDING && ['WALLET_CONNECT', 'KRYSTAL_WC', 'BLOCTO'].includes(pendingWalletKey)
      }
      zindex={99999}
    >
      <Wrapper>{getModalContent()}</Wrapper>
    </Modal>
  )
}

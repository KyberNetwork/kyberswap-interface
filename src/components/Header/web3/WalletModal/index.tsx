import { Trans } from '@lingui/macro'
import { ChainType, getChainType } from '@namgold/ks-sdk-core'
import { BaseMessageSignerWalletAdapter } from '@solana/wallet-adapter-base'
import { useWallet } from '@solana/wallet-adapter-react'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { UnsupportedChainIdError } from '@web3-react/core'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { useEffect, useState } from 'react'
import { ChevronLeft } from 'react-feather'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'

import { ReactComponent as Close } from 'assets/images/x.svg'
import AccountDetails from 'components/Header/web3/AccountDetails'
import Networks from 'components/Header/web3/NetworkModal/Networks'
import Modal from 'components/Modal'
import { isEVM } from 'constants/networks'
import { SUPPORTED_WALLET, SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/useChangeNetwork'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import usePrevious from 'hooks/usePrevious'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useOpenNetworkModal, useWalletModalToggle } from 'state/application/hooks'
import { useAppDispatch } from 'state/hooks'
import { updateChainId } from 'state/user/actions'
import { useIsAcceptedTerm, useIsUserManuallyDisconnect } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { isEVMWallet, isSolanaWallet } from 'utils'

import Option from './Option'
import PendingView from './PendingView'

const CloseIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 16px;
  padding: 8px;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const CloseColor = styled(Close)`
  path {
    stroke: ${({ theme }) => theme.text4};
  }
`

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 0;
  width: 100%;
`

const HeaderRow = styled.div<{ padding?: string }>`
  ${({ theme }) => theme.flexRowNoWrap};
  padding: ${({ padding }) => padding ?? '30px 24px 0 24px'};
  font-weight: 500;
  color: ${props => (props.color === 'blue' ? ({ theme }) => theme.primary : 'inherit')};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1.5rem 1rem 1rem;
  `};
`

const ContentWrapper = styled.div<{ padding?: string }>`
  padding: ${({ padding }) => padding ?? '24px'};
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;

  ${({ theme }) => theme.mediaWidth.upToMedium`padding: 1rem`};
`

const TermAndCondition = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  padding: 28px 24px 0px 24px;
  font-weight: 500;
  color: ${props => (props.color === 'blue' ? ({ theme }) => theme.primary : 'inherit')};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
  accent-color: ${({ theme }) => theme.primary};
`

const UpperSection = styled.div`
  position: relative;

  h5 {
    margin: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    font-weight: 400;
  }

  h5:last-child {
    margin-bottom: 0px;
  }

  h4 {
    margin-top: 0;
    font-weight: 500;
  }
`

const OptionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  gap: 16px;
  margin-top: 16px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr 1fr;
    grid-gap: 10px;
  `};
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

const ToSText = styled.span`
  color: ${({ theme }) => theme.text9};
  font-weight: 500;
`

const WALLET_VIEWS = {
  CHANGE_WALLET: 'CHANGE_WALLET',
  ACCOUNT: 'account',
  PENDING: 'pending',
}

export default function WalletModal({
  pendingTransactions,
  confirmedTransactions,
  ENSName,
}: {
  pendingTransactions: string[] // hashes of pending
  confirmedTransactions: string[] // hashes of confirmed
  ENSName?: string
}) {
  const { chainId, account } = useActiveWeb3React()
  const chainType = getChainType(chainId)
  // important that these are destructed from the account-specific web3-react context
  const { active, connector, activate, error, chainId: chainIdEVM } = useWeb3React()
  const { connected, connecting, wallet: solanaWallet, select } = useWallet()
  const [justConnectedWallet, setJustConnectedWallet] = useState(false)
  const dispatch = useAppDispatch()

  const changeNetwork = useChangeNetwork()
  const [, setIsUserManuallyDisconnect] = useIsUserManuallyDisconnect()

  const theme = useTheme()

  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT)

  const [pendingWalletKey, setPendingWalletKey] = useState<SUPPORTED_WALLET | undefined>()

  const [pendingError, setPendingError] = useState<boolean>()

  const walletModalOpen = useModalOpen(ApplicationModal.WALLET)
  const toggleWalletModal = useWalletModalToggle()
  const openNetworkModal = useOpenNetworkModal()

  const previousAccount = usePrevious(account)

  const [isAcceptedTerm, setIsAcceptedTerm] = useIsAcceptedTerm()

  const location = useLocation()
  const { mixpanelHandler } = useMixpanel()

  // close on connection, when logged out before
  useEffect(() => {
    if (account && !previousAccount && walletModalOpen) {
      if (location.pathname.startsWith('/campaigns')) {
        mixpanelHandler(MIXPANEL_TYPE.CAMPAIGN_WALLET_CONNECTED)
      }
      toggleWalletModal()
    }
  }, [account, previousAccount, toggleWalletModal, walletModalOpen, location.pathname, mixpanelHandler])

  useEffect(() => {
    if (error && error instanceof UnsupportedChainIdError) {
      openNetworkModal()
    }
  }, [error, openNetworkModal])

  // always reset to account view
  useEffect(() => {
    if (walletModalOpen) {
      setPendingError(false)
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [walletModalOpen])

  // close modal when a connection is successful
  const activePrevious = usePrevious(active)
  const connectorPrevious = usePrevious(connector)

  useEffect(() => {
    if (walletModalOpen && ((active && !activePrevious) || (connector && connector !== connectorPrevious && !error))) {
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [setWalletView, active, error, connector, walletModalOpen, activePrevious, connectorPrevious])

  useEffect(() => {
    // when waiting for connecting wallet done, check if wallet has been connected or not
    // setPendingError base on connected result
    // Known issue: C98 solana connected but not return connected = true
    if (!connecting) {
      setPendingError(!connected)
    }
  }, [connecting, connected])

  const tryActivation = async (walletKey: SUPPORTED_WALLET) => {
    const wallet = SUPPORTED_WALLETS[walletKey]
    setPendingWalletKey(walletKey)
    setWalletView(WALLET_VIEWS.PENDING)
    setPendingError(false)

    const chainType = getChainType(chainId)
    if (chainType === ChainType.EVM && isEVMWallet(wallet) && !wallet.href) tryActivationEVM(wallet.connector)
    if (chainType === ChainType.SOLANA && isSolanaWallet(wallet) && wallet.adapter !== solanaWallet?.adapter)
      tryActivationSolana(wallet.adapter)
  }

  const tryActivationEVM = async (connector: AbstractConnector | undefined) => {
    // if the connector is walletconnect and the user has already tried to connect, manually reset the connector
    if (connector instanceof WalletConnectConnector && connector.walletConnectProvider?.wc?.uri) {
      connector.walletConnectProvider = undefined
    }

    if (connector) {
      await activate(connector, undefined, true)
        .then(() => {
          setJustConnectedWallet(true)
          setIsUserManuallyDisconnect(false)
        })
        .catch(error => {
          if (error instanceof UnsupportedChainIdError) {
            activate(connector)
          } else {
            setPendingError(true)
          }
        })
    }
  }

  useEffect(() => {
    if (isEVM(chainId) && chainIdEVM && chainId !== chainIdEVM && active && justConnectedWallet) {
      // when connected to wallet, wallet's network might not match with desire network
      // we need to update network state by wallet's network (chainIdEVM)
      dispatch(updateChainId(chainIdEVM))
      // request change network if wallet's network not match with desire network by asking approve change network
      changeNetwork(chainId)
    }
  }, [active, chainId, chainIdEVM, changeNetwork, dispatch, justConnectedWallet])

  useEffect(() => {
    const timeout = setTimeout(() => setJustConnectedWallet(false), 1000)
    return () => clearTimeout(timeout)
  }, [justConnectedWallet])

  const tryActivationSolana = async (adapter: BaseMessageSignerWalletAdapter) => {
    try {
      select(adapter.name)
      setIsUserManuallyDisconnect(false)
    } catch (e) {
      setPendingError(true)
    }
  }

  function getOptions() {
    const sortWallets = (walletAKey: SUPPORTED_WALLET, walletBKey: SUPPORTED_WALLET) => {
      const walletA = SUPPORTED_WALLETS[walletAKey]
      const walletB = SUPPORTED_WALLETS[walletBKey]
      const isWalletAEVM = isEVMWallet(walletA)
      const isWalletASolana = isSolanaWallet(walletA)
      const isWalletBEVM = isEVMWallet(walletB)
      const isWalletBSolana = isSolanaWallet(walletB)

      let aPoint = 0
      let bPoint = 0
      if (chainType === ChainType.EVM) {
        if (isWalletAEVM) aPoint++
        if (isWalletBEVM) bPoint++
      } else if (chainType === ChainType.SOLANA) {
        if (isWalletASolana) aPoint++
        if (isWalletBSolana) bPoint++
      }
      return bPoint - aPoint
    }

    return (Object.keys(SUPPORTED_WALLETS) as SUPPORTED_WALLET[])
      .sort(sortWallets)
      .map(key => <Option key={key} walletKey={key} onSelected={tryActivation} />)
      .filter(Boolean)
  }

  function getModalContent() {
    if (error) {
      return (
        <UpperSection>
          <CloseIcon onClick={toggleWalletModal}>
            <CloseColor />
          </CloseIcon>
          <HeaderRow padding="1rem">
            <Trans>Error connecting</Trans>
          </HeaderRow>
          <ContentWrapper padding="1rem 1.5rem 1.5rem">
            <Trans>Error connecting. Try refreshing the page.</Trans>
          </ContentWrapper>
        </UpperSection>
      )
    }
    if (account && walletView === WALLET_VIEWS.ACCOUNT) {
      return (
        <AccountDetails
          toggleWalletModal={toggleWalletModal}
          pendingTransactions={pendingTransactions}
          confirmedTransactions={confirmedTransactions}
          ENSName={ENSName}
          openOptions={() => setWalletView(WALLET_VIEWS.CHANGE_WALLET)}
        />
      )
    }

    return (
      <UpperSection>
        <CloseIcon onClick={toggleWalletModal}>
          <CloseColor />
        </CloseIcon>
        <HeaderRow>
          {(walletView === WALLET_VIEWS.CHANGE_WALLET || walletView === WALLET_VIEWS.PENDING) && (
            <HoverText
              onClick={() => {
                setPendingError(false)
                setWalletView(WALLET_VIEWS.ACCOUNT)
              }}
              style={{ marginRight: '1rem' }}
            >
              <ChevronLeft color={theme.primary} />
            </HoverText>
          )}
          <HoverText>
            {walletView === WALLET_VIEWS.ACCOUNT ? (
              <Trans>Connect your Wallet</Trans>
            ) : walletView === WALLET_VIEWS.CHANGE_WALLET ? (
              <Trans>Change Wallet</Trans>
            ) : (
              <Trans>Connecting Wallet</Trans>
            )}
          </HoverText>
        </HeaderRow>
        {(walletView === WALLET_VIEWS.ACCOUNT || walletView === WALLET_VIEWS.CHANGE_WALLET) && (
          <TermAndCondition>
            <input
              type="checkbox"
              checked={isAcceptedTerm}
              onChange={() => setIsAcceptedTerm(!isAcceptedTerm)}
              style={{ marginRight: '12px' }}
            />
            <ToSText>
              <Trans>Accept</Trans>{' '}
              <ExternalLink href="/15022022KyberSwapTermsofUse.pdf">
                <Trans>Terms of Use</Trans>
              </ExternalLink>{' '}
              <Trans>and</Trans>{' '}
              <ExternalLink href="http://files.dmm.exchange/privacy.pdf">
                <Trans>Privacy Policy</Trans>
              </ExternalLink>
            </ToSText>
          </TermAndCondition>
        )}
        <ContentWrapper>
          {walletView === WALLET_VIEWS.PENDING ? (
            <PendingView
              walletKey={pendingWalletKey}
              hasError={pendingError}
              onClickTryAgain={() => {
                pendingWalletKey && tryActivation(pendingWalletKey)
              }}
            />
          ) : (
            <>
              <Trans>Select a Network</Trans>
              <Networks width={5} mt={16} mb={24} isAcceptedTerm={isAcceptedTerm} />
              <Trans>Select a Wallet</Trans>
              <OptionGrid>{getOptions()}</OptionGrid>
            </>
          )}
        </ContentWrapper>
      </UpperSection>
    )
  }

  return (
    <Modal
      isOpen={walletModalOpen}
      onDismiss={toggleWalletModal}
      minHeight={false}
      maxHeight={90}
      width={walletView === WALLET_VIEWS.ACCOUNT || walletView === WALLET_VIEWS.CHANGE_WALLET ? 'unset' : undefined}
      maxWidth={account && walletView === WALLET_VIEWS.ACCOUNT ? 544 : 752}
    >
      <Wrapper>{getModalContent()}</Wrapper>
    </Modal>
  )
}

import { Trans } from '@lingui/macro'
import { darken } from 'polished'
import React from 'react'
import styled, { css } from 'styled-components'

import { MouseoverTooltip } from 'components/Tooltip'
import { SUPPORTED_WALLET, SUPPORTED_WALLETS, WalletReadyState } from 'constants/wallets'
import { useActiveWeb3React } from 'hooks'
import { useIsAcceptedTerm } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import checkForBraveBrowser from 'utils/checkForBraveBrowser'

import { C98OverrideGuide } from './WarningBox'

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;

  & > img,
  span {
    height: 20px;
    width: 20px;
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: flex-end;
  `};
`

const HeaderText = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  color: ${({ theme }) => theme.subText};
  font-weight: 500;
`

const OptionCardClickable = styled.div<{
  connected: boolean
  installLink?: string
  isDisabled?: boolean
  overridden?: boolean
}>`
  height: 36px;
  width: 100%;
  border-radius: 18px;
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  background-color: ${({ theme }) => theme.tableHeader};
  overflow: hidden;
  white-space: nowrap;
  font-size: 14px;

  cursor: ${({ isDisabled, installLink, overridden }) =>
    !isDisabled && !installLink && !overridden ? 'pointer' : 'not-allowed'};

  ${({ isDisabled, connected, theme }) =>
    !isDisabled && connected
      ? `
      background-color: ${theme.primary};
      & ${HeaderText} {
        color: ${theme.darkText} !important;
      }
    `
      : ''}

  &:hover {
    text-decoration: none;
    ${({ installLink, isDisabled, overridden }) =>
      installLink || isDisabled || overridden
        ? ''
        : css`
            background-color: ${({ theme }) => darken(0.1, theme.tableHeader)};
            color: ${({ theme }) => theme.text} !important;
          `}
  }

  ${({ isDisabled, installLink, overridden, theme }) =>
    isDisabled || installLink || overridden
      ? `
      filter: grayscale(100%);
      & ${HeaderText} {
        color: ${theme.border};
      }
    `
      : ''}
`

const OptionCardLeft = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  justify-content: center;
  height: 100%;
`

const StyledLink = styled(ExternalLink)`
  width: 100%;
  &:hover {
    text-decoration: none;
  }
`

const Option = ({
  walletKey,
  readyState,
  installLink,
  isOverridden,
  onSelected,
}: {
  walletKey: SUPPORTED_WALLET
  readyState?: WalletReadyState
  installLink?: string
  isOverridden?: boolean
  onSelected?: (walletKey: SUPPORTED_WALLET) => any
}) => {
  const { walletKey: walletKeyConnected } = useActiveWeb3React()
  const isBraveBrowser = checkForBraveBrowser()
  const [isAcceptedTerm] = useIsAcceptedTerm()

  const wallet = SUPPORTED_WALLETS[walletKey]
  const isConnected = !!walletKeyConnected && walletKey === walletKeyConnected

  const icon = wallet.icon

  const content = (
    <OptionCardClickable
      role="button"
      id={`connect-${walletKey}`}
      data-testid={`connect-${walletKey}`}
      onClick={
        onSelected &&
        !isConnected &&
        readyState === WalletReadyState.Installed &&
        isAcceptedTerm &&
        !isOverridden &&
        !(walletKey === 'BRAVE' && !isBraveBrowser)
          ? () => onSelected(walletKey)
          : undefined
      }
      connected={isConnected}
      isDisabled={!isAcceptedTerm}
      installLink={installLink}
      overridden={isOverridden}
    >
      <IconWrapper>
        <img src={icon} alt={'Icon'} />
      </IconWrapper>
      <OptionCardLeft>
        <HeaderText>{wallet.name}</HeaderText>
      </OptionCardLeft>
    </OptionCardClickable>
  )

  if (!isAcceptedTerm) return content

  if (readyState === WalletReadyState.Loadable && wallet.href) {
    return <StyledLink href={wallet.href}>{content}</StyledLink>
  }

  if (walletKey === 'WALLET_CONNECT') {
    return (
      <MouseoverTooltip placement="bottom" text={<Trans>Under development and unsupported by most wallets.</Trans>}>
        {content}
      </MouseoverTooltip>
    )
  }

  if (walletKey === 'BRAVE') {
    // Brave wallet only can use in Brave browser
    if (!isBraveBrowser) {
      return (
        <MouseoverTooltip
          placement="bottom"
          text={
            <Trans>
              Brave wallet can only be used in Brave Browser. Download it{' '}
              <ExternalLink href={wallet.installLink || ''}>here↗</ExternalLink>
            </Trans>
          }
        >
          {content}
        </MouseoverTooltip>
      )
    }
    // Brave wallet overrided by Metamask extension
    if (isBraveBrowser && !window.ethereum?.isBraveWallet) {
      return (
        <MouseoverTooltip
          placement="bottom"
          text={
            <Trans>
              Brave Wallet overridden by MetaMask Wallet. Disable MetaMask extension in order to use Brave Wallet.
            </Trans>
          }
        >
          {content}
        </MouseoverTooltip>
      )
    }
    // Brave wallet overrided by Metamask extension
    if (isBraveBrowser) {
      return (
        <MouseoverTooltip
          placement="bottom"
          text={
            <Trans>
              Brave Wallet overridden by Phantom Wallet. Disable Phantom extension in order to use Brave Wallet.
            </Trans>
          }
        >
          {content}
        </MouseoverTooltip>
      )
    }
  }

  if (readyState === WalletReadyState.NotDetected) {
    return (
      <MouseoverTooltip
        placement="bottom"
        text={
          <Trans>
            You will need to install {wallet.name} extension/dapp before you can connect with it on KyberSwap. Get it{' '}
            <ExternalLink href={wallet.installLink || ''}>here↗</ExternalLink>
          </Trans>
        }
      >
        {content}
      </MouseoverTooltip>
    )
  }

  if (isOverridden) {
    return (
      <MouseoverTooltip
        width="fit-content"
        maxWidth="500px"
        text={
          walletKey === 'COIN98' ? (
            <Trans>
              You need to enable <b>&quot;Override Wallet&quot;</b> in Coin98 settings.
            </Trans>
          ) : (
            <C98OverrideGuide walletKey={walletKey} isOpened={false} />
          )
        }
        placement="bottom"
      >
        {content}
      </MouseoverTooltip>
    )
  }

  return content
}

export default React.memo(Option)

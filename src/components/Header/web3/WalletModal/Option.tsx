import { darken } from 'polished'
import React from 'react'
import styled, { css } from 'styled-components'
import { Connector, useConnect } from 'wagmi'

import { CONNECTOR_ICON_OVERRIDE_MAP } from 'components/Web3Provider'
import { useActiveWeb3React } from 'hooks'
import { useCloseModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/types'
import { useIsAcceptedTerm } from 'state/user/hooks'

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

// const StyledLink = styled(ExternalLink)`
//   width: 100%;
//   &:hover {
//     text-decoration: none;
//   }
// `

const Option = ({ connector }: { connector: Connector }) => {
  const [isAcceptedTerm] = useIsAcceptedTerm()

  const { chainId } = useActiveWeb3React()

  const { name } = connector
  const icon = CONNECTOR_ICON_OVERRIDE_MAP[connector.id] ?? connector.icon

  const closeWalletModal = useCloseModal(ApplicationModal.WALLET)
  const {
    variables,
    isPending: isSomeOptionPending,
    connect,
  } = useConnect({
    mutation: {
      onSuccess: () => {
        closeWalletModal()
      },
      onError: e => {
        console.log(e)
      },
    },
  })

  const isCurrentOptionPending = isSomeOptionPending && variables.connector === connector

  const content = (
    <OptionCardClickable
      role="button"
      id={`connect-${name}`}
      onClick={() => {
        if (isAcceptedTerm) {
          connect({ connector, chainId: chainId as any })
        }
      }}
      connected={isCurrentOptionPending}
      isDisabled={!isAcceptedTerm}
    >
      <IconWrapper>
        <img src={icon} alt={'Icon'} />
      </IconWrapper>
      <OptionCardLeft>
        <HeaderText>{name}</HeaderText>
      </OptionCardLeft>
    </OptionCardClickable>
  )

  if (!isAcceptedTerm) return content

  // if (readyState === WalletReadyState.NotDetected) {
  //   return (
  //     <MouseoverTooltip
  //       placement="bottom"
  //       text={
  //         <Trans>
  //           You will need to install {wallet.name} extension/dapp before you can connect with it on KyberSwap. Get it{' '}
  //           <ExternalLink href={wallet.installLink || ''}>here↗</ExternalLink>
  //         </Trans>
  //       }
  //     >
  //       {content}
  //     </MouseoverTooltip>
  //   )
  // }
  //
  // if (isOverridden) {
  //   return (
  //     <MouseoverTooltip
  //       width="fit-content"
  //       maxWidth="500px"
  //       text={
  //         walletKey === 'COIN98' ? (
  //           <Trans>
  //             You need to enable <b>&quot;Override Wallet&quot;</b> in Coin98 settings.
  //           </Trans>
  //         ) : (
  //           <C98OverrideGuide walletKey={walletKey} isOpened={false} />
  //         )
  //       }
  //       placement="bottom"
  //     >
  //       {content}
  //     </MouseoverTooltip>
  //   )
  // }

  return content
}

export default React.memo(Option)

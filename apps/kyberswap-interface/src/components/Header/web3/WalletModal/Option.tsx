import { t } from '@lingui/macro'
import { darken } from 'polished'
import React, { useRef } from 'react'
import styled, { css } from 'styled-components'
import { Connector, useConnect, useSwitchChain } from 'wagmi'

import { NotificationType } from 'components/Announcement/type'
import { CONNECTION, CONNECTOR_ICON_OVERRIDE_MAP } from 'components/Web3Provider'
import { NETWORKS_INFO, isSupportedChainId } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useCloseModal, useNotify } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/types'
import { useIsAcceptedTerm } from 'state/user/hooks'

export const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;

  & > img,
  span {
    height: 20px;
    width: 20px;
    border-radius: 4px;
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: flex-end;
  `};
`

export const HeaderText = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  color: ${({ theme }) => theme.subText};
  font-weight: 500;
`

export const OptionCardClickable = styled.div<{
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
      background-color: ${theme.primary} !important;
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

export const OptionCardLeft = styled.div`
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
  const notify = useNotify()

  const { name } = connector
  const icon = CONNECTOR_ICON_OVERRIDE_MAP[connector.id] ?? connector.icon

  const closeWalletModal = useCloseModal(ApplicationModal.WALLET)
  const { switchChainAsync } = useSwitchChain()
  // Capture at click-time — watchChainId rewrites Redux right after the WC
  // session resolves, so reading useActiveWeb3React in onSuccess would race.
  const intendedChainIdRef = useRef<number | undefined>(undefined)
  const {
    variables,
    isPending: isSomeOptionPending,
    connect,
  } = useConnect({
    mutation: {
      onSuccess: async data => {
        closeWalletModal()
        if (connector.id !== CONNECTION.WALLET_CONNECT_CONNECTOR_ID) return
        const intended = intendedChainIdRef.current
        if (!intended || !isSupportedChainId(intended) || data.chainId === intended) return
        // switchChain in a separate phase so failures don't roll back the
        // connection (wagmi's internal post-pair switchChain rethrows
        // UserRejectedRequestError, which leaves wagmi state half-set).
        await switchChainAsync({ chainId: intended as any }).catch(() => {
          // Stay on the session chain — NetworkModal handles manual recovery.
        })
      },
      onError: e => {
        console.log(e)
        // Surface a user-friendly notification when the wallet can't be used
        // on the current chain. Two known patterns:
        //   - Porto throws "Could not find a compatible Porto chain on the
        //     given chain configuration" — its supported chain list is
        //     hardcoded in the SDK.
        //   - Compass (and similar Cosmos-EVM extensions) throw "Compass does
        //     not support 'wallet_addEthereumChain' method as of now" — they
        //     can't add a new chain because they only target one chain.
        // Walk the error chain so we catch the reason even when wagmi wraps
        // it inside a UserRejectedRequestError.
        const extractErrorText = (err: unknown): string => {
          if (!err) return ''
          if (typeof err === 'string') return err
          const e = err as { message?: string; details?: string; cause?: unknown }
          return [e.message, e.details, extractErrorText(e.cause)].filter(Boolean).join(' ')
        }
        const text = extractErrorText(e)
        const isChainIncompatible =
          /compatible .* chain on the given chain configuration/i.test(text) ||
          /does not support .*wallet_(add|switch)ethereumchain/i.test(text)
        if (isChainIncompatible) {
          const walletName = connector.name
          const chainName = isSupportedChainId(chainId) ? NETWORKS_INFO[chainId]?.name : ''
          notify({
            type: NotificationType.ERROR,
            title: t`Wallet not supported on this chain`,
            summary: chainName
              ? t`${walletName} does not support ${chainName} yet. Please switch chain or try a different wallet.`
              : t`${walletName} does not support the selected chain. Please switch chain or try a different wallet.`,
          })
        }
      },
    },
  })

  const isCurrentOptionPending = isSomeOptionPending && variables.connector === connector

  const content = (
    <OptionCardClickable
      role="button"
      id={`connect-${name}`}
      onClick={() => {
        if (!isAcceptedTerm) return
        intendedChainIdRef.current = chainId
        // Skip the chainId hint for WalletConnect — wagmi's post-pair
        // switchChain rethrows UserRejectedRequestError, which rolls back the
        // whole connect mutation and leaves the WC session orphaned in its
        // own storage. Realigned in onSuccess instead.
        if (connector.id === CONNECTION.WALLET_CONNECT_CONNECTOR_ID) {
          connect({ connector })
        } else {
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

import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import React, { useState } from 'react'
import { ArrowUpCircle, BarChart2 } from 'react-feather'
import { useWatchAsset } from 'wagmi'

import { ReactComponent as Alert } from 'assets/images/alert.svg'
import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { RowBetween, RowFixed } from 'components/Row'
import { HStack, Stack } from 'components/Stack'
import { CONNECTOR_ICON_OVERRIDE_MAP } from 'components/Web3Provider'
import ListGridViewGroup from 'components/YieldPools/ListGridViewGroup'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { VIEW_MODE } from 'state/user/reducer'
import { ExternalLinkNoLineHeight } from 'theme'
import { CloseIcon } from 'theme/components'
import { friendlyError } from 'utils/errorMessage'
import { getEtherscanLink } from 'utils/explorer'
import { getTokenLogoURL } from 'utils/tokenLogo'

type ConfirmationPendingContentProps = {
  onDismiss: () => void
  pendingText: string | React.ReactNode
  // Override the default title/subtitle, e.g. to show a "Preparing Transaction"
  // phase before the wallet prompt actually opens. Defaults preserve the
  // original "Waiting For Confirmation" copy.
  title?: React.ReactNode
  subtitle?: React.ReactNode
}

export function ConfirmationPendingContent({
  onDismiss,
  pendingText,
  title,
  subtitle,
}: ConfirmationPendingContentProps) {
  return (
    <div className="w-full overflow-y-auto">
      <div className="flex flex-col gap-2 p-5">
        <RowBetween className="min-h-6 shrink-0">
          <div />
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex size-16 shrink-0 items-center justify-center">
            <Loader size="64px" className="text-primary" strokeWidth="1" />
          </div>
          <div className="flex w-full flex-col items-center justify-center gap-3">
            <span className="text-xl font-medium">{title ?? <Trans>Waiting For Confirmation</Trans>}</span>
            <span className="max-w-full text-sm font-semibold">{pendingText}</span>
            <span className="text-sm font-medium text-subText-40">
              {subtitle ?? <Trans>Confirm this transaction in your wallet</Trans>}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

type AddTokenToInjectedWalletProps = {
  token: Token
  chainId: ChainId
}

function AddTokenToInjectedWallet({ token, chainId }: AddTokenToInjectedWalletProps) {
  const { connector } = useWeb3React()
  // Routes wallet_watchAsset through the active connector's provider so it works for the
  // metaMask SDK on mobile (no window.ethereum) as well as desktop injected wallets.
  const { mutate: watchAsset } = useWatchAsset()
  const handleClick = () => {
    watchAsset(
      {
        type: 'ERC20',
        options: {
          address: token.address,
          symbol: token.symbol ?? '',
          decimals: token.decimals,
          image: getTokenLogoURL(token.address, chainId),
        },
      },
      {
        onError: error => {
          console.error(error)
        },
      },
    )
  }

  if (!connector || connector?.name === 'WalletConnect') return null
  const { name } = connector
  const icon = CONNECTOR_ICON_OVERRIDE_MAP[connector.id] ?? connector.icon

  return (
    <ButtonLight padding="6px 12px" width="fit-content" onClick={handleClick}>
      <RowFixed className="gap-1.5">
        <Trans>
          Add {token.symbol} to {name}
        </Trans>
        <img src={icon} className="size-4" />
      </RowFixed>
    </ButtonLight>
  )
}

type TransactionSubmittedContentProps = {
  onDismiss: () => void
  hash: string | undefined
  scanLink?: string
  chainId: ChainId
  tokenAddToMetaMask?: Token
}

export function TransactionSubmittedContent({
  onDismiss,
  chainId,
  hash,
  tokenAddToMetaMask,
  scanLink,
}: TransactionSubmittedContentProps) {
  return (
    <div className="w-full overflow-y-auto">
      <Stack className="gap-2 p-5">
        <RowBetween className="min-h-6 shrink-0">
          <div />
          <CloseIcon onClick={onDismiss} />
        </RowBetween>

        <Stack className="items-center gap-4 text-center">
          <ArrowUpCircle strokeWidth={0.5} className="size-12 shrink-0 text-primary" />
          <Stack className="w-full items-center gap-[5px]">
            <span className="text-base font-medium leading-6">
              <Trans>Transaction Submitted</Trans>
            </span>
            {hash && (
              <ExternalLinkNoLineHeight href={scanLink || getEtherscanLink(chainId, hash, 'transaction')}>
                <span className="text-sm font-medium text-primary">
                  <Trans>View transaction</Trans>
                </span>
              </ExternalLinkNoLineHeight>
            )}
          </Stack>
          {tokenAddToMetaMask?.address && <AddTokenToInjectedWallet token={tokenAddToMetaMask} chainId={chainId} />}
          <Stack className="w-full items-center gap-2">
            <ButtonPrimary onClick={onDismiss}>
              <Trans>Close</Trans>
            </ButtonPrimary>
          </Stack>
        </Stack>
      </Stack>
    </div>
  )
}

type ConfirmationModalContentProps = {
  title: string
  showGridListOption?: boolean
  onDismiss: () => void
  topContent: () => React.ReactNode
  bottomContent: () => React.ReactNode
}

export function ConfirmationModalContent({
  title,
  showGridListOption = false,
  bottomContent,
  onDismiss,
  topContent,
}: ConfirmationModalContentProps) {
  return (
    <div className="w-full overflow-y-auto">
      <AutoColumn className="p-5">
        <RowBetween>
          <span className="text-xl font-medium">{title}</span>
          <div className="flex items-center gap-[18px]">
            {showGridListOption && <ListGridViewGroup customIcons={{ [VIEW_MODE.GRID]: <BarChart2 size="28px" /> }} />}
            <CloseIcon onClick={onDismiss} />
          </div>
        </RowBetween>
        {topContent()}
      </AutoColumn>

      <AutoColumn className="gap-0 rounded-b-[20px] px-5 pb-7 pt-0">{bottomContent()}</AutoColumn>
    </div>
  )
}

type TransactionErrorContentProps = {
  message: string
  onDismiss: () => void
  confirmAction?: () => void
  confirmText?: string
  confirmBtnStyle?: React.CSSProperties
  dismissBtnStyle?: React.CSSProperties
  suggestionMessage?: React.ReactNode
}

export function TransactionErrorContent({
  message,
  onDismiss,
  confirmAction,
  confirmText,
  confirmBtnStyle,
  dismissBtnStyle,
  suggestionMessage,
}: TransactionErrorContentProps) {
  const [showDetail, setShowDetail] = useState<boolean>(false)

  return (
    <div className="w-full overflow-y-auto">
      <Stack className="gap-2 p-5">
        <RowBetween className="min-h-6 shrink-0">
          <span className="text-xl font-medium leading-none">
            <Trans>Error</Trans>
          </span>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <Stack className="items-center gap-4 text-center">
          <Alert className="size-12 shrink-0" />
          <Stack className="w-full items-center gap-[5px]">
            <span className="text-base font-medium leading-6 text-red">{friendlyError(message)}</span>
            {message !== friendlyError(message) && (
              <Stack className="w-full items-center gap-2">
                <span
                  className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80"
                  onClick={() => setShowDetail(prev => !prev)}
                >
                  {showDetail ? t`Show less` : t`Show more`}
                </span>
                {showDetail && (
                  <div className="max-h-[200px] w-full overflow-y-scroll break-words rounded bg-buttonBlack/40 p-3 text-center text-[10px] leading-4 text-text">
                    {typeof message === 'string' ? message : JSON.stringify(message)}
                  </div>
                )}
              </Stack>
            )}
            {suggestionMessage}
          </Stack>

          <HStack className="w-full gap-2">
            {confirmAction && confirmText ? (
              <ButtonOutlined onClick={onDismiss} style={dismissBtnStyle}>
                <Trans>Dismiss</Trans>
              </ButtonOutlined>
            ) : (
              <ButtonPrimary onClick={onDismiss} style={dismissBtnStyle}>
                <Trans>Dismiss</Trans>
              </ButtonPrimary>
            )}
            {confirmAction && confirmText && (
              <ButtonPrimary onClick={confirmAction} style={confirmBtnStyle}>
                {confirmText}
              </ButtonPrimary>
            )}
          </HStack>
        </Stack>
      </Stack>
    </div>
  )
}

type TransactionConfirmationModalProps = {
  isOpen: boolean
  onDismiss: () => void
  hash: string | undefined
  content: () => React.ReactNode
  attemptingTxn: boolean
  attemptingTxnContent?: () => React.ReactNode
  pendingText: string | React.ReactNode
  tokenAddToMetaMask?: Currency
  maxWidth?: string | number
  width?: string
  scanLink?: string
}

export default function TransactionConfirmationModal({
  isOpen,
  onDismiss,
  scanLink,
  attemptingTxn,
  attemptingTxnContent,
  hash,
  pendingText,
  content,
  tokenAddToMetaMask,
  maxWidth = 420,
  width,
}: TransactionConfirmationModalProps) {
  const { chainId } = useActiveWeb3React()

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      maxHeight={90}
      maxWidth={!attemptingTxn && !hash ? maxWidth : undefined}
      width={!attemptingTxn && !hash ? width : undefined}
    >
      {attemptingTxn ? (
        attemptingTxnContent ? (
          attemptingTxnContent()
        ) : (
          <ConfirmationPendingContent onDismiss={onDismiss} pendingText={pendingText} />
        )
      ) : hash ? (
        <TransactionSubmittedContent
          chainId={chainId}
          scanLink={scanLink}
          hash={hash}
          onDismiss={onDismiss}
          tokenAddToMetaMask={tokenAddToMetaMask as Token}
        />
      ) : (
        content()
      )}
    </Modal>
  )
}

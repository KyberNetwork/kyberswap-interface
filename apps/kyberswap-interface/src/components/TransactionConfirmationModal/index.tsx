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
import { CONNECTOR_ICON_OVERRIDE_MAP } from 'components/Web3Provider'
import ListGridViewGroup from 'components/YieldPools/ListGridViewGroup'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { VIEW_MODE } from 'state/user/reducer'
import { ExternalLink } from 'theme'
import { CloseIcon } from 'theme/components'
import { getEtherscanLink, getTokenLogoURL } from 'utils'
import { cn } from 'utils/cn'
import { friendlyError } from 'utils/errorMessage'

const SECTION_CLASS = 'p-5'
const STATUS_SECTION_CLASS = cn(SECTION_CLASS, 'flex flex-col gap-5')
const STATUS_MAIN_CLASS = 'flex flex-col items-center justify-center gap-4 text-center'
const STATUS_ICON_CLASS = 'flex size-16 shrink-0 items-center justify-center'
const STATUS_TEXT_CLASS = 'flex w-full flex-col items-center justify-center gap-3'
const STATUS_ACTION_CLASS = 'flex w-full flex-col items-center gap-3'

export function ConfirmationPendingContent({
  onDismiss,
  pendingText,
}: {
  onDismiss: () => void
  pendingText: string | React.ReactNode
}) {
  return (
    <div className="w-full overflow-y-auto">
      <div className={STATUS_SECTION_CLASS}>
        <RowBetween className="min-h-6 shrink-0">
          <div />
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <div className={STATUS_MAIN_CLASS}>
          <div className={STATUS_ICON_CLASS}>
            <Loader size="64px" className="text-primary" strokeWidth="1" />
          </div>
          <div className={STATUS_TEXT_CLASS}>
            <span className="text-xl font-medium">
              <Trans>Waiting For Confirmation</Trans>
            </span>
            <span className="max-w-full text-sm font-semibold">{pendingText}</span>
            <span className="text-sm font-medium text-subText-40">
              <Trans>Confirm this transaction in your wallet</Trans>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddTokenToInjectedWallet({ token, chainId }: { token: Token; chainId: ChainId }) {
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
      <RowFixed>
        <Trans>
          Add {token.symbol} to {name}
        </Trans>{' '}
        <img src={icon} className="ml-1.5 size-4" />
      </RowFixed>
    </ButtonLight>
  )
}

export function TransactionSubmittedContent({
  onDismiss,
  chainId,
  hash,
  tokenAddToMetaMask,
  scanLink,
}: {
  onDismiss: () => void
  hash: string | undefined
  scanLink?: string
  chainId: ChainId
  tokenAddToMetaMask?: Token
}) {
  return (
    <div className="w-full overflow-y-auto">
      <div className={STATUS_SECTION_CLASS}>
        <RowBetween className="min-h-6 shrink-0">
          <div />
          <CloseIcon onClick={onDismiss} />
        </RowBetween>

        <div className={STATUS_MAIN_CLASS}>
          <div className={STATUS_ICON_CLASS}>
            <ArrowUpCircle strokeWidth={0.5} size={64} className="text-primary" />
          </div>
          <div className={STATUS_TEXT_CLASS}>
            <span className="text-xl font-medium">
              <Trans>Transaction Submitted</Trans>
            </span>
            {hash && (
              <ExternalLink href={scanLink || getEtherscanLink(chainId, hash, 'transaction')}>
                <span className="text-sm font-medium text-primary">
                  <Trans>View transaction</Trans>
                </span>
              </ExternalLink>
            )}
          </div>
        </div>

        <div className={STATUS_ACTION_CLASS}>
          {tokenAddToMetaMask?.address && <AddTokenToInjectedWallet token={tokenAddToMetaMask} chainId={chainId} />}
          <ButtonPrimary onClick={onDismiss}>
            <span className="text-sm font-medium">
              <Trans>Close</Trans>
            </span>
          </ButtonPrimary>
        </div>
      </div>
    </div>
  )
}

export function ConfirmationModalContent({
  title,
  showGridListOption = false,
  bottomContent,
  onDismiss,
  topContent,
}: {
  title: string
  showGridListOption?: boolean
  onDismiss: () => void
  topContent: () => React.ReactNode
  bottomContent: () => React.ReactNode
}) {
  return (
    <div className="w-full overflow-y-auto">
      <AutoColumn className={SECTION_CLASS}>
        <RowBetween>
          <span className="text-xl font-medium">{title}</span>
          <div className="flex items-center gap-[18px]">
            {showGridListOption && <ListGridViewGroup customIcons={{ [VIEW_MODE.GRID]: <BarChart2 size="28px" /> }} />}
            <CloseIcon onClick={onDismiss} />
          </div>
        </RowBetween>
        {topContent()}
      </AutoColumn>

      <AutoColumn className={cn(SECTION_CLASS, 'gap-0 rounded-b-[20px] pb-7 pt-0')}>{bottomContent()}</AutoColumn>
    </div>
  )
}

export function TransactionErrorContent({
  message,
  onDismiss,
  confirmAction,
  confirmText,
  confirmBtnStyle,
  dismissBtnStyle,
  suggestionMessage,
}: {
  message: string
  onDismiss: () => void
  confirmAction?: () => void
  confirmText?: string
  confirmBtnStyle?: React.CSSProperties
  dismissBtnStyle?: React.CSSProperties
  suggestionMessage?: React.ReactNode
}) {
  const [showDetail, setShowDetail] = useState<boolean>(false)

  return (
    <div className="w-full overflow-y-auto">
      <div className={cn(SECTION_CLASS, 'flex flex-col gap-5')}>
        <RowBetween className="min-h-6 shrink-0">
          <span className="text-xl font-medium leading-none">
            <Trans>Error</Trans>
          </span>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <div className="flex flex-col items-center gap-3 text-center">
          <Alert className="size-16 shrink-0" />
          <span className="w-[85%] text-base font-medium leading-6 text-red">{friendlyError(message)}</span>
          {message !== friendlyError(message) && (
            <div className="flex w-full flex-col items-center gap-3">
              <span
                className="cursor-pointer text-sm text-primary hover:text-primary/80"
                onClick={() => setShowDetail(prev => !prev)}
              >
                {showDetail ? t`Show less` : t`Show more details`}
              </span>
              {showDetail && (
                <div className="max-h-[200px] w-full overflow-y-scroll break-words rounded bg-buttonBlack/40 p-3 text-center text-[10px] leading-4 text-text">
                  {typeof message === 'string' ? message : JSON.stringify(message)}
                </div>
              )}
            </div>
          )}
          {suggestionMessage}
        </div>
        <div className="flex gap-4">
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
        </div>
      </div>
    </div>
  )
}

interface ConfirmationModalProps {
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
}: ConfirmationModalProps) {
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

import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import React, { useState } from 'react'
import { ArrowUpCircle, BarChart2 } from 'react-feather'
import { useWatchAsset } from 'wagmi'

import { ReactComponent as Alert } from 'assets/images/alert.svg'
import Banner from 'components/Banner'
import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { RowBetween, RowFixed } from 'components/Row'
import { CONNECTOR_ICON_OVERRIDE_MAP } from 'components/Web3Provider'
import ListGridViewGroup from 'components/YieldPools/ListGridViewGroup'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { VIEW_MODE } from 'state/user/reducer'
import { ExternalLink } from 'theme'
import { CloseIcon } from 'theme/components'
import { getEtherscanLink, getTokenLogoURL } from 'utils'
import { cn } from 'utils/cn'
import { friendlyError } from 'utils/errorMessage'

const SECTION_CLASS = 'p-5'

export function ConfirmationPendingContent({
  onDismiss,
  pendingText,
}: {
  onDismiss: () => void
  pendingText: string | React.ReactNode
}) {
  const theme = useTheme()

  return (
    <div className="w-full overflow-y-auto">
      <AutoColumn className={SECTION_CLASS}>
        <RowBetween>
          <div />
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <div className="flex w-full flex-col items-center py-[30px]">
          <Loader size="90px" stroke={theme.primary} strokeWidth="1" />
        </div>
        <AutoColumn gap="12px" justify={'center'}>
          <span className="text-xl font-medium">
            <Trans>Waiting For Confirmation</Trans>
          </span>
          <AutoColumn gap="12px" justify={'center'}>
            <span className="text-center text-sm font-semibold">{pendingText}</span>
          </AutoColumn>
          <span className="text-center text-xs text-[#565A69]">
            <Trans>Confirm this transaction in your wallet</Trans>
          </span>
        </AutoColumn>
      </AutoColumn>
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
    <ButtonLight mt="12px" padding="6px 12px" width="fit-content" onClick={handleClick}>
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
  showTxBanner = true,
  scanLink,
}: {
  onDismiss: () => void
  hash: string | undefined
  scanLink?: string
  chainId: ChainId
  tokenAddToMetaMask?: Token
  showTxBanner?: boolean
}) {
  return (
    <div className="w-full overflow-y-auto">
      <AutoColumn className={SECTION_CLASS}>
        {!showTxBanner && (
          <RowBetween>
            <div />
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        )}
        {showTxBanner && <Banner isInModal />}

        <div className="flex w-full flex-col items-center py-[30px]">
          <ArrowUpCircle strokeWidth={0.5} size={90} className="text-primary" />
        </div>
        <AutoColumn gap="16px" justify={'center'}>
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
          {tokenAddToMetaMask?.address && <AddTokenToInjectedWallet token={tokenAddToMetaMask} chainId={chainId} />}
          <ButtonPrimary onClick={onDismiss} style={{ margin: '24px 0 0 0' }}>
            <span className="text-sm font-medium">
              <Trans>Close</Trans>
            </span>
          </ButtonPrimary>
        </AutoColumn>
      </AutoColumn>
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

      <AutoColumn gap="0" className={cn(SECTION_CLASS, 'rounded-b-[20px] pb-7 pt-0')}>
        {bottomContent()}
      </AutoColumn>
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
  const theme = useTheme()
  const [showDetail, setShowDetail] = useState<boolean>(false)

  return (
    <div className="w-full overflow-y-auto">
      <AutoColumn className={SECTION_CLASS}>
        <RowBetween>
          <span className="text-xl font-medium">
            <Trans>Error</Trans>
          </span>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <AutoColumn style={{ marginTop: 20 }} gap="8px" justify="center">
          <Alert className="size-[108px]" />
          <span className="w-[85%] text-center text-base font-medium leading-6" style={{ color: theme.red }}>
            {friendlyError(message)}
          </span>
          {message !== friendlyError(message) && (
            <AutoColumn justify="center" style={{ width: '100%' }}>
              <span className="cursor-pointer text-sm text-primary" onClick={() => setShowDetail(prev => !prev)}>
                {showDetail ? t`Show less` : t`Show more details`}
              </span>
              {showDetail && (
                <AutoColumn className="mt-3 max-h-[200px] w-full overflow-y-scroll break-words rounded bg-buttonBlack/40 p-3 text-center text-[10px] leading-4 text-text">
                  {typeof message === 'string' ? message : JSON.stringify(message)}
                </AutoColumn>
              )}
            </AutoColumn>
          )}
          {suggestionMessage}
        </AutoColumn>
      </AutoColumn>
      <AutoColumn gap="12px" className={cn(SECTION_CLASS, 'rounded-b-[20px] pb-7 pt-0')}>
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
      </AutoColumn>
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
  showTxBanner?: boolean
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
  showTxBanner,
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
          showTxBanner={showTxBanner}
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

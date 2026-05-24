import { Trans, t } from '@lingui/macro'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft, FileText, LogOut, StopCircle, X } from 'react-feather'

import { ReactComponent as DragHandleIcon } from 'assets/svg/wallet_drag_handle.svg'
import CopyHelper from 'components/Copy'
import SendIcon from 'components/Icons/SendIcon'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import AccountInfo from 'components/WalletPopup/AccountInfo'
import MyAssets from 'components/WalletPopup/MyAssets'
import PinButton from 'components/WalletPopup/PinButton'
import SendToken from 'components/WalletPopup/SendToken'
import { CONNECTOR_ICON_OVERRIDE_MAP } from 'components/Web3Provider'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import useDisconnectWallet from 'hooks/web3/useDisconnectWallet'
import { useTokensHasBalance } from 'state/wallet/hooks'
import { ExternalLinkIcon } from 'theme'
import { getEtherscanLink, shortenAddress } from 'utils'
import { cn } from 'utils/cn'

import ReceiveToken from './ReceiveToken'
import RewardCenter from './RewardCenter'
import ListTransaction from './Transactions'
import { View as getView } from './type'

export const HANDLE_CLASS_NAME = 'walletPopupDragHandle'

type Props = {
  onDismiss: () => void
  onPin?: () => void
  onUnpin?: () => void
  isPinned: boolean
  blurBackground?: boolean
  showBalance: boolean
  toggleShowBalance: () => void
}

// This is intentional, we don't need to persist in localStorage
let storedView: string | undefined = undefined

export default function WalletView({
  onDismiss,
  onPin,
  isPinned,
  blurBackground = false,
  onUnpin,
  showBalance,
  toggleShowBalance,
}: Props) {
  const View = getView()
  const [view, setView] = useState<string>(storedView || View.ASSETS)
  const theme = useTheme()
  const { trackingHandler } = useTracking()
  const nodeRef = useRef<HTMLDivElement>(null)
  const [isMinimal, setMinimal] = useState(false)
  const { chainId, account = '', walletKey } = useActiveWeb3React()
  const { connector } = useWeb3React()

  const disconnectWallet = useDisconnectWallet()

  const {
    loading: loadingTokens,
    currencies,
    currencyBalances,
    totalBalanceInUsd,
    usdBalances,
  } = useTokensHasBalance(true)

  const [hasNetworkIssue, setHasNetworkIssue] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => setHasNetworkIssue(loadingTokens), 10_000)
    return () => clearTimeout(timeout)
  }, [loadingTokens])

  const tabBase =
    'flex cursor-pointer select-none items-center gap-1 pb-2.5 font-medium text-subText hover:text-primary'

  const underTab = (
    <Row gap="20px" style={{ borderBottom: `1px solid ${theme.border}` }}>
      <div
        className={cn(tabBase, view === View.ASSETS && 'text-primary')}
        onClick={() => {
          trackingHandler(TRACKING_EVENT_TYPE.WALLET_TAB_SWITCHED, {
            previous_tab: view === View.TRANSACTIONS ? 'transactions' : 'assets',
            new_tab: 'assets',
            wallet_address: account,
          })
          setView(View.ASSETS)
        }}
      >
        <StopCircle size={16} /> <Trans>Assets</Trans>
      </div>
      <div
        className={cn(tabBase, view === View.TRANSACTIONS && 'text-primary')}
        onClick={() => {
          trackingHandler(TRACKING_EVENT_TYPE.WUI_TRANSACTION_CLICK)
          trackingHandler(TRACKING_EVENT_TYPE.WALLET_TAB_SWITCHED, {
            previous_tab: view === View.ASSETS ? 'assets' : 'transactions',
            new_tab: 'transactions',
            wallet_address: account,
          })
          setView(View.TRANSACTIONS)
        }}
      >
        <FileText size={16} /> <Trans>Transactions</Trans>
      </div>
    </Row>
  )

  const renderAccountInfo = () => {
    const handleClickReceive = () => {
      setView(View.RECEIVE_TOKEN)
      trackingHandler(TRACKING_EVENT_TYPE.WUI_BUTTON_CLICK, { button_name: 'Receive' })
      trackingHandler(TRACKING_EVENT_TYPE.WALLET_RECEIVE_CLICKED, {
        total_balance_usd: totalBalanceInUsd,
        wallet_address: account,
        chain: NETWORKS_INFO[chainId]?.name,
      })
    }
    const handleClickSend = () => {
      setView(View.SEND_TOKEN)
      trackingHandler(TRACKING_EVENT_TYPE.WUI_BUTTON_CLICK, { button_name: 'Send' })
      trackingHandler(TRACKING_EVENT_TYPE.WALLET_SEND_CLICKED, {
        total_balance_usd: totalBalanceInUsd,
        wallet_address: account,
        chain: NETWORKS_INFO[chainId]?.name,
      })
    }

    return (
      <AccountInfo
        toggleShowBalance={toggleShowBalance}
        showBalance={showBalance}
        totalBalanceInUsd={hasNetworkIssue ? '--' : totalBalanceInUsd}
        onClickReceive={handleClickReceive}
        onClickSend={handleClickSend}
        isMinimal={isMinimal}
        disabledSend={!currencies.length}
        setView={setView}
      />
    )
  }

  const renderContent = () => {
    switch (view) {
      case View.TRANSACTIONS:
        return (
          <div className="flex flex-1 flex-col gap-3.5">
            {renderAccountInfo()}
            {underTab}
            <ListTransaction isMinimal={isMinimal} />
          </div>
        )
      case View.ASSETS:
        return (
          <div className="flex flex-1 flex-col gap-3.5">
            {renderAccountInfo()}
            {underTab}
            <MyAssets
              hideBalance={!showBalance}
              hasNetworkIssue={hasNetworkIssue}
              loadingTokens={loadingTokens}
              tokens={currencies}
              usdBalances={usdBalances}
              currencyBalances={currencyBalances}
            />
          </div>
        )
      case View.SEND_TOKEN:
        return <SendToken loadingTokens={loadingTokens} currencies={currencies} currencyBalances={currencyBalances} />
      case View.RECEIVE_TOKEN:
        return <ReceiveToken />
      case View.REWARD_CENTER:
        return <RewardCenter />
    }
    return null
  }

  const isSendTab = view === View.SEND_TOKEN
  const isShowArrow = isSendTab || view === View.RECEIVE_TOKEN
  const isShowBack = isShowArrow || view === View.REWARD_CENTER

  useLayoutEffect(() => {
    // handle minimal mode when width & height become small

    const { ResizeObserver } = window
    const node = nodeRef.current
    if (!node) {
      return
    }

    const resizeHandler = () => {
      const { clientWidth, clientHeight } = node
      setMinimal(clientWidth <= 360 || clientHeight <= 480)
    }

    if (typeof ResizeObserver === 'function') {
      const resizeObserver = new ResizeObserver(resizeHandler)
      resizeObserver.observe(node)

      return () => resizeObserver.disconnect()
    } else {
      window.addEventListener('resize', resizeHandler)
      return () => window.removeEventListener('resize', resizeHandler)
    }
  }, [nodeRef])

  useEffect(() => {
    storedView = view
  }, [view])

  const classNameForHandle = isPinned ? HANDLE_CLASS_NAME : ''
  const cursorForHandle = isPinned ? 'move' : undefined

  const icon = CONNECTOR_ICON_OVERRIDE_MAP[connector?.id || ''] ?? connector?.icon

  return (
    <div
      ref={nodeRef}
      className={cn(
        'flex h-auto w-full overflow-hidden rounded-tl-[20px] bg-tabActive pt-0 shadow-[0px_0px_12px_8px_rgb(0_0_0_/_4%)] max-md:pb-0',
        isPinned && 'rounded-[20px]',
        blurBackground && 'bg-tabActive/[0.92] backdrop-blur-sm',
      )}
    >
      <div className={classNameForHandle} style={{ height: '100%', flex: '0 0 20px', cursor: cursorForHandle }} />

      <div className="flex size-full flex-col">
        <div className={cn('mb-2 flex w-full flex-col', classNameForHandle)} style={{ cursor: cursorForHandle }}>
          {isPinned && (
            <div className="flex h-3 items-center justify-center pt-2">
              <DragHandleIcon />
            </div>
          )}

          <div className="flex shrink-0 grow-0 basis-12 items-center justify-between">
            {isShowBack ? (
              <>
                <ChevronLeft cursor="pointer" size={28} onClick={() => setView(View.ASSETS)} className="text-subText" />
                <div className="flex items-center">
                  {isShowArrow && (
                    <SendIcon style={{ marginRight: 7, transform: isSendTab ? 'unset' : 'rotate(180deg)' }} />
                  )}{' '}
                  {view}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-subText">
                {walletKey && (
                  <div className="flex size-5 items-center justify-center">
                    <img height={18} src={icon} alt="" />
                  </div>
                )}
                <span className="font-medium">{shortenAddress(chainId, account, 5, false)}</span>
                <MouseoverTooltip text={t`Copy wallet address`} width="fit-content" placement="top">
                  <span
                    onClick={() =>
                      trackingHandler(TRACKING_EVENT_TYPE.WALLET_ADDRESS_COPIED, {
                        wallet_address: account,
                        chain: NETWORKS_INFO[chainId]?.name,
                      })
                    }
                  >
                    <CopyHelper toCopy={account} />
                  </span>
                </MouseoverTooltip>
                <MouseoverTooltip text={t`Open scan explorer`} width="fit-content" placement="top">
                  <span
                    onClick={() =>
                      trackingHandler(TRACKING_EVENT_TYPE.WALLET_EXTERNAL_LINK_CLICKED, {
                        wallet_address: account,
                        explorer_url: getEtherscanLink(chainId, account, 'address'),
                        chain: NETWORKS_INFO[chainId]?.name,
                      })
                    }
                  >
                    <ExternalLinkIcon href={getEtherscanLink(chainId, account, 'address')} className="text-subText" />
                  </span>
                </MouseoverTooltip>
                <MouseoverTooltip text={t`Disconnect wallet`} width="fit-content" placement="top">
                  <LogOut
                    size={16}
                    onClick={disconnectWallet}
                    className="cursor-pointer text-subText hover:no-underline hover:opacity-80"
                  />
                </MouseoverTooltip>
              </div>
            )}
            <div className="flex items-center gap-5">
              {onPin && onUnpin && <PinButton isActive={isPinned} onClick={isPinned ? onUnpin : onPin} />}
              <X
                onClick={() => {
                  trackingHandler(TRACKING_EVENT_TYPE.WALLET_MODAL_CLOSED, {
                    close_method: 'x_button',
                    wallet_address: account,
                  })
                  onDismiss()
                }}
                className="text-subText"
                cursor="pointer"
              />
            </div>
          </div>
        </div>

        {renderContent()}

        <div
          className={cn('h-5 w-full shrink-0 grow-0 basis-5', classNameForHandle)}
          style={{ cursor: cursorForHandle }}
        />
      </div>

      <div className={classNameForHandle} style={{ height: '100%', flex: '0 0 20px', cursor: cursorForHandle }} />
    </div>
  )
}

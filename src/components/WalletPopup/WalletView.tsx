import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft, FileText, LogOut, StopCircle, X } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DragHandleIcon } from 'assets/svg/wallet_drag_handle.svg'
import CopyHelper from 'components/Copy'
import SendIcon from 'components/Icons/SendIcon'
import Row from 'components/Row'
import AccountInfo from 'components/WalletPopup/AccountInfo'
import MyAssets from 'components/WalletPopup/MyAssets'
import PinButton from 'components/WalletPopup/PinButton'
import SendToken from 'components/WalletPopup/SendToken'
import { APP_PATHS } from 'constants/index'
import { SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import useDisconnectWallet from 'hooks/web3/useDisconnectWallet'
import { useIsDarkMode } from 'state/user/hooks'
import { useTokensHasBalance } from 'state/wallet/hooks'
import { ExternalLinkIcon } from 'theme'
import { getEtherscanLink, shortenAddress } from 'utils'

import ReceiveToken from './ReceiveToken'
import RewardCenter from './RewardCenter'
import ListTransaction from './Transactions'
import { View } from './type'

export const HANDLE_CLASS_NAME = 'walletPopupDragHandle'

const IconWrapper = styled.div`
  display: flex;
  width: 20px;
  height: 20px;
  justify-content: center;
  align-items: center;
`

const LogOutIcon = styled(LogOut)`
  cursor: pointer;
  color: ${({ theme }) => theme.subText};
  :hover {
    opacity: 0.8;
    text-decoration: none;
  }
`

type WrapperProps = { $pinned: boolean; $blur: boolean }
const Wrapper = styled.div.attrs<WrapperProps>(props => ({
  'data-pinned': props.$pinned,
  'data-blur': props.$blur,
}))<WrapperProps>`
  width: 100%;
  height: 100%;
  padding-top: 0px;

  display: flex;

  border-radius: 20px 0px 0px 0px;
  background-color: ${({ theme }) => theme.tabActive};
  box-shadow: 0px 0px 12px 8px rgb(0 0 0 / 4%);

  overflow: hidden;

  &[data-pinned='true'] {
    border-radius: 20px;
  }

  &[data-blur='true'] {
    background-color: ${({ theme }) => rgba(theme.tabActive, 0.92)};
    backdrop-filter: blur(4px);
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding-bottom: 0;
    height: unset;
  `};
`

const TabItem = styled.div<{ active: boolean }>`
  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  padding-bottom: 10px;
  cursor: pointer;
  user-select: none;
  :hover {
    color: ${({ theme }) => theme.primary};
  }
`

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  gap: 14px;
`

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
let storedView = View.ASSETS
export default function WalletView({
  onDismiss,
  onPin,
  isPinned,
  blurBackground = false,
  onUnpin,
  showBalance,
  toggleShowBalance,
}: Props) {
  const [view, setView] = useState<string>(storedView)
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()
  const navigate = useNavigate()
  const nodeRef = useRef<HTMLDivElement>(null)
  const [isMinimal, setMinimal] = useState(false)
  const { chainId, account = '', walletKey } = useActiveWeb3React()
  const isDarkMode = useIsDarkMode()
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

  const underTab = (
    <Row gap="20px" style={{ borderBottom: `1px solid ${theme.border}` }}>
      <TabItem active={view === View.ASSETS} onClick={() => setView(View.ASSETS)}>
        <StopCircle size={16} /> <Trans>Assets</Trans>
      </TabItem>
      <TabItem
        active={view === View.TRANSACTIONS}
        onClick={() => {
          mixpanelHandler(MIXPANEL_TYPE.WUI_TRANSACTION_CLICK)
          setView(View.TRANSACTIONS)
        }}
      >
        <FileText size={16} /> <Trans>Transactions</Trans>
      </TabItem>
    </Row>
  )

  const renderAccountInfo = () => {
    const handleClickBuy = () => {
      navigate(`${APP_PATHS.BUY_CRYPTO}?step=3`)
      onDismiss()
      mixpanelHandler(MIXPANEL_TYPE.WUI_BUTTON_CLICK, { button_name: 'Buy' })
    }
    const handleClickReceive = () => {
      setView(View.RECEIVE_TOKEN)
      mixpanelHandler(MIXPANEL_TYPE.WUI_BUTTON_CLICK, { button_name: 'Receive' })
    }
    const handleClickSend = () => {
      setView(View.SEND_TOKEN)
      mixpanelHandler(MIXPANEL_TYPE.WUI_BUTTON_CLICK, { button_name: 'Send' })
    }

    return (
      <AccountInfo
        toggleShowBalance={toggleShowBalance}
        showBalance={showBalance}
        totalBalanceInUsd={hasNetworkIssue ? '--' : totalBalanceInUsd}
        onClickBuy={handleClickBuy}
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
          <ContentWrapper>
            {renderAccountInfo()}
            {underTab}
            <ListTransaction isMinimal={isMinimal} />
          </ContentWrapper>
        )
      case View.ASSETS:
        return (
          <ContentWrapper>
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
          </ContentWrapper>
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

  return (
    <Wrapper ref={nodeRef} $pinned={isPinned} $blur={blurBackground}>
      <Flex
        className={classNameForHandle}
        sx={{
          height: '100%',
          flex: '0 0 20px',
          cursor: cursorForHandle,
        }}
      />

      <Flex
        sx={{
          flexDirection: 'column',
          width: '100%',
          height: '100%',
        }}
      >
        <Flex
          className={classNameForHandle}
          sx={{
            flexDirection: 'column',
            width: '100%',
            cursor: cursorForHandle,
            marginBottom: '8px',
          }}
        >
          {isPinned && (
            <Flex
              sx={{
                height: '12px',
                justifyContent: 'center',
                alignItems: 'center',
                paddingTop: '8px',
              }}
            >
              <DragHandleIcon />
            </Flex>
          )}

          <Flex
            sx={{
              flex: '0 0 48px',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {isShowBack ? (
              <>
                <ChevronLeft cursor="pointer" size={28} onClick={() => setView(View.ASSETS)} color={theme.subText} />
                <Flex alignItems="center">
                  {isShowArrow && (
                    <SendIcon style={{ marginRight: 7, transform: isSendTab ? 'unset' : 'rotate(180deg)' }} />
                  )}{' '}
                  {view}
                </Flex>
              </>
            ) : (
              <Flex alignItems={'center'} style={{ gap: 5 }} color={theme.subText}>
                {walletKey && (
                  <IconWrapper>
                    <img
                      height={18}
                      src={isDarkMode ? SUPPORTED_WALLETS[walletKey].icon : SUPPORTED_WALLETS[walletKey].iconLight}
                      alt={SUPPORTED_WALLETS[walletKey].name + ' icon'}
                    />
                  </IconWrapper>
                )}
                <Text as="span" fontWeight="500">
                  {shortenAddress(chainId, account, 5, false)}
                </Text>
                <CopyHelper toCopy={account} />
                <ExternalLinkIcon href={getEtherscanLink(chainId, account, 'address')} color={theme.subText} />
                <LogOutIcon size={16} onClick={disconnectWallet} />
              </Flex>
            )}
            <Flex style={{ gap: 20 }} alignItems="center">
              {onPin && onUnpin && <PinButton isActive={isPinned} onClick={isPinned ? onUnpin : onPin} />}
              <X onClick={onDismiss} color={theme.subText} cursor="pointer" />
            </Flex>
          </Flex>
        </Flex>

        {renderContent()}

        <Flex
          className={classNameForHandle}
          sx={{
            height: '20px',
            flex: '0 0 20px',
            width: '100%',
            cursor: cursorForHandle,
          }}
        />
      </Flex>

      <Flex
        className={classNameForHandle}
        sx={{
          height: '100%',
          flex: '0 0 20px',
          cursor: cursorForHandle,
        }}
      />
    </Wrapper>
  )
}

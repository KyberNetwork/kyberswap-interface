import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { ChevronLeft, FileText, StopCircle, X } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DollarIcon } from 'assets/svg/dollar.svg'
import { ReactComponent as SendIcon } from 'assets/svg/send_icon.svg'
import { ReactComponent as DragHandleIcon } from 'assets/svg/wallet_drag_handle.svg'
import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import Row, { RowBetween } from 'components/Row'
import AccountInfo from 'components/WalletPopup/AccountInfo'
import MyAssets from 'components/WalletPopup/MyAssets'
import PinButton from 'components/WalletPopup/PinButton'
import SendToken from 'components/WalletPopup/SendToken'
import { APP_PATHS } from 'constants/index'
import { Z_INDEXS } from 'constants/styles'
import useTheme from 'hooks/useTheme'
import { useTokensHasBalance } from 'state/wallet/hooks'

import ReceiveToken from './ReceiveToken'
import ListTransaction from './Transactions'

export const HANDLE_CLASS_NAME = 'walletPopupDragHandle'

type WrapperProps = { $pinned: boolean; $blur: boolean }
const Wrapper = styled(Column).attrs<WrapperProps>(props => ({
  'data-pinned': props.$pinned,
  'data-blur': props.$blur,
}))<WrapperProps>`
  width: 100%;
  height: 100%;
  padding: 20px;
  padding-top: 0px;
  gap: 14px;
  border-radius: 20px 0px 0px 0px;
  background-color: ${({ theme }) => theme.tabActive};
  z-index: ${Z_INDEXS.WALLET_POPUP};

  &[data-pinned='true'] {
    border-radius: 20px;
  }

  &[data-blur='true'] {
    background-color: ${({ theme }) => rgba(theme.tabActive, 0.92)};
    backdrop-filter: blur(4px);
  }
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
  flex: 1 1 100%;
  gap: 14px;
`

const View = {
  ASSETS: t`Assets`,
  SEND_TOKEN: t`Send`,
  RECEIVE_TOKEN: t`Receive`,
  TRANSACTIONS: t`Transactions`,
}

const StyledButton = styled(ButtonLight)`
  height: 40px;
  width: 105px;
  padding: 10px;
`

type Props = {
  onDismiss: () => void
  onPin?: () => void
  isPinned: boolean
  blurBackground?: boolean
}
export default function WalletView({ onDismiss, onPin, isPinned, blurBackground = false }: Props) {
  const [view, setView] = useState<string>(View.ASSETS)
  const theme = useTheme()
  const navigate = useNavigate()

  const { loading: loadingTokens, currencies, currencyBalances, totalBalanceInUsd, usdBalances } = useTokensHasBalance()

  const actionGroup = (
    <RowBetween>
      <StyledButton
        onClick={() => {
          navigate(`${APP_PATHS.BUY_CRYPTO}?step=3`)
          onDismiss()
        }}
      >
        <DollarIcon style={{ marginRight: 7 }} />
        <Trans>Buy</Trans>
      </StyledButton>
      <StyledButton onClick={() => setView(View.RECEIVE_TOKEN)}>
        <SendIcon style={{ marginRight: 7, transform: 'rotate(180deg)' }} />
        <Trans>Receive</Trans>
      </StyledButton>
      <StyledButton onClick={() => setView(View.SEND_TOKEN)}>
        <SendIcon style={{ marginRight: 7 }} />
        <Trans>Send</Trans>
      </StyledButton>
    </RowBetween>
  )

  const underTab = (
    <Row gap="20px" style={{ borderBottom: `1px solid ${theme.border}` }}>
      <TabItem active={view === View.ASSETS} onClick={() => setView(View.ASSETS)}>
        <StopCircle size={16} /> <Trans>Assets</Trans>
      </TabItem>
      <TabItem active={view === View.TRANSACTIONS} onClick={() => setView(View.TRANSACTIONS)}>
        <FileText size={16} /> <Trans>Transactions</Trans>
      </TabItem>
    </Row>
  )

  const renderContent = () => {
    switch (view) {
      case View.TRANSACTIONS:
        return (
          <ContentWrapper>
            <AccountInfo totalBalanceInUsd={totalBalanceInUsd} />
            {actionGroup}
            {underTab}
            <ListTransaction />
          </ContentWrapper>
        )
      case View.ASSETS:
        return (
          <ContentWrapper>
            <AccountInfo totalBalanceInUsd={totalBalanceInUsd} />
            {actionGroup}
            {underTab}
            <MyAssets
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
    }
    return null
  }

  const isSendTab = view === View.SEND_TOKEN
  const isExchangeTokenTab = isSendTab || view === View.RECEIVE_TOKEN

  return (
    <Wrapper $pinned={isPinned} $blur={blurBackground}>
      <Flex
        className={isPinned ? HANDLE_CLASS_NAME : ''}
        sx={{
          flexDirection: 'column',
          width: '100%',
          height: '0 0 max-content',
          justifyContent: 'center',
          cursor: isPinned ? 'move' : undefined,
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
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          {isExchangeTokenTab ? (
            <>
              <ChevronLeft cursor="pointer" size={28} onClick={() => setView(View.ASSETS)} color={theme.subText} />
              <Flex alignItems="center">
                <SendIcon style={{ marginRight: 7, transform: isSendTab ? 'unset' : 'rotate(180deg)' }} /> {view}
              </Flex>
            </>
          ) : (
            <Text fontWeight={'500'} fontSize="20px">
              <Trans>Your Account</Trans>
            </Text>
          )}
          <Flex style={{ gap: 20 }} alignItems="center">
            {!isPinned && onPin && <PinButton isActive={false} onClick={onPin} />}
            <X onClick={onDismiss} color={theme.subText} cursor="pointer" />
          </Flex>
        </Flex>
      </Flex>

      {renderContent()}
    </Wrapper>
  )
}

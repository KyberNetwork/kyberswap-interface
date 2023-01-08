import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { ChevronLeft, FileText, StopCircle, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as SendIcon } from 'assets/svg/send_icon.svg'
import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import Row, { RowBetween } from 'components/Row'
import AccountInfo from 'components/WalletPopup/AccountInfo'
import DragHandle from 'components/WalletPopup/DragHandle'
import MyAssets from 'components/WalletPopup/MyAssets'
import PinButton from 'components/WalletPopup/PinButton'
import SendToken from 'components/WalletPopup/SendToken'
import { Z_INDEXS } from 'constants/styles'
import useTheme from 'hooks/useTheme'
import { useTokensHasBalance } from 'state/wallet/hooks'

import ReceiveToken from './ReceiveToken'
import ListTransaction from './Transactions'

type WrapperProps = { $pinned: boolean }
const Wrapper = styled(Column).attrs<WrapperProps>(props => ({
  'data-pinned': props.$pinned,
}))<WrapperProps>`
  width: 410px;
  height: 680px;
  padding: 20px;
  gap: 14px;
  border-radius: 20px 0px 0px 0px;
  background-color: ${({ theme }) => theme.tabActive};
  z-index: ${Z_INDEXS.WALLET_POPUP};

  &[data-pinned='true'] {
    border-radius: 20px;
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
const View = {
  ASSETS: t`Assets`,
  SEND_TOKEN: t`Send`,
  RECEIVE_TOKEN: t`Receive`,
  TRANSACTIONS: t`Transactions`,
}

type Props = {
  onDismiss: () => void
  onPin?: () => void
  isPinned: boolean
}

export default function WalletView({ onDismiss, onPin, isPinned }: Props) {
  const [view, setView] = useState<string>(View.ASSETS)
  const theme = useTheme()

  const { loading: loadingTokens, currencies, currencyBalances, totalBalanceInUsd } = useTokensHasBalance()

  const actionGroup = (
    <RowBetween>
      <ButtonLight width={'105px'} padding="10px" onClick={() => setView(View.RECEIVE_TOKEN)}>
        <SendIcon style={{ marginRight: 7, transform: 'rotate(180deg)' }} />
        <Trans>Receive</Trans>
      </ButtonLight>
      <ButtonLight width={'105px'} padding="10px" onClick={() => setView(View.SEND_TOKEN)}>
        <SendIcon style={{ marginRight: 7 }} />
        <Trans>Send</Trans>
      </ButtonLight>
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
          <>
            <AccountInfo totalBalanceInUsd={totalBalanceInUsd} />
            {actionGroup}
            {underTab}
            <ListTransaction />
          </>
        )
      case View.ASSETS:
        return (
          <>
            <AccountInfo totalBalanceInUsd={totalBalanceInUsd} />
            {actionGroup}
            {underTab}
            <MyAssets loadingTokens={loadingTokens} tokens={currencies} />
          </>
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
    <Wrapper $pinned={isPinned}>
      <RowBetween height={'28px'} style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: 18 }}>
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
      </RowBetween>

      {renderContent()}

      {isPinned && <DragHandle />}
    </Wrapper>
  )
}

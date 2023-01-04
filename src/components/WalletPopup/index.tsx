import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { ChevronLeft, FileText, StopCircle, X } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as PinIcon } from 'assets/svg/pin_icon.svg'
import { ReactComponent as SendIcon } from 'assets/svg/send_icon.svg'
import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import Row, { RowBetween } from 'components/Row'
import SendToken from 'components/WalletPopup/SendToken'
import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

import ListTransaction from './ListTransaction'

const Wrapper = styled(Column)`
  width: 410px;
  height: 680px;
  padding: 20px;
  gap: 14px;
  position: fixed;
  right: 0;
  bottom: 0;
  border-radius: 20px 0px 0px 0px;
  background-color: ${({ theme }) => theme.tabActive};
  z-index: ${Z_INDEXS.WALLET_POPUP};
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
`

const View = {
  ASSETS: t`Assets`,
  SEND_TOKEN: t`Send`,
  RECEIVE_TOKEN: t`Receive`,
  TRANSACTIONS: t`Transactions`,
}
export default function WalletPopup() {
  const { account } = useActiveWeb3React()
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<string>(View.TRANSACTIONS)
  const theme = useTheme()
  const onDismiss = () => {
    setIsOpen(false)
  }

  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  if (isMobile || !account) return null

  const actionGroup = (
    <RowBetween>
      <ButtonLight width={'110px'} onClick={() => setView(View.RECEIVE_TOKEN)}>
        <SendIcon style={{ marginRight: 7, transform: 'rotate(180deg)' }} />
        <Trans>Receive</Trans>
      </ButtonLight>
      <ButtonLight width={'110px'} onClick={() => setView(View.SEND_TOKEN)}>
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
            {actionGroup}
            {underTab}
            <ListTransaction />
          </>
        )
      case View.SEND_TOKEN:
        return <SendToken />
      case View.ASSETS:
        return (
          <>
            {actionGroup}
            {underTab}
          </>
        )
    }
    return null
  }

  const isSendTab = view === View.SEND_TOKEN
  const isExchangeTokenTab = isSendTab || view === View.RECEIVE_TOKEN

  return !isOpen ? (
    <button
      style={{
        position: 'fixed',
        right: 30,
        bottom: 130,
      }}
      onClick={() => setIsOpen(true)}
    >
      wallet ui
    </button>
  ) : (
    <Wrapper>
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
            <Trans>Your Account</Trans>{' '}
          </Text>
        )}
        <Flex style={{ gap: 20 }} alignItems="center">
          <PinIcon cursor="pointer" />
          <X onClick={onDismiss} color={theme.subText} cursor="pointer" />
        </Flex>
      </RowBetween>

      {renderContent()}
    </Wrapper>
  )
}

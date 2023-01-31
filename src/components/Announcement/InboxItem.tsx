import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import styled, { css } from 'styled-components'

import { ReactComponent as BridgeIcon } from 'assets/svg/bridge_icon.svg'
import IconSuccess from 'assets/svg/notification_icon_success.svg'
import { Announcement } from 'components/Announcement/type'

const Wrapper = styled.div<{ isRead: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.background};

  font-size: 12px;
  padding: 12px 16px;
  gap: 8px;
  display: flex;
  flex-direction: column;

  ${({ isRead }) =>
    !isRead &&
    css`
      cursor: pointer;
      background-color: ${({ theme }) => rgba(theme.buttonBlack, 0.8)};
    `};
`

const Title = styled.div<{ isRead: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme, isRead }) => (isRead ? theme.text : theme.primary)};
`

const Text = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.text};
`
const Time = styled.span`
  color: ${({ theme }) => theme.subText};
`
const Dot = styled.span`
  background-color: ${({ theme }) => theme.primary};
  border-radius: 100%;
  height: 8px;
  width: 8px;
`

const Row = styled.div`
  justify-content: space-between;
  display: flex;
`
const RowItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const getIcon = () => {
  return <BridgeIcon />
}
export default function InboxItem({ announcement, onClick }: { announcement: Announcement; onClick: () => void }) {
  const { isRead } = announcement
  return (
    <Wrapper isRead={isRead} onClick={onClick}>
      <Row>
        <RowItem>
          {getIcon()}
          <Title isRead={isRead}>
            <Trans>Bridge Token</Trans>
          </Title>
          {!isRead && <Dot />}
        </RowItem>
        <RowItem>
          <Text>Success</Text>
          <img height={12} width={12} src={IconSuccess} alt="icon-status" />
        </RowItem>
      </Row>

      <Row>
        <Time>12/12/2002</Time>
        <Text>12KNC</Text>
      </Row>

      <Row>
        <Time>12/12/2002</Time>
        <Time>12/12/2002</Time>
      </Row>
    </Wrapper>
  )
}

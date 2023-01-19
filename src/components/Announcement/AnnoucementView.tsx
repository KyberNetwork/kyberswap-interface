import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Info, Trash } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as ListIcon } from 'assets/svg/list_icon.svg'
import AnnouncementItem from 'components/Announcement/AnnoucementItem'
import InboxItem from 'components/Announcement/InboxItem'
import { ackReadAnnouncement, formatNumberOfUnread } from 'components/Announcement/helper'
import { Announcement } from 'components/Announcement/type'
import Column from 'components/Column'
import NotificationIcon from 'components/Icons/NotificationIcon'
import { RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useNotification from 'hooks/useNotification'
import useTheme from 'hooks/useTheme'
import { useWalletModalToggle } from 'state/application/hooks'

const Wrapper = styled.div`
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 70vh;
  padding-top: 20px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    max-height: unset;
  `};
`
const Container = styled.div`
  gap: 12px;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  padding-right: 16px;
`

const TabItem = styled.div<{ active: boolean }>`
  flex: 1;
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 20px;
  padding: 4px 0px;
  text-align: center;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  display: flex;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.subText};
  ${({ active }) =>
    active &&
    css`
      background-color: ${({ theme }) => theme.tabActive};
      color: ${({ theme }) => theme.text};
    `};
`

const ClearAll = styled.div`
  color: ${({ theme }) => theme.red};
  align-items: center;
  display: flex;
  gap: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  justify-content: flex-end;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    color: ${({ theme }) => theme.subText};
  `};
`
const Title = styled.div`
  font-weight: 500;
  font-size: 12px;
  font-size: 20px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
`

const TabWrapper = styled.div`
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 20px;
  display: flex;
  padding: 4px;
  gap: 10px;
  justify-content: space-between;
`

const ListAnnouncement = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-y: auto;
`

const Badge = styled.div`
  border-radius: 16px;
  background-color: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.textReverse};
  padding: 2px 4px 1px 4px;
  font-weight: 500;
  min-width: 20px;
  text-align: center;
`
enum Tab {
  INBOX,
  ANNOUNCEMENT,
}

export default function AnnouncementView({
  numberOfUnreadInbox,
  numberOfUnreadGeneral,
  announcements,
  inboxes,
  refreshAnnouncement,
}: {
  numberOfUnreadInbox: number
  numberOfUnreadGeneral: number
  announcements: Announcement[]
  inboxes: Announcement[]
  refreshAnnouncement: () => void
}) {
  const { account } = useActiveWeb3React()
  const [activeTab, setActiveTab] = useState(Tab.ANNOUNCEMENT)
  const theme = useTheme()
  const toggleWalletModal = useWalletModalToggle()
  const { showNotificationModal } = useNotification()

  const onReadAnnouncement = async (item: Announcement) => {
    try {
      await ackReadAnnouncement()
      refreshAnnouncement()
    } catch (error) {}
  }
  const isMyInboxTab = activeTab === Tab.INBOX
  const listData = isMyInboxTab ? inboxes : announcements
  console.log(isMyInboxTab)

  return (
    <Wrapper>
      <Container>
        <RowBetween gap="10px">
          <Title>
            <NotificationIcon size={18} />
            <Trans>Notifications</Trans>
          </Title>
          {account && <ListIcon cursor="pointer" onClick={showNotificationModal} />}
        </RowBetween>

        <TabWrapper>
          <TabItem active={isMyInboxTab} onClick={() => setActiveTab(Tab.INBOX)}>
            <Trans>My Inbox</Trans>
            {numberOfUnreadInbox > 0 && account && <Badge>{formatNumberOfUnread(numberOfUnreadInbox)}</Badge>}
          </TabItem>
          <TabItem active={activeTab === Tab.ANNOUNCEMENT} onClick={() => setActiveTab(Tab.ANNOUNCEMENT)}>
            <Trans>General</Trans>
            {numberOfUnreadGeneral > 0 && account && <Badge>{formatNumberOfUnread(numberOfUnreadGeneral)}</Badge>}
          </TabItem>
        </TabWrapper>

        {account && (
          <ClearAll>
            <Trash size={12} />
            <Trans>Clear All</Trans>
          </ClearAll>
        )}
      </Container>

      {listData.length ? (
        <ListAnnouncement>
          {listData.map(item =>
            isMyInboxTab ? (
              <InboxItem key={item.id} announcement={item} onClick={() => onReadAnnouncement(item)} />
            ) : (
              <AnnouncementItem key={item.id} announcement={item} onClick={() => onReadAnnouncement(item)} />
            ),
          )}
        </ListAnnouncement>
      ) : (
        <Column style={{ alignItems: 'center', margin: '24px 0px' }} gap="8px">
          <Info color={theme.subText} size={26} />
          <Text color={theme.subText} textAlign="center">
            {!account && isMyInboxTab ? (
              <Text>
                <Text color={theme.primary} sx={{ cursor: 'pointer' }} onClick={toggleWalletModal}>
                  <Trans>Connect Wallet</Trans>
                </Text>
                <Trans>to view My inbox</Trans>
              </Text>
            ) : (
              <Trans>No notifications found</Trans>
            )}
          </Text>
        </Column>
      )}
    </Wrapper>
  )
}

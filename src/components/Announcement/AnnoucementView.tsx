import { Trans } from '@lingui/macro'
import { Info, Trash, X } from 'react-feather'
import { useMedia } from 'react-use'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import { Flex, Text } from 'rebass'
import AnnouncementApi from 'services/announcement'
import styled, { CSSProperties, css } from 'styled-components'

import { ReactComponent as ListIcon } from 'assets/svg/list_icon.svg'
import AnnouncementItem from 'components/Announcement/AnnoucementItem'
import InboxItem from 'components/Announcement/PrivateAnnoucement'
import { formatNumberOfUnread } from 'components/Announcement/helper'
import { Announcement, PrivateAnnouncement } from 'components/Announcement/type'
import Column from 'components/Column'
import NotificationIcon from 'components/Icons/NotificationIcon'
import { RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useNotification from 'hooks/useNotification'
import useTheme from 'hooks/useTheme'
import { useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'

const Wrapper = styled.div`
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 70vh;
  padding-top: 20px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    height: unset;
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
  padding: 6px 0px;
  text-align: center;
  font-weight: 500;
  font-size: 14px;
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
  padding: 0px 4px;
  font-weight: 500;
  min-width: 20px;
  text-align: center;
`
export enum Tab {
  INBOX,
  ANNOUNCEMENT,
}

type Props = {
  numberOfUnread: number
  totalAnnouncement: number
  announcements: Announcement[] | PrivateAnnouncement[]
  isMyInboxTab: boolean
  onSetTab: (tab: Tab) => void
  refreshAnnouncement: () => void
  loadMoreAnnouncements: () => void
  toggleNotificationCenter: () => void
}

export default function AnnouncementView({
  numberOfUnread,
  announcements,
  totalAnnouncement,
  refreshAnnouncement,
  loadMoreAnnouncements,
  toggleNotificationCenter,
  isMyInboxTab,
  onSetTab,
}: Props) {
  const { account } = useActiveWeb3React()

  const theme = useTheme()
  const toggleWalletModal = useWalletModalToggle()
  const { showNotificationModal } = useNotification()

  const { useAckPrivateAnnouncementsMutation } = AnnouncementApi
  const [ackAnnouncement] = useAckPrivateAnnouncementsMutation()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const onReadAnnouncement = (item: PrivateAnnouncement) => {
    if (!account) return
    if (item.isRead) {
      toggleNotificationCenter()
      return
    }
    ackAnnouncement({ account, action: 'read', ids: [item.id] })
      .then(() => {
        refreshAnnouncement()
        toggleNotificationCenter()
      })
      .catch(err => {
        console.error('ack noti error', err)
      })
  }

  const clearAll = () => {
    if (!announcements.length || !account) return
    ackAnnouncement({ account, action: 'clear-all' })
      .then(() => {
        refreshAnnouncement()
      })
      .catch(err => {
        console.error('ack noti error', err)
      })
  }

  const hasMore = announcements.length !== totalAnnouncement
  const isItemLoaded = (index: number) => !hasMore || index < announcements.length
  const itemCount = hasMore ? announcements.length + 1 : announcements.length

  const tabComponent = (
    <TabWrapper>
      <TabItem active={isMyInboxTab} onClick={() => onSetTab(Tab.INBOX)}>
        <Trans>My Inbox</Trans>
        {numberOfUnread > 0 && account && <Badge>{formatNumberOfUnread(numberOfUnread)}</Badge>}
      </TabItem>
      <TabItem active={!isMyInboxTab} onClick={() => onSetTab(Tab.ANNOUNCEMENT)}>
        <Trans>General</Trans>
      </TabItem>
    </TabWrapper>
  )

  return (
    <Wrapper>
      <Container>
        <RowBetween gap="10px">
          <Title>
            <NotificationIcon size={18} />
            <Trans>Notifications</Trans>
          </Title>
          <Flex style={{ gap: '20px', alignItems: 'center' }}>
            {account && <ListIcon cursor="pointer" onClick={showNotificationModal} />}
            {isMobile && <X color={theme.subText} onClick={toggleNotificationCenter} cursor="pointer" />}
          </Flex>
        </RowBetween>

        {tabComponent}

        {account && isMyInboxTab && announcements.length > 0 && (
          <Flex justifyContent="flex-end">
            <ClearAll onClick={clearAll}>
              <Trash size={12} />
              <Trans>Clear All</Trans>
            </ClearAll>
          </Flex>
        )}
      </Container>

      {announcements.length ? (
        <ListAnnouncement>
          <AutoSizer>
            {({ height, width }) => (
              <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={itemCount} loadMoreItems={loadMoreAnnouncements}>
                {({ onItemsRendered, ref }) => (
                  <FixedSizeList
                    height={height}
                    width={width}
                    itemCount={itemCount}
                    itemSize={isMyInboxTab ? 116 : 126}
                    onItemsRendered={onItemsRendered}
                    ref={ref}
                  >
                    {({ index, style }: { index: number; style: CSSProperties }) => {
                      if (!isItemLoaded(index)) {
                        return null
                      }
                      const item = announcements[index]
                      return isMyInboxTab ? (
                        <InboxItem
                          style={style}
                          key={item.id}
                          announcement={item as PrivateAnnouncement}
                          onRead={() => onReadAnnouncement(item as PrivateAnnouncement)}
                        />
                      ) : (
                        <AnnouncementItem
                          key={item.id}
                          style={style}
                          announcement={item as Announcement}
                          onRead={toggleNotificationCenter}
                        />
                      )
                    }}
                  </FixedSizeList>
                )}
              </InfiniteLoader>
            )}
          </AutoSizer>
        </ListAnnouncement>
      ) : (
        <Column style={{ alignItems: 'center', margin: '24px 0px 32px 0px' }} gap="8px">
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

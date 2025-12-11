import { Trans } from '@lingui/macro'
import { useEffect, useRef } from 'react'
import { Info } from 'react-feather'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import AnnouncementItem from 'components/Announcement/AnnoucementItem'
import InboxItem from 'components/Announcement/PrivateAnnoucement'
import { Announcement, PrivateAnnouncement } from 'components/Announcement/type'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'

const ListAnnouncement = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 0px 0px 12px 12px;
  .scrollbar {
    &::-webkit-scrollbar {
      display: block;
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: ${({ theme }) => theme.border};
    }
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    border-radius: 0;
  `};
`

export enum Tab {
  CATEGORY,
  NOTIFICATIONS,
}

export enum Category {
  EARN_POSITION = 'EARN_POSITION',
  ANNOUNCEMENTS = 'ANNOUNCEMENTS',
}

type Props = {
  totalAnnouncement?: number
  announcements?: Announcement[] | PrivateAnnouncement[]
  loadMoreAnnouncements?: () => void
  toggleNotificationCenter?: () => void
  showDetailAnnouncement?: (index: number) => void
  selectedCategory?: Category | null
  onPrivateAnnouncementRead?: (announcement: PrivateAnnouncement, statusMessage: string) => void | Promise<void>
  onPrivateAnnouncementPin?: (announcement: PrivateAnnouncement) => void | Promise<void>
  onPrivateAnnouncementDelete?: (announcement: PrivateAnnouncement) => void | Promise<void>
}

export default function AnnouncementView({
  announcements,
  totalAnnouncement,
  loadMoreAnnouncements,
  toggleNotificationCenter,
  showDetailAnnouncement,
  selectedCategory,
  onPrivateAnnouncementRead,
  onPrivateAnnouncementPin,
  onPrivateAnnouncementDelete,
}: Props) {
  const { account } = useActiveWeb3React()
  const scrollRef = useRef<HTMLDivElement>(null)
  const theme = useTheme()

  const handleLoadMore = loadMoreAnnouncements ?? (() => null)
  const handleToggle = toggleNotificationCenter ?? (() => null)
  const handleShowDetail = showDetailAnnouncement ?? (() => null)
  const currentCategory = selectedCategory ?? null

  const visibleList = announcements ?? []
  const total = totalAnnouncement ?? 0

  const onReadPrivateAnnouncement = (item: PrivateAnnouncement, statusMessage: string) => {
    if (!account) return
    onPrivateAnnouncementRead?.(item, statusMessage)
    handleToggle()
  }

  const onReadAnnouncement = (item: Announcement, index: number) => {
    handleShowDetail(index)
    handleToggle()
  }

  const hasMore = visibleList.length < total
  const isItemLoaded = (index: number) => !hasMore || index < visibleList.length
  const itemCount = hasMore ? visibleList.length + 1 : visibleList.length

  const node = scrollRef?.current
  useEffect(() => {
    if (!node?.classList.contains('scrollbar')) {
      node?.classList.add('scrollbar')
    }
  }, [node])

  return (
    <Flex flexDirection="column" flex={1}>
      {visibleList.length === 0 && (
        <Flex flexDirection="column" justifyContent="center" alignItems="center" height="100%" style={{ gap: 8 }}>
          <Info color={theme.subText} size={27} />
          <Text color={theme.subText} textAlign="center">
            <Trans>No notifications found</Trans>
          </Text>
        </Flex>
      )}
      <ListAnnouncement>
        <AutoSizer>
          {({ height, width }) => (
            <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={itemCount} loadMoreItems={handleLoadMore}>
              {({ onItemsRendered, ref }) => (
                <FixedSizeList
                  outerRef={scrollRef}
                  height={height}
                  width={width}
                  itemCount={itemCount}
                  itemSize={currentCategory === Category.ANNOUNCEMENTS ? 126 : 120}
                  onItemsRendered={onItemsRendered}
                  ref={ref}
                >
                  {({ index, style }: { index: number; style: CSSProperties }) => {
                    if (!isItemLoaded(index)) {
                      return null
                    }
                    const item = visibleList[index]
                    return currentCategory === Category.ANNOUNCEMENTS ? (
                      <AnnouncementItem
                        key={item.id}
                        style={style}
                        announcement={item as Announcement}
                        onRead={() => onReadAnnouncement(item as Announcement, index)}
                      />
                    ) : (
                      <InboxItem
                        style={style}
                        key={item.id}
                        announcement={item as PrivateAnnouncement}
                        onRead={onReadPrivateAnnouncement}
                        onPin={onPrivateAnnouncementPin}
                        onDelete={onPrivateAnnouncementDelete}
                      />
                    )
                  }}
                </FixedSizeList>
              )}
            </InfiniteLoader>
          )}
        </AutoSizer>
      </ListAnnouncement>
    </Flex>
  )
}

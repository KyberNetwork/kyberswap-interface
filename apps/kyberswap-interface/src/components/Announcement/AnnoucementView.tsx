import { Trans } from '@lingui/macro'
import { useEffect, useRef } from 'react'
import { Info } from 'react-feather'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import { Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import AnnouncementItem from 'components/Announcement/AnnoucementItem'
import InboxItem from 'components/Announcement/PrivateAnnoucement'
import { Announcement, PrivateAnnouncement } from 'components/Announcement/type'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
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
  NOTI,
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
}

export default function AnnouncementView({
  announcements,
  totalAnnouncement,
  loadMoreAnnouncements,
  toggleNotificationCenter,
  showDetailAnnouncement,
  selectedCategory,
}: Props) {
  const { account } = useActiveWeb3React()
  const scrollRef = useRef<HTMLDivElement>(null)
  const theme = useTheme()

  const { mixpanelHandler } = useMixpanel()
  const list = announcements ?? []
  const total = totalAnnouncement ?? 0
  const handleLoadMore = loadMoreAnnouncements ?? (() => null)
  const handleToggle = toggleNotificationCenter ?? (() => null)
  const handleShowDetail = showDetailAnnouncement ?? (() => null)
  const currentCategory = selectedCategory ?? null

  const onReadPrivateAnnouncement = (item: PrivateAnnouncement, statusMessage: string) => {
    if (!account) return
    mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_INBOX_MESSAGE, {
      message_status: statusMessage,
      message_type: item.templateType,
    })
    handleToggle()
  }

  const onReadAnnouncement = (item: Announcement, index: number) => {
    handleToggle()
    const { templateBody } = item
    handleShowDetail(index)
    mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_ANNOUNCEMENT_MESSAGE, {
      message_title: templateBody.name,
    })
  }

  const hasMore = list.length !== total
  const isItemLoaded = (index: number) => !hasMore || index < list.length
  const itemCount = hasMore ? list.length + 1 : list.length

  const node = scrollRef?.current
  useEffect(() => {
    if (!node?.classList.contains('scrollbar')) {
      node?.classList.add('scrollbar')
    }
  }, [node])

  return (
    <>
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
                  itemSize={currentCategory === Category.EARN_POSITION ? 120 : 126}
                  onItemsRendered={onItemsRendered}
                  ref={ref}
                >
                  {({ index, style }: { index: number; style: CSSProperties }) => {
                    if (!isItemLoaded(index)) {
                      return null
                    }
                    const item = list[index]
                    return currentCategory === Category.EARN_POSITION ? (
                      <InboxItem
                        style={style}
                        key={item.id}
                        announcement={item as PrivateAnnouncement}
                        onRead={onReadPrivateAnnouncement}
                      />
                    ) : (
                      <AnnouncementItem
                        key={item.id}
                        style={style}
                        announcement={item as Announcement}
                        onRead={() => onReadAnnouncement(item as Announcement, index)}
                      />
                    )
                  }}
                </FixedSizeList>
              )}
            </InfiniteLoader>
          )}
        </AutoSizer>
      </ListAnnouncement>
      {list.length === 0 && (
        <div
          style={{
            alignItems: 'center',
            margin: '24px 0px 32px 0px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <Info color={theme.subText} size={27} />
          <Text color={theme.subText} textAlign="center">
            <Trans>No notifications found</Trans>
          </Text>
        </div>
      )}
    </>
  )
}

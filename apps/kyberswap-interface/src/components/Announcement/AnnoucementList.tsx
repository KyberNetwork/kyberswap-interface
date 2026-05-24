import { Trans } from '@lingui/macro'
import { CSSProperties, useEffect, useRef } from 'react'
import { Info } from 'react-feather'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'

import AnnouncementItem from 'components/Announcement/AnnoucementItem'
import InboxItem from 'components/Announcement/PrivateAnnoucement'
import { Announcement, PrivateAnnouncement } from 'components/Announcement/type'
import { useActiveWeb3React } from 'hooks'

import { ListAnnouncement } from './styles'

export enum Tab {
  CATEGORY,
  NOTIFICATIONS,
}

export enum Category {
  EARN_POSITION = 'EARN_POSITION',
  LIMIT_ORDER = 'LIMIT_ORDER',
  SMART_EXIT = 'SMART_EXIT',
  ANNOUNCEMENTS = 'ANNOUNCEMENTS',
}

const getViewHeight = (category: Category | null) => {
  if (category === Category.EARN_POSITION) return 112
  if (category === Category.LIMIT_ORDER) return 150
  if (category === Category.SMART_EXIT) return 120
  return 128
}

type Props = {
  totalAnnouncement?: number
  announcements?: Announcement[] | PrivateAnnouncement[]
  loadMoreAnnouncements?: () => void
  toggleNotificationCenter?: () => void
  showDetailAnnouncement?: (index: number) => void
  selectedCategory?: Category | null
  onAnnouncementRead?: (announcement: Announcement) => void | Promise<void>
  onPrivateAnnouncementRead?: (announcement: PrivateAnnouncement, statusMessage: string) => void | Promise<void>
  onPrivateAnnouncementPin?: (announcement: PrivateAnnouncement) => void | Promise<void>
  onPrivateAnnouncementDelete?: (announcement: PrivateAnnouncement) => void | Promise<void>
}

export default function AnnoucementList({
  announcements,
  totalAnnouncement,
  loadMoreAnnouncements,
  toggleNotificationCenter,
  showDetailAnnouncement,
  selectedCategory,
  onAnnouncementRead,
  onPrivateAnnouncementRead,
  onPrivateAnnouncementPin,
  onPrivateAnnouncementDelete,
}: Props) {
  const { account } = useActiveWeb3React()
  const scrollRef = useRef<HTMLDivElement>(null)
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
    onAnnouncementRead?.(item)
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
    <div className="flex flex-1 flex-col">
      {visibleList.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center gap-2">
          <Info className="text-subText" size={27} />
          <span className="text-center text-subText">
            <Trans>No notifications found</Trans>
          </span>
        </div>
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
                  itemSize={getViewHeight(currentCategory)}
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
    </div>
  )
}

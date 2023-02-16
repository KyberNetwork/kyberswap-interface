import dayjs from 'dayjs'
import { ReactNode } from 'react'
import { CSSProperties } from 'styled-components'

import InboxItemBridge from 'components/Announcement/PrivateAnnoucement/InboxItemBridge'
import InboxItemLO from 'components/Announcement/PrivateAnnoucement/InboxItemLO'
import InboxItemTrendingSoon from 'components/Announcement/PrivateAnnoucement/InboxItemTrendingSoon'
import { InboxItemTime } from 'components/Announcement/PrivateAnnoucement/styled'
import { PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'

export type PrivateAnnouncementProp = {
  announcement: PrivateAnnouncement
  onRead: () => void
  style: CSSProperties
  time?: ReactNode
}

export default function InboxItem({ announcement, onRead, style }: PrivateAnnouncementProp) {
  const { templateType, sentAt } = announcement
  const props = {
    announcement,
    onRead,
    style,
    time: <InboxItemTime>{dayjs(sentAt * 1000).format('DD-MM-YYYY HH:mm:ss')}</InboxItemTime>,
  }
  switch (templateType) {
    case PrivateAnnouncementType.BRIDGE:
      return <InboxItemBridge {...props} />
    case PrivateAnnouncementType.LIMIT_ORDER:
      return <InboxItemLO {...props} />
    case PrivateAnnouncementType.TRENDING_SOON_TOKEN:
      return <InboxItemTrendingSoon {...props} />
    default:
      return null
  }
}

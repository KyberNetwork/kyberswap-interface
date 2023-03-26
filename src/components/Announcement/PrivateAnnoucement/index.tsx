import { ReactNode } from 'react'
import { CSSProperties } from 'styled-components'

import InboxItemBridge from 'components/Announcement/PrivateAnnoucement/InboxItemBridge'
import InboxItemLO from 'components/Announcement/PrivateAnnoucement/InboxItemLO'
import InboxItemPoolPosition from 'components/Announcement/PrivateAnnoucement/InboxItemPoolPosition'
import InboxItemPriceAlert from 'components/Announcement/PrivateAnnoucement/InboxItemPriceAlert'
import InboxItemTrendingSoon from 'components/Announcement/PrivateAnnoucement/InboxItemTrendingSoon'
import { InboxItemTime } from 'components/Announcement/PrivateAnnoucement/styled'
import {
  AnnouncementTemplate,
  AnnouncementTemplateBridge,
  AnnouncementTemplateLimitOrder,
  AnnouncementTemplatePoolPosition,
  AnnouncementTemplatePriceAlert,
  AnnouncementTemplateTrendingSoon,
  PrivateAnnouncement,
  PrivateAnnouncementType,
} from 'components/Announcement/type'
import useTheme from 'hooks/useTheme'
import { formatTime } from 'utils/time'

export type PrivateAnnouncementProp<T extends AnnouncementTemplate = AnnouncementTemplate> = {
  announcement: PrivateAnnouncement<T>
  onRead: (data: PrivateAnnouncement, statusMessage: string) => void
  style: CSSProperties
  time?: ReactNode
}

export default function InboxItem({ announcement, onRead, style }: PrivateAnnouncementProp) {
  const { templateType, sentAt, isRead } = announcement
  const theme = useTheme()
  const props = {
    onRead,
    style,
    time: <InboxItemTime color={isRead ? theme.border : theme.subText}>{formatTime(sentAt)}</InboxItemTime>,
  }
  try {
    switch (templateType) {
      case PrivateAnnouncementType.BRIDGE:
        return (
          <InboxItemBridge {...props} announcement={announcement as PrivateAnnouncement<AnnouncementTemplateBridge>} />
        )
      case PrivateAnnouncementType.LIMIT_ORDER:
        return (
          <InboxItemLO {...props} announcement={announcement as PrivateAnnouncement<AnnouncementTemplateLimitOrder>} />
        )
      case PrivateAnnouncementType.TRENDING_SOON_TOKEN:
        return (
          <InboxItemTrendingSoon
            {...props}
            announcement={announcement as PrivateAnnouncement<AnnouncementTemplateTrendingSoon>}
          />
        )
      case PrivateAnnouncementType.POOL_POSITION:
        return (
          <InboxItemPoolPosition
            {...props}
            announcement={announcement as PrivateAnnouncement<AnnouncementTemplatePoolPosition>}
          />
        )
      case PrivateAnnouncementType.PRICE_ALERT:
        return (
          <InboxItemPriceAlert
            {...props}
            announcement={announcement as PrivateAnnouncement<AnnouncementTemplatePriceAlert>}
          />
        )
      default:
        return null
    }
  } catch (error) {
    return null
  }
}

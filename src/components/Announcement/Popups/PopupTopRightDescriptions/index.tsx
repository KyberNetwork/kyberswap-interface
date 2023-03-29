import { ReactNode } from 'react'

import DescriptionPriceAlert from 'components/Announcement/Popups/PopupTopRightDescriptions/DescriptionPriceAlert'
import {
  NotificationType,
  PopupContentAnnouncement,
  PopupItemType,
  PrivateAnnouncementType,
} from 'components/Announcement/type'

type Summary = {
  title: string
  summary: ReactNode
  type: NotificationType
  link: string
  icon?: ReactNode
}
type SummaryMap = {
  [type in PrivateAnnouncementType]: (popup: PopupContentAnnouncement) => Summary
}
const MAP_DESCRIPTION: Partial<SummaryMap> = {
  [PrivateAnnouncementType.PRICE_ALERT]: DescriptionPriceAlert,
}

export default function getPopupTopRightDescriptionByType({ content }: PopupItemType<PopupContentAnnouncement>) {
  const { templateType } = content
  return (MAP_DESCRIPTION[templateType]?.(content) ?? {}) as Summary
}

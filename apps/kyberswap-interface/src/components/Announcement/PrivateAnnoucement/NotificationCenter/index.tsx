import React from 'react'

import { PRIVATE_ANN_TITLE } from 'components/Announcement/PrivateAnnoucement'
import { AnnouncementTemplate, PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'
import { isStopMarketExecutedTemplate } from 'constants/env'

import LimitOrder from './LimitOrder'
import PoolPosition from './PoolPosition'
import PriceAlert from './PriceAlert'
import PrivateMessage from './PrivateMessage'
import StopMarket from './StopMarket'

export type PrivateAnnouncementPropCenter<T extends AnnouncementTemplate = AnnouncementTemplate> = {
  announcement: PrivateAnnouncement<T>
  title?: string
}

type PrivateAnnouncementCenterMap = {
  [type in PrivateAnnouncementType]: (data: { announcement: PrivateAnnouncement }) => React.JSX.Element
}
const ANNOUNCEMENT_MAP_IN_CENTER = {
  [PrivateAnnouncementType.ELASTIC_POOLS]: PoolPosition,
  [PrivateAnnouncementType.LIMIT_ORDER]: LimitOrder,
  [PrivateAnnouncementType.PRICE_ALERT]: PriceAlert,
  [PrivateAnnouncementType.DIRECT_MESSAGE]: PrivateMessage,
} as PrivateAnnouncementCenterMap

export default function InboxItemNotificationCenter({ announcement }: PrivateAnnouncementPropCenter) {
  const { templateType } = announcement
  try {
    // Stop market orders are listed as limit orders and told apart by their template.
    const component = isStopMarketExecutedTemplate(announcement.templateId)
      ? (StopMarket as PrivateAnnouncementCenterMap[PrivateAnnouncementType])
      : ANNOUNCEMENT_MAP_IN_CENTER[templateType]
    const props: PrivateAnnouncementPropCenter = { announcement, title: PRIVATE_ANN_TITLE()[templateType] }
    return component ? React.createElement(component, props) : null
  } catch (error) {
    return null
  }
}

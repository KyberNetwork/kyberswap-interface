import React from 'react'

import { PRIVATE_ANN_TITLE } from 'components/Announcement/PrivateAnnoucement'
import { AnnouncementTemplate, PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'

import Bridge from './Bridge'
import CrossChain from './CrossChain'
import KyberAI from './KyberAI'
import KyberAIWatchlist from './KyberAIWatchlist'
import LimitOrder from './LimitOrder'
import PoolPosition from './PoolPosition'
import PriceAlert from './PriceAlert'
import PrivateMessage from './PrivateMessage'

export type PrivateAnnouncementPropCenter<T extends AnnouncementTemplate = AnnouncementTemplate> = {
  announcement: PrivateAnnouncement<T>
  title?: string
}

type PrivateAnnouncementCenterMap = {
  [type in PrivateAnnouncementType]: (data: { announcement: PrivateAnnouncement }) => JSX.Element
}
const ANNOUNCEMENT_MAP_IN_CENTER = {
  [PrivateAnnouncementType.ELASTIC_POOLS]: PoolPosition,
  [PrivateAnnouncementType.LIMIT_ORDER]: LimitOrder,
  [PrivateAnnouncementType.BRIDGE_ASSET]: Bridge,
  [PrivateAnnouncementType.CROSS_CHAIN]: CrossChain,
  [PrivateAnnouncementType.KYBER_AI]: KyberAI,
  [PrivateAnnouncementType.KYBER_AI_WATCH_LIST]: KyberAIWatchlist,
  [PrivateAnnouncementType.PRICE_ALERT]: PriceAlert,
  [PrivateAnnouncementType.DIRECT_MESSAGE]: PrivateMessage,
} as PrivateAnnouncementCenterMap

export default function InboxItemNotificationCenter({ announcement }: PrivateAnnouncementPropCenter) {
  const { templateType } = announcement
  try {
    const component = ANNOUNCEMENT_MAP_IN_CENTER[templateType]
    const props: PrivateAnnouncementPropCenter = { announcement, title: PRIVATE_ANN_TITLE[templateType] }
    return component ? React.createElement(component, props) : null
  } catch (error) {
    return null
  }
}

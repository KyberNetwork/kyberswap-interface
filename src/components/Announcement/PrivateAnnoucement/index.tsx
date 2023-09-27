import { t } from '@lingui/macro'
import React, { ReactNode } from 'react'
import { CSSProperties } from 'styled-components'

import InboxItemBridge from 'components/Announcement/PrivateAnnoucement/InboxItemBridge'
import InboxItemCrossChain from 'components/Announcement/PrivateAnnoucement/InboxItemCrossChain'
import InboxItemTrendingSoon from 'components/Announcement/PrivateAnnoucement/InboxItemKyberAI'
import InboxItemKyberAIWatchList from 'components/Announcement/PrivateAnnoucement/InboxItemKyberAIWatchList'
import InboxItemLO from 'components/Announcement/PrivateAnnoucement/InboxItemLO'
import InboxItemPoolPosition from 'components/Announcement/PrivateAnnoucement/InboxItemPoolPosition'
import InboxItemPriceAlert from 'components/Announcement/PrivateAnnoucement/InboxItemPriceAlert'
import InboxItemPrivateMessage from 'components/Announcement/PrivateAnnoucement/InboxItemPrivateMessage'
import { InboxItemTime } from 'components/Announcement/PrivateAnnoucement/styled'
import { AnnouncementTemplate, PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'
import useTheme from 'hooks/useTheme'
import { formatTime } from 'utils/time'

export type PrivateAnnouncementProp<T extends AnnouncementTemplate = AnnouncementTemplate> = {
  announcement: PrivateAnnouncement<T>
  onRead: (data: PrivateAnnouncement, statusMessage: string) => void
  style: CSSProperties
  time?: ReactNode
  title?: string
}

type PrivateAnnouncementMap = Partial<{
  [type in PrivateAnnouncementType]: (data: PrivateAnnouncementProp) => JSX.Element
}>
const ANNOUNCEMENT_MAP: PrivateAnnouncementMap = {
  [PrivateAnnouncementType.ELASTIC_POOLS]: InboxItemPoolPosition,
  [PrivateAnnouncementType.LIMIT_ORDER]: InboxItemLO,
  [PrivateAnnouncementType.KYBER_AI]: InboxItemTrendingSoon,
  [PrivateAnnouncementType.BRIDGE_ASSET]: InboxItemBridge,
  [PrivateAnnouncementType.CROSS_CHAIN]: InboxItemCrossChain,
  [PrivateAnnouncementType.PRICE_ALERT]: InboxItemPriceAlert,
  [PrivateAnnouncementType.DIRECT_MESSAGE]: InboxItemPrivateMessage,
  [PrivateAnnouncementType.KYBER_AI_WATCHLIST]: InboxItemKyberAIWatchList,
} as PrivateAnnouncementMap

export const PRIVATE_ANN_TITLE: Partial<{ [type in PrivateAnnouncementType]: string }> = {
  [PrivateAnnouncementType.BRIDGE_ASSET]: t`Cross-Chain Bridge`,
  [PrivateAnnouncementType.CROSS_CHAIN]: t`Cross-Chain Swaps`,
  [PrivateAnnouncementType.LIMIT_ORDER]: t`Limit Orders`,
  [PrivateAnnouncementType.KYBER_AI]: t`Top Tokens by KyberAI`,
  [PrivateAnnouncementType.KYBER_AI_WATCHLIST]: t`KyberAI Watchlist`,
  [PrivateAnnouncementType.PRICE_ALERT]: t`Price Alerts`,
  [PrivateAnnouncementType.ELASTIC_POOLS]: t`Elastic Liquidity Positions`,
  [PrivateAnnouncementType.DIRECT_MESSAGE]: t`Notification`,
}

export default function InboxItem({ announcement, onRead, style }: PrivateAnnouncementProp) {
  const { templateType, sentAt, isRead } = announcement
  const theme = useTheme()
  const props: PrivateAnnouncementProp = {
    onRead,
    style,
    time: <InboxItemTime color={isRead ? theme.border : theme.subText}>{formatTime(sentAt)}</InboxItemTime>,
    announcement,
    title: PRIVATE_ANN_TITLE[templateType],
  }
  try {
    const component = ANNOUNCEMENT_MAP[templateType]
    return component ? React.createElement(component, props) : null
  } catch (error) {
    return null
  }
}

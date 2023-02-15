import { ReactNode } from 'react'

import { LimitOrder } from 'components/swapv2/LimitOrder/type'
import { MultichainTransfer } from 'hooks/bridge/useGetBridgeTransfers'

export type Announcement = {
  isRead: boolean
  id: string
  name: string
  content: string
  startAt: number
  actionURL: string
}

export enum PrivateAnnouncementType {
  LIMIT_ORDER = 'LimitOrderFilled',
  BRIDGE = 'Bridge',
  TRENDING_SOON_TOKEN = 'TrendingSoonTokens',
}

export type PrivateAnnouncement = {
  id: number
  templateType: PrivateAnnouncementType
  templateId: number
  templateBody: AnnouncementTemplate
}

export type AnnouncementCTA = { name: string; url: string }

export type TrueSightToken = {
  tokenSymbol: string
  price: string
  priceChange: string
  tokenLogoURL: string
  tokenAddress: string
}

// for private announcement
export type AnnouncementTemplateLimitOrder = { order: LimitOrder }
export type AnnouncementTemplateBridge = { transaction: MultichainTransfer }
export type AnnouncementTemplateTrendingSoon = { tokens: TrueSightToken[] }

// for general announcement
export type AnnouncementTemplatePopup = {
  name: string
  content: string
  ctas: AnnouncementCTA[]
  thumbnailImageURL: string
  type: 'NORMAL' | 'CRITICAL'
  startAt: number
  endAt: number
}

type AnnouncementTemplate = (
  | AnnouncementTemplateLimitOrder
  | AnnouncementTemplateBridge
  | AnnouncementTemplateTrendingSoon
  | AnnouncementTemplatePopup
) & {
  popupType: PopupType
}

export enum NotificationType {
  SUCCESS,
  ERROR,
  WARNING,
}

export enum PopupType {
  TRANSACTION, // top right
  SIMPLE, // top right
  TOP_RIGHT = 'top-right', // popup noti from server: limit order, bridge, ...
  TOP_BAR = 'top-bar',
  SNIPPET = 'snippet', // bottom left
  CENTER = 'central',
}

export type PopupContentTxn = {
  hash: string
  type: NotificationType
}

export type PopupContentSimple = {
  title: string
  summary?: ReactNode
  icon?: ReactNode
  type: NotificationType
}

export type PopupContentAnnouncement = {
  metaMessageId: string
  templateType: PrivateAnnouncementType
  templateBody: AnnouncementTemplate
  expiredAt: number
  createdAt: number
  startTime: number
}

export type PopupContent = PopupContentTxn | PopupContentSimple | PopupContentAnnouncement

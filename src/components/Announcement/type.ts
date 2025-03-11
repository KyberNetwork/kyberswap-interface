import { ReactNode } from 'react'

import { LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { MultichainTransfer } from 'hooks/bridge/useGetBridgeTransfers'
import { CrossChainTransfer } from 'pages/CrossChain/useTransferHistory'
import { HistoricalPriceAlert } from 'pages/NotificationCenter/const'

export type Announcement = {
  isRead: boolean
  id: number
  templateBody: AnnouncementTemplatePopup
}

export enum PrivateAnnouncementType {
  LIMIT_ORDER = 'LIMIT_ORDER',
  BRIDGE_ASSET = 'BRIDGE_ASSET',
  ELASTIC_POOLS = 'ELASTIC_POOLS',
  CROSS_CHAIN = 'CROSS_CHAIN',
  PRICE_ALERT = 'PRICE_ALERT',
  DIRECT_MESSAGE = 'DIRECT_MESSAGE', // for some specific addresses
}

export type PrivateAnnouncement<T extends AnnouncementTemplate = AnnouncementTemplate> = {
  id: number
  templateType: PrivateAnnouncementType
  templateId: number
  templateBody: T
  isRead: boolean
  sentAt: number
}

export type AnnouncementCTA = { name: string; url: string }

type LimitOrderAnnouncement = {
  walletAddress: string
  makingAmount: string
  makerAssetSymbol: string
  takingAmount: string
  takerAssetSymbol: string
  makingAmountRate: string
  takingAmountRate: string
  filledMakingAmount: string
  filledTakingAmount: string
  makerAssetLogoURL: string
  takerAssetLogoURL: string
  kyberswapURL: string
  status: LimitOrderStatus
  // for partial fill
  filledPercent: string
  increasedFilledPercent: string
  chainId: string
}

type PoolPositionAnnouncement = {
  token0LogoURL: string
  token1LogoURL: string
  token0Symbol: string
  token1Symbol: string
  minPrice: string
  maxPrice: string
  currentPrice: string
  poolAddress: string
  type: 'OUT_OF_RANGE' | 'IN_RANGE'
  chainId: string
}

export type AnnouncementTemplateLimitOrder = {
  order: LimitOrderAnnouncement
  popupType: PopupType
  isReorg: boolean
}
export type AnnouncementTemplateCrossChain = { transaction: CrossChainTransfer; popupType: PopupType }
export type AnnouncementTemplateBridge = { transaction: MultichainTransfer; popupType: PopupType }

export type TokenInfoWatchlist = {
  logoURL: string
  kyberScore: string
  symbol: string
  price: string
  priceChange: string
}

export type AnnouncementTemplatePoolPosition = {
  position: PoolPositionAnnouncement
  popupType: PopupType
}

export type AnnouncementTemplatePriceAlert = {
  alert: HistoricalPriceAlert
  popupType: PopupType
}

// for general announcement
export type AnnouncementTemplatePopup = {
  name: string
  content: string
  thumbnailImageURL: string
  thumbnailVideoURL?: string
  type: 'NORMAL' | 'CRITICAL'
  startAt: number
  endAt: number
  chainIds: string[]
  popupType: PopupType
  ctas: AnnouncementCTA[] // in popup
  ctaURL: string // in notification center
  ctaName: string // in notification center
}

export type AnnouncementTemplate =
  | AnnouncementTemplateLimitOrder
  | AnnouncementTemplateBridge
  | AnnouncementTemplateCrossChain
  | AnnouncementTemplatePoolPosition
  | AnnouncementTemplatePopup
  | AnnouncementTemplatePriceAlert

export enum NotificationType {
  SUCCESS,
  ERROR,
  WARNING,
}

export enum PopupType {
  TRANSACTION, // top right
  SIMPLE, // top right
  TOP_RIGHT = 'TOP_RIGHT', // popup noti from server: limit order, bridge, ...
  TOP_BAR = 'TOP_BAR',
  SNIPPET = 'SNIPPET', // bottom left
  CENTER = 'CENTRAL',
}

export type PopupContentTxn = {
  hash: string
  type: NotificationType
  account: string
}

export type PopupContentSimple = {
  title: string
  type: NotificationType
  summary?: ReactNode
  icon?: ReactNode
  link?: string
}

export type PopupContentAnnouncement = {
  metaMessageId: string
  templateType: PrivateAnnouncementType
  templateBody: AnnouncementTemplate
  startAt: number
  endAt: number
  createdAt: number
}

export type PopupItemType<T extends PopupContent = PopupContent> = {
  key: string
  content: T
  removeAfterMs: number | null
  popupType: PopupType
  account?: string
}

export type PopupContent = PopupContentTxn | PopupContentSimple | PopupContentAnnouncement

import { ReactNode } from 'react'

import { LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { SmartExitDexType } from 'pages/Earns/components/SmartExit/constants'
import { SmartExitCondition } from 'pages/Earns/types'
import { HistoricalPriceAlert } from 'pages/NotificationCenter/const'

export type Announcement = {
  isRead: boolean
  id: number
  templateBody: AnnouncementTemplatePopup
}

export enum PrivateAnnouncementType {
  LIMIT_ORDER = 'LIMIT_ORDER',
  SMART_EXIT = 'SMART_EXIT',
  BRIDGE_ASSET = 'BRIDGE_ASSET',
  ELASTIC_POOLS = 'ELASTIC_POOLS',
  POSITION_STATUS = 'POSITION_STATUS',
  PRICE_ALERT = 'PRICE_ALERT',
  DIRECT_MESSAGE = 'DIRECT_MESSAGE',
}

export enum SmartExitReason {
  CancelledByYou = 'CANCELLED_BY_YOU',
  LiquidityChanged = 'LIQUIDITY_CHANGED',
  ConditionNeverMet = 'CONDITION_NEVER_MET',
  OwnerChanged = 'OWNER_CHANGED',
  MaxGasFeeExceeded = 'MAX_GAS_EXCEEDED',
  ExpiryReached = 'EXPIRY_REACHED',
}

export enum SmartExitStatus {
  CREATED = 'CREATED',
  EXECUTED = 'EXECUTED',
  NOT_EXECUTED = 'NOT_EXECUTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  UNKNOWN = 'UNKNOWN',
}

export type PrivateAnnouncement<T extends AnnouncementTemplate = AnnouncementTemplate> = {
  id: number
  /** This field in the API is deprecated, so the FE will override it by mapping templateId to templateType */
  templateType: PrivateAnnouncementType
  templateId: number
  templateBody: T
  isRead: boolean
  sentAt: number
  isPinned?: boolean
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
  status: LimitOrderStatus | string
  // for partial fill
  filledPercent: string
  increasedFilledPercent: string
  chainId: string
  createdAt?: number
  expiredAt?: number
  requiredMakingAmount?: string
  availableMakingAmount?: string
}

export type PoolPositionAnnouncement = {
  positionId: string
  chainId: string
  token0Symbol: string
  token1Symbol: string
  token0LogoURL: string
  token1LogoURL: string
  currentPrice: number
  minPrice: number
  maxPrice: number
  poolAddress: string
  exchange: string
}

export type PoolPositionLiquidityAnnouncement<NumberOrString = string> = {
  positionId: string
  chainId: NumberOrString
  chainName: string
  token0Symbol: string
  token1Symbol: string
  token0Decimals: NumberOrString
  token1Decimals: NumberOrString
  token0LogoURL: string
  token1LogoURL: string
  currentPrice: NumberOrString
  minPrice: NumberOrString
  maxPrice: NumberOrString
  poolAddress: string
  exchange: string
  kyberswapUrl: string
  wallet: string
  notificationType: 'CREATED' | 'LIQUIDITY_DECREASED' | 'LIQUIDITY_INCREASED'
  oldLiquidity: NumberOrString
  newLiquidity: NumberOrString
  oldToken0Amount: NumberOrString
  newToken0Amount: NumberOrString
  oldToken1Amount: NumberOrString
  newToken1Amount: NumberOrString
  oldValueUsd: NumberOrString
  newValueUsd: NumberOrString
}

export type AnnouncementTemplateLimitOrder = {
  order: LimitOrderAnnouncement
  popupType: PopupType
  isReorg: boolean
}

export type SmartExitOrder = {
  id: string
  condition?: SmartExitCondition
  execution?: {
    receivedAmount0?: string
    receivedAmount1?: string
  }
}

export type SmartExitPosition = {
  id: string
  tokenId: string
  pool: {
    token0: { symbol: string; logo: string }
    token1: { symbol: string; logo: string }
  }
  chain: { id: string; logo: string; name: string }
  dex: { logo: string; type: SmartExitDexType }
}

export type AnnouncementTemplateSmartExit = {
  order: SmartExitOrder
  position: SmartExitPosition
  popupType: PopupType
  reason?: SmartExitReason
}

export type TokenInfoWatchlist = {
  logoURL: string
  kyberScore: string
  symbol: string
  price: string
  priceChange: string
}

export type AnnouncementTemplatePoolPosition = {
  position: PoolPositionAnnouncement | PoolPositionLiquidityAnnouncement
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
  | AnnouncementTemplatePoolPosition
  | AnnouncementTemplatePopup
  | AnnouncementTemplatePriceAlert
  | AnnouncementTemplateSmartExit

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

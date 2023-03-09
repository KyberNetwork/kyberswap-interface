import { Currency } from '@kyberswap/ks-sdk-core'

import { MAINNET_NETWORKS, NETWORKS_INFO } from 'constants/networks'

export enum PriceAlertType {
  ABOVE = 'above',
  BELOW = 'below',
}

export enum NOTIFICATION_ROUTES {
  CREATE_ALERT = '/create-alert',
  OVERVIEW = '/overview',
  ALL = '/',
  GENERAL = '/general',
  PRICE_ALERTS = '/price-alerts',
  MY_ELASTIC_POOLS = '/elastic-pools',
  LIMIT_ORDERS = '/limit-orders',
  BRIDGE = '/bridge',
  TRENDING_SOON_TOKENS = '/trending-soon',
}

export type CreatePriceAlertPayload = {
  walletAddress: string
  chainId: string
  tokenInAddress: string
  tokenOutAddress: string
  tokenInAmount: string
  threshold: string
  type: 'above' | 'below'
  isEnabled: boolean
  disableAfterTrigger: boolean
  cooldown: number
  note: string
}

export type PriceAlert = {
  id: number
  chainId: string
  tokenInAddress: string
  tokenOutAddress: string
  tokenInLogoURL: string
  tokenOutLogoURL: string
  tokenInSymbol: string
  tokenOutSymbol: string
  tokenInAmount: string
  tokenInDecimals: number
  threshold: string
  type: PriceAlertType
  isEnabled: boolean
  cooldown: number
  disableAfterTrigger: boolean
  note: string
}

export type PriceAlertStat = {
  maxActiveAlerts: number
  // TODO: should be `maxAlerts`
  maxAlert: number
  totalActiveAlerts: number
  totalAlerts: number
}

export type ConfirmAlertModalData = {
  alert: CreatePriceAlertPayload & { id: number }
  currencyIn: Currency
  currencyOut: Currency
}

const TIMES_IN_SECS = {
  ONE_DAY: 86400,
  ONE_HOUR: 3600,
  ONE_MIN: 60,
}
export const COOLDOWN_OPTIONS = [
  { label: `30 Mins`, value: 30 * TIMES_IN_SECS.ONE_MIN },
  { label: '1 Hour', value: TIMES_IN_SECS.ONE_HOUR },
  { label: '2 Hours', value: 2 * TIMES_IN_SECS.ONE_HOUR },
  { label: '3 Hours', value: 3 * TIMES_IN_SECS.ONE_HOUR },
  { label: '4 Hours', value: 4 * TIMES_IN_SECS.ONE_HOUR },
  { label: '12 Hours', value: 12 * TIMES_IN_SECS.ONE_HOUR },
  { label: '7 Days', value: 7 * TIMES_IN_SECS.ONE_DAY },
]

export const NETWORK_OPTIONS = MAINNET_NETWORKS.map(id => ({
  value: id,
  label: NETWORKS_INFO[id].name,
}))

export const TYPE_OPTIONS = [
  { label: `Above`, value: PriceAlertType.ABOVE },
  { label: 'Below', value: PriceAlertType.BELOW },
]

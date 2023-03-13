import { Currency } from '@kyberswap/ks-sdk-core'

import { MAINNET_NETWORKS, NETWORKS_INFO } from 'constants/networks'

export enum PriceAlertType {
  ABOVE = 'above',
  BELOW = 'below',
}

export type PriceAlert = {
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
  id?: number
}

export type PriceAlertStat = {
  maxActiveAlerts: number
  maxAlert: number
  totalActiveAlerts: number
  totalAlerts: number
}

export type ConfirmAlertModalData = { alert: PriceAlert; currencyIn: Currency; currencyOut: Currency }

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

import { t } from '@lingui/macro'

import { TIMES_IN_SECS } from 'constants/index'
import { PAIR_CATEGORY } from 'constants/trade'

export const STOP_MARKET_DEFAULT_EXPIRE = 7 * TIMES_IN_SECS.ONE_DAY

/**
 * The expiry durations the card offers. Shared by the inline control and the custom-date modal: the
 * modal treats a duration it does not recognise as an absolute epoch timestamp, so a list only one of
 * them knows about turns that duration into a 1970 date.
 */
export const getStopMarketExpiryPresets = () => [
  { value: STOP_MARKET_DEFAULT_EXPIRE, label: t`7 Days` },
  { value: 30 * TIMES_IN_SECS.ONE_DAY, label: t`30 Days` },
  { value: 90 * TIMES_IN_SECS.ONE_DAY, label: t`90 Days` },
  { value: 36500 * TIMES_IN_SECS.ONE_DAY, label: t`Forever` },
]

/**
 * Stop Market slippage in basis points (100 = 1%), configured independently from Swap.
 * Presets and warning thresholds are equivalent to Swap x2, as are defaults except Stable (5 bps).
 * Stable and correlated pairs have no low-slippage warning.
 */
export const STOP_MARKET_SLIPPAGE_CONFIG: Record<
  PAIR_CATEGORY,
  { defaultSlippage: number; presets: number[]; lowThreshold?: number; highThreshold: number }
> = {
  [PAIR_CATEGORY.STABLE]: {
    defaultSlippage: 5,
    presets: [10, 20, 100, 200],
    highThreshold: 40,
  },
  [PAIR_CATEGORY.CORRELATED]: {
    defaultSlippage: 10,
    presets: [10, 20, 100, 200],
    highThreshold: 100,
  },
  [PAIR_CATEGORY.EXOTIC]: {
    defaultSlippage: 100,
    presets: [10, 20, 100, 200],
    lowThreshold: 20,
    highThreshold: 400,
  },
  [PAIR_CATEGORY.HIGH_VOLATILITY]: {
    defaultSlippage: 300,
    presets: [100, 300, 600, 1000],
    lowThreshold: 100,
    highThreshold: 1000,
  },
}

/** Shortcuts for the trigger's distance from the market, offered next to the editable percent chip. */
export const TRIGGER_PERCENT_PRESETS = [-50, -20, -10]

/**
 * Starting fee cap carried in the signed intent. Raised to the live protocol fee from `estimate-fee`
 * before signing — the BE doc requires each entry to be at least that percentage.
 */
export const DEFAULT_MAX_FEES_PERCENTAGE = [1, 1]

/** Ceiling on what the operator may spend on gas, as a percentage of the trade. */
export const DEFAULT_MAX_GAS_PERCENTAGE = 50

/** The share of the order above which the fee is called out as high, so the user can weigh the order's size. */
export const HIGH_FEE_SHARE_PERCENT = 5

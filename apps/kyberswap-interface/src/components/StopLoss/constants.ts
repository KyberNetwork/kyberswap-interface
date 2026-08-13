import { t } from '@lingui/macro'

import { TIMES_IN_SECS } from 'constants/index'

/**
 * A stop-loss fires while the market is moving against the user, so it is provisioned like a
 * high-volatility pair rather than a normal swap: a tighter setting reverts the settlement exactly
 * when the order is most needed.
 */
export const DEFAULT_STOP_LOSS_SLIPPAGE = 50
export const STOP_LOSS_SLIPPAGE_PRESETS = [50, 150, 300, 500]
export const STOP_LOSS_SLIPPAGE_LOW_THRESHOLD = 50
export const STOP_LOSS_SLIPPAGE_HIGH_THRESHOLD = 500

export const STOP_LOSS_DEFAULT_EXPIRE = 30 * TIMES_IN_SECS.ONE_DAY

/**
 * The expiry durations the card offers. Shared by the inline control and the custom-date modal: the
 * modal treats a duration it does not recognise as an absolute epoch timestamp, so a list only one of
 * them knows about turns that duration into a 1970 date.
 */
export const getStopLossExpiryPresets = () => [
  { value: 7 * TIMES_IN_SECS.ONE_DAY, label: t`7 Days` },
  { value: STOP_LOSS_DEFAULT_EXPIRE, label: t`30 Days` },
  { value: 90 * TIMES_IN_SECS.ONE_DAY, label: t`90 Days` },
  { value: 36500 * TIMES_IN_SECS.ONE_DAY, label: t`Forever` },
]

/** Below this distance the trigger is close enough to fire on ordinary price noise. */
export const TRIGGER_CLOSE_TO_MARKET_PERCENT = 2

/** Percent-below-market shortcuts offered next to the editable percent chip. */
export const TRIGGER_PERCENT_PRESETS = [-20, -50]

/**
 * Starting fee cap carried in the signed intent. Raised to the live protocol fee from `estimate-fee`
 * before signing — the BE doc requires each entry to be at least that percentage.
 */
export const DEFAULT_MAX_FEES_PERCENTAGE = [1, 1]

/** Ceiling on what the operator may spend on gas, as a percentage of the trade. */
export const DEFAULT_MAX_GAS_PERCENTAGE = 50

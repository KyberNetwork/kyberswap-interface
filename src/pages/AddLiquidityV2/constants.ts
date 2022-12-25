import { t } from '@lingui/macro'

import { RANGE } from 'state/mint/proamm/type'

export const RANGE_LIST = [RANGE.FULL_RANGE, RANGE.SAFE, RANGE.COMMON, RANGE.EXPERT] as const

export const rangeData: {
  [range in RANGE]: {
    title: string
    tooltip: string
    factor: number
  }
} = {
  [RANGE.FULL_RANGE]: {
    title: t`Full Range`,
    tooltip: t`Suitable for pairs with high price volatility. Although you always earn the fee, your capital efficiency is the lowest among all choices.`,
    factor: Infinity,
  },
  [RANGE.SAFE]: {
    title: t`Safe`,
    tooltip: t`Suitable for pairs with medium price volatility. Anticipating price to fluctuate within ~60%. You can earn fee even if the price goes up by 40% or goes down by 20%.`,
    factor: 75,
  },
  [RANGE.COMMON]: {
    title: t`Common`,
    tooltip: t`Suitable for pairs with low price volatility. Anticipating price to fluctuate within ~35%. You can earn fee even if the price goes up by 20% or goes down by 10%. `,
    factor: 50,
  },
  [RANGE.EXPERT]: {
    title: t`Expert`,
    tooltip: t`Suitable for pairs with low price volatility. Anticipating price to fluctuate within ~15%. You can earn fee even if the price goes up by 10% or goes down by 5%. `,
    factor: 15,
  },
} as const

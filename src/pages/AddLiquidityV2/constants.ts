import { t } from '@lingui/macro'

import { RANGE } from 'state/mint/proamm/type'
import { PairFactor } from 'state/topTokens/type'

export const RANGE_LIST = [RANGE.FULL_RANGE, RANGE.SAFE, RANGE.COMMON, RANGE.EXPERT] as const

export const rangeData: {
  [range in RANGE]: {
    title: string
    tooltip: (pairFactor: PairFactor) => string
    factor: number
  }
} = {
  [RANGE.FULL_RANGE]: {
    title: t`Full Range`,
    tooltip: () =>
      t`Suitable for pairs with high price volatility. Although you always earn the fee, your capital efficiency is the lowest among all choices.`,
    factor: Infinity,
  },
  [RANGE.SAFE]: {
    title: t`Safe`,
    tooltip: (pairFactor: PairFactor) =>
      pairFactor === PairFactor.EXOTIC
        ? t`Suitable for high-risk appetite LPs for pairs with high price volatility. Anticipating price to fluctuate within ~150%. You can earn fees even if the price goes up by 75% or goes down by 75%.`
        : pairFactor === PairFactor.NOMAL
        ? t`Suitable for pairs with low price volatility. Anticipating price to fluctuate within ~45%. You can earn fees even if the price goes up by 22.5% or goes down by 22.5%.`
        : t`Suitable for stablecoin or stable correlated pairs. Anticipating price to fluctuate within ~3%. You can earn fees even if the price goes up by 1.5% or goes down by 1.5%.`,
    factor: 75,
  },
  [RANGE.COMMON]: {
    title: t`Common`,
    tooltip: (pairFactor: PairFactor) =>
      pairFactor === PairFactor.EXOTIC
        ? t`Suitable for low-risk appetite LPs for pairs with high price volatility. Anticipating price to fluctuate within ~100%. You can earn fees even if the price goes up by 50% or goes down by 50%.`
        : pairFactor === PairFactor.NOMAL
        ? t`Suitable for pairs with low price volatility. Anticipating price to fluctuate within ~30%. You can earn fees even if the price goes up by 15% or goes down by 15%.`
        : t`Suitable for stablecoin or stable correlated pairs. Anticipating price to fluctuate within ~1%. You can earn fees even if the price goes up by 0.5% or goes down by 0.5%.`,
    factor: 50,
  },
  [RANGE.EXPERT]: {
    title: t`Expert`,
    tooltip: (pairFactor: PairFactor) =>
      pairFactor === PairFactor.EXOTIC
        ? t`Suitable for high-risk appetite LPs for pairs with high price volatility. Anticipating price to fluctuate within ~30%. You can earn fees even if the price goes up by 15% or goes down by 15%.`
        : pairFactor === PairFactor.NOMAL
        ? t`Suitable for pairs with low price volatility. Anticipating price to fluctuate within ~9%. You can earn fees even if the price goes up by 4.5% or goes down by 4.5%.`
        : t`Suitable for stablecoin or stable correlated pairs. Anticipating price to fluctuate within ~0.6%. You can earn fees even if the price goes up by 0.3% or goes down by 0.3%.`,
    factor: 15,
  },
} as const

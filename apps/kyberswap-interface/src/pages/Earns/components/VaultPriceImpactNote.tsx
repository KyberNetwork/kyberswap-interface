import { PI_LEVEL } from '@kyber/utils'
import { t } from '@lingui/macro'

import { ErrorNote, WarningNote } from 'pages/Earns/components/VaultDeposit/styles'
import { checkPriceImpact } from 'utils/prices'

/** How bad a route is. The levels are the zap flows' names, so the tones and notes below fit both. */
export type VaultPriceImpact = { level: PI_LEVEL }

/**
 * A vault deposit or withdrawal is a trade between two tokens through the aggregator, so it is
 * judged on the swap form's fixed bands — 2% and 10% of value given up — rather than on the zap
 * flows' bands, which scale with a route's suggested slippage. That figure measures the slippage a
 * two-sided liquidity add needs, and a vault route quotes 5 bps of it, which would put the warning
 * at a tenth of a percent and paint an ordinary route red.
 *
 * A quoted route with no figure on it is still unreadable, which the swap bands say nothing about.
 */
export const getVaultPriceImpact = (priceImpact: number | null | undefined): VaultPriceImpact => {
  if (priceImpact === null || priceImpact === undefined || !Number.isFinite(priceImpact))
    return { level: PI_LEVEL.INVALID }

  const { isVeryHigh, isHigh } = checkPriceImpact(priceImpact)
  return { level: isVeryHigh ? PI_LEVEL.VERY_HIGH : isHigh ? PI_LEVEL.HIGH : PI_LEVEL.NORMAL }
}

/**
 * How loudly the reading is carried, on the zap flows' own split of the levels. It drives the note,
 * the figure beside the label and the action button together, so they never disagree about how bad
 * a route is.
 */
export type PriceImpactTone = 'error' | 'warning' | undefined

export const getPriceImpactTone = (result?: VaultPriceImpact): PriceImpactTone =>
  !result
    ? undefined
    : result.level === PI_LEVEL.VERY_HIGH || result.level === PI_LEVEL.INVALID
    ? 'error'
    : result.level === PI_LEVEL.HIGH
    ? 'warning'
    : undefined

/** A route this bad is named and the action relabelled, never blocked — the way the zap flows do it. */
export const isPriceImpactBad = (result?: VaultPriceImpact) => getPriceImpactTone(result) === 'error'

/** The action stays pressable whatever the reading, so it carries the tone rather than the guard. */
export const priceImpactButtonClass = (tone: PriceImpactTone) =>
  tone === 'error' ? 'bg-red text-white' : tone === 'warning' ? 'bg-warning text-white' : undefined

/**
 * What the route costs in price, in the swap form's words to match its bands. Only the headline
 * carries over: everything the swap form says underneath points at Degen Mode or a Limit Order,
 * and a vault offers neither.
 */
const VaultPriceImpactNote = ({ result, className }: { result?: VaultPriceImpact; className?: string }) => {
  const tone = getPriceImpactTone(result)
  if (!result || !tone) return null

  const Note = tone === 'warning' ? WarningNote : ErrorNote
  const message =
    result.level === PI_LEVEL.INVALID
      ? t`Unable to calculate Price Impact.`
      : result.level === PI_LEVEL.VERY_HIGH
      ? t`Price Impact is very high. You will lose funds!`
      : t`Price Impact is high`

  return <Note className={className}>{message}</Note>
}

export default VaultPriceImpactNote

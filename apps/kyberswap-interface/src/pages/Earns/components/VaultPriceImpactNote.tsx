import { translateZapMessage } from '@kyber/ui'
import { PI_LEVEL, ZAP_MESSAGES } from '@kyber/utils'

import { ErrorNote, WarningNote } from 'pages/Earns/components/VaultDeposit/styles'

/** The reading the zap flows produce: a level, a figure, and the sentence that goes with the level. */
export type VaultPriceImpact = { level: PI_LEVEL; display: string; msg: string }

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
 * What the route costs in price. Both the thresholds and the wording are the zap flows' own, read
 * off `translateZapImpact` — nothing here decides when a route is bad or invents what to call it.
 *
 * The worst level is the one exception, and it still says nothing new: the zap sentence for it sends
 * the reader to Degen Mode, which a vault has no switch for, so it carries the plainer of the two
 * sentences zap already ships instead.
 */
const VaultPriceImpactNote = ({ result, className }: { result?: VaultPriceImpact; className?: string }) => {
  if (!result?.msg) return null

  const Note = getPriceImpactTone(result) === 'warning' ? WarningNote : ErrorNote
  const message =
    result.level === PI_LEVEL.VERY_HIGH ? translateZapMessage(ZAP_MESSAGES.ZAP_IMPACT_WARNING) : result.msg

  return <Note className={className}>{message}</Note>
}

export default VaultPriceImpactNote

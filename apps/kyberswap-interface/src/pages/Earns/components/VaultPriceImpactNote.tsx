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

/**
 * Only the reading that stands between the form and a signature turns the button. A high one is
 * named in the note and beside the figure, and leaving the button alone keeps the colour meaning the
 * one thing: this will not go through as it is.
 */
export const priceImpactButtonClass = (tone: PriceImpactTone) => (tone === 'error' ? 'bg-red text-white' : undefined)

/**
 * What the route costs in price, in the swap form's words to match its bands. A reading bad enough
 * to need Degen Mode says so underneath, as the swap form does; the swap form's other line points at
 * a Limit Order, which a vault has no equivalent of.
 */
const VaultPriceImpactNote = ({
  result,
  isDegenMode,
  className,
}: {
  result?: VaultPriceImpact
  /** Whether the setting that would let this route through is already on. */
  isDegenMode?: boolean
  className?: string
}) => {
  const tone = getPriceImpactTone(result)
  if (!result || !tone) return null

  const Note = tone === 'warning' ? WarningNote : ErrorNote
  const message =
    result.level === PI_LEVEL.INVALID
      ? t`Unable to calculate Price Impact.`
      : result.level === PI_LEVEL.VERY_HIGH
      ? t`Price Impact is very high. You will lose funds!`
      : t`Price Impact is high`

  // The zap flows' own two sentences, word for word.
  const degenNote = !isPriceImpactBad(result)
    ? null
    : isDegenMode
    ? t`You have turned on Degen Mode from settings. Trades with very high price impact can be executed`
    : t`To ensure you dont lose funds due to very high price impact, swap has been disabled for this trade. If you still wish to continue, you can turn on Degen Mode from Settings.`

  return (
    <Note className={className}>
      {message}
      {degenNote ? <span className="mt-1 block opacity-80">{degenNote}</span> : null}
    </Note>
  )
}

export default VaultPriceImpactNote

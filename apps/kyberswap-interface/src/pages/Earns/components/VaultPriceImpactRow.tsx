import { t } from '@lingui/macro'

import ValueSkeleton from 'pages/Earns/components/ValueSkeleton'
import { InfoLabel, InfoRow, InfoValue } from 'pages/Earns/components/VaultDeposit/styles'
import { VaultPriceImpact, getPriceImpactTone } from 'pages/Earns/components/VaultPriceImpactNote'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

/**
 * The figure behind the impact warning: how far the route moves the pools it passes through. Only a
 * quoted route carries one, so the row reads "--" until the quote lands. The API states it as a
 * percent — 1.45 meaning 1.45% — which is why it is divided before being formatted as one.
 *
 * A route can return more value than it spends, so the figure goes either side of zero and the
 * formatter has to be told to print a negative; left to itself it blanks one.
 *
 * It carries the same tone as the note below it, the way the zap flows colour theirs.
 */
const VaultPriceImpactRow = ({
  priceImpact,
  result,
  isLoading,
}: {
  priceImpact?: number | null
  result?: VaultPriceImpact
  isLoading?: boolean
}) => {
  const tone = getPriceImpactTone(result)
  // A route can carry a null or non-finite figure, and dividing that lands on a confident 0%.
  const hasFigure = typeof priceImpact === 'number' && Number.isFinite(priceImpact)

  return (
    <InfoRow>
      <InfoLabel
        tooltip={t`How far this trade moves the price of the pools it routes through. A large impact means thin liquidity.`}
      >{t`Price Impact`}</InfoLabel>
      <InfoValue className={cn(tone === 'error' && 'text-red', tone === 'warning' && 'text-warning')}>
        {hasFigure ? (
          formatDisplayNumber(priceImpact / 100, { style: 'percent', fractionDigits: 2, allowDisplayNegative: true })
        ) : isLoading ? (
          <ValueSkeleton />
        ) : (
          '--'
        )}
      </InfoValue>
    </InfoRow>
  )
}

export default VaultPriceImpactRow

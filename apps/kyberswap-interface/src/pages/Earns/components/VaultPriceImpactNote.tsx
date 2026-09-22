import { t } from '@lingui/macro'

import { ErrorNote } from 'pages/Earns/components/VaultDeposit/styles'
import { cn } from 'utils/cn'
import { checkPriceImpact } from 'utils/prices'

type PriceImpactResult = ReturnType<typeof checkPriceImpact>

/**
 * What the route costs in price, on the same thresholds the swap form uses. The action it belongs to
 * is relabelled rather than disabled: swap can block outright because degen mode is there to unblock
 * it, and a vault has no such switch — a blocked button would be a dead end.
 */
const VaultPriceImpactNote = ({ result, className }: { result: PriceImpactResult; className?: string }) => {
  if (result.isInvalid) {
    return <ErrorNote className={className}>{t`Unable to calculate the price impact of this route.`}</ErrorNote>
  }

  if (result.isVeryHigh) {
    return (
      <ErrorNote className={className}>
        {t`Price impact is very high — you will lose a significant part of this amount. Try a smaller size.`}
      </ErrorNote>
    )
  }

  if (result.isHigh) {
    return (
      <ErrorNote className={cn('bg-warning-20 text-warning', className)}>
        {t`Price impact is higher than usual for this route.`}
      </ErrorNote>
    )
  }

  return null
}

export default VaultPriceImpactNote

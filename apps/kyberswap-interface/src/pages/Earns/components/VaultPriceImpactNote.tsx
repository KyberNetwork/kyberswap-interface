import { t } from '@lingui/macro'

import { ErrorNote, WarningNote } from 'pages/Earns/components/VaultDeposit/styles'
import { cn } from 'utils/cn'
import { checkPriceImpact } from 'utils/prices'

type PriceImpactResult = ReturnType<typeof checkPriceImpact>

/** The treatment the zap flows give the same reading: full-size text, undimmed, on the tone alone. */
const ZAP_NOTE = 'text-sm text-white'

/**
 * What the route costs in price, on the same thresholds the swap form uses. The action it belongs to
 * is relabelled rather than disabled: swap can block outright because degen mode is there to unblock
 * it, and a vault has no such switch — a blocked button would be a dead end.
 */
const VaultPriceImpactNote = ({ result, className }: { result: PriceImpactResult; className?: string }) => {
  if (result.isInvalid) {
    return (
      <ErrorNote
        className={cn(ZAP_NOTE, className)}
      >{t`Unable to calculate the price impact of this route.`}</ErrorNote>
    )
  }

  if (result.isVeryHigh) {
    return (
      <ErrorNote className={cn(ZAP_NOTE, className)}>
        {t`Price impact is very high — you will lose a significant part of this amount. Try a smaller size.`}
      </ErrorNote>
    )
  }

  if (result.isHigh) {
    return (
      <WarningNote className={cn(ZAP_NOTE, className)}>
        {t`Price impact is higher than usual for this route.`}
      </WarningNote>
    )
  }

  return null
}

export default VaultPriceImpactNote

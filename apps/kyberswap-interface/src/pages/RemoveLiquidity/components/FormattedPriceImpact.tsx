import { Percent } from '@kyberswap/ks-sdk-core'

import { ONE_BIPS } from 'constants/index'
import { cn } from 'utils/cn'
import { warningSeverity } from 'utils/prices'

const severityClass = (severity: 0 | 1 | 2 | 3 | 4): string => {
  if (severity === 3 || severity === 4) return 'text-red1'
  if (severity === 2) return 'text-yellow2'
  if (severity === 1) return 'text-text'
  return 'text-green1'
}

/**
 * Formatted version of price impact text with warning colors
 */
export const FormattedPriceImpact = ({ priceImpact }: { priceImpact?: Percent }) => {
  if (!priceImpact || priceImpact.lessThan('0')) {
    return <div>--</div>
  }

  return (
    <span className={cn('text-sm font-medium', severityClass(warningSeverity(priceImpact)))}>
      {priceImpact.lessThan(ONE_BIPS) ? '<0.01%' : `${priceImpact.toFixed(2)}%`}
    </span>
  )
}

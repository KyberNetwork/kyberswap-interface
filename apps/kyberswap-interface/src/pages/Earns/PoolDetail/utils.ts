import { formatAprNumber } from '@kyber/utils'

import { formatDisplayNumber } from 'utils/numbers'

export const formatPoolInfoCurrency = (value?: number) =>
  value || value === 0 ? formatDisplayNumber(value, { style: 'currency', significantDigits: 6 }) : '--'

export const formatPoolInfoPercent = (value?: number) => (value || value === 0 ? `${formatAprNumber(value)}%` : '--')

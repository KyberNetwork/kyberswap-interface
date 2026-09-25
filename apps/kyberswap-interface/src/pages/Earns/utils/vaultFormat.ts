import { t } from '@lingui/macro'

import { formatDisplayNumber } from 'utils/numbers'

/** A figure the API could not supply reads as unknown; zero is reserved for a real zero. */
const UNKNOWN = '--'

/** A vault's size, in dollars on every surface that names it. */
export const formatVaultTvl = (value?: number) =>
  value === undefined ? UNKNOWN : formatDisplayNumber(value, { style: 'currency', significantDigits: 3 })

/** A vault's rate, to the same two decimals on every surface that names it. */
export const formatVaultApy = (value?: number) =>
  value === undefined ? UNKNOWN : `${formatDisplayNumber(value, { style: 'decimal', fractionDigits: 2 })}%`

/**
 * What a run moved, for the step that reports it. Two tokens are named outright; past that the row
 * would outgrow the modal, so they are counted instead.
 */
export const formatVaultAmounts = (amounts: { amount: string; symbol: string }[]): string => {
  if (!amounts.length) return ''
  const count = amounts.length
  if (count > 2) return t`${count} tokens`
  return amounts
    .map(({ amount, symbol }) => `${formatDisplayNumber(amount, { significantDigits: 6 })} ${symbol}`.trim())
    .join(' + ')
}

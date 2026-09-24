import { formatDisplayNumber } from 'utils/numbers'

/** A figure the API could not supply reads as unknown; zero is reserved for a real zero. */
const UNKNOWN = '--'

/** A vault's size, in dollars on every surface that names it. */
export const formatVaultTvl = (value?: number) =>
  value === undefined ? UNKNOWN : formatDisplayNumber(value, { style: 'currency', significantDigits: 3 })

/** A vault's rate, to the same two decimals on every surface that names it. */
export const formatVaultApy = (value?: number) =>
  value === undefined ? UNKNOWN : `${formatDisplayNumber(value, { style: 'decimal', fractionDigits: 2 })}%`

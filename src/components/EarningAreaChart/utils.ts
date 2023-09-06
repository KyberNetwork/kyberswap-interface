// todo: deprecated, use formatDisplayNumber instead
export const formatUSDValue = (v: number, compact = true): string => {
  if (v === 0) {
    return '$0'
  }

  if (v < 0.01) {
    return '< $0.01'
  }

  const formatter = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return formatter.format(v)
}

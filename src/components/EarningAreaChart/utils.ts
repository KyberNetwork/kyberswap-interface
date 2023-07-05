export const formatUSDValue = (v: number, compact = true): string => {
  if (v === 0) {
    return '$0'
  }

  if (v < 0.0001) {
    return '< $0.0001'
  }

  const formatter = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })

  return formatter.format(v)
}

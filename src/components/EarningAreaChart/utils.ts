export const formatUSDValue = (v: number, compact = true) => {
  const formatter = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return formatter.format(v)
}

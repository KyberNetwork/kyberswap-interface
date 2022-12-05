export const formatUSDValue = (v: number) => {
  const formatter = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumSignificantDigits: 2,
  })

  return formatter.format(v)
}

import { formatDisplayNumber } from 'utils/numbers'

export const formatAprNumber = (apr: string | number): string => {
  const formattedApr = Number(apr)
  let n = 0
  while (n < 4) {
    if (formattedApr - 10 ** n < 0) break
    n++
  }

  return formatDisplayNumber(formattedApr, { significantDigits: n + 2 })
}

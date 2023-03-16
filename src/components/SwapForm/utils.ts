import { toK } from 'utils'

// Take only 6 fraction digits
// This returns a different result compared to toFixed
// 0.000297796.toFixed(6) = 0.000298
// truncateFloatNumber(0.000297796) = 0.000297
const truncateFloatNumber = (num: number, maximumFractionDigits = 6) => {
  const [wholePart, fractionalPart] = String(num).split('.')

  if (!fractionalPart) {
    return wholePart
  }

  return `${wholePart}.${fractionalPart.slice(0, maximumFractionDigits)}`
}

export function formatMinimumReceived(strNum: string) {
  if (!strNum) {
    return 0
  }

  const num = parseFloat(strNum)

  if (num > 500000000) {
    return toK(num.toFixed(0))
  }

  if (num >= 1000) {
    return Number(num.toFixed(0)).toLocaleString(undefined)
  }

  if (0 < num && num < 0.0001) {
    return '< 0.0001'
  }

  if (num === 0) {
    return 0
  }

  return truncateFloatNumber(num)
}

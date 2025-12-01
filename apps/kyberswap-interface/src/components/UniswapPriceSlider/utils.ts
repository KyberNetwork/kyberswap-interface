/**
 * Generate SVG path for brush handle (oval shape with rounded ends)
 */
export const brushHandlePath = (height: number): string => {
  return [
    `M 0.5 0`,
    `Q 0 0 0 1.5`, // Rounded top-left corner
    `v 3.5`,
    `C -5 5 -5 17 0 17`, // Oval
    `v ${height - 19}`,
    `Q 0 ${height} 0.5 ${height}`, // Rounded bottom-left corner
    `Q 1 ${height} 1 ${height - 1.5}`, // Rounded bottom-right corner
    `V 17`,
    `C 6 17 6 5 1 5`,
    `V 1.5`,
    `Q 1 0 0.5 0`, // Rounded top-right corner
  ].join(' ')
}

/**
 * Calculate nice tick values for the price axis
 * Returns an array of prices that are evenly spaced and use "nice" numbers
 */
export const calculatePriceAxisTicks = (minPrice: number, maxPrice: number, targetTickCount = 6): number[] => {
  const range = maxPrice - minPrice
  if (range <= 0) return []

  // Calculate the rough step size
  const roughStep = range / targetTickCount

  // Find the magnitude of the step
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)))

  // Choose a nice step value (1, 2, 2.5, 5, 10 times the magnitude)
  const niceSteps = [1, 2, 2.5, 5, 10]
  let niceStep = magnitude
  for (const step of niceSteps) {
    if (step * magnitude >= roughStep) {
      niceStep = step * magnitude
      break
    }
  }

  // Calculate the start and end values
  const start = Math.ceil(minPrice / niceStep) * niceStep
  const ticks: number[] = []

  for (let tick = start; tick <= maxPrice; tick += niceStep) {
    // Avoid floating point precision issues
    const roundedTick = Math.round(tick * 1e10) / 1e10
    if (roundedTick >= minPrice && roundedTick <= maxPrice) {
      ticks.push(roundedTick)
    }
  }

  return ticks
}

/**
 * Format number with comma separators
 */
const formatWithCommas = (num: number, decimals = 0): string => {
  const fixed = num.toFixed(decimals)
  const parts = fixed.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

/**
 * Format price for axis display - user-friendly format
 * Shows more detail for smaller ranges, uses abbreviations for large numbers
 */
export const formatAxisPrice = (price: number): string => {
  if (price === 0) return '0'
  if (!isFinite(price)) return '∞'

  const absPrice = Math.abs(price)
  const sign = price < 0 ? '-' : ''

  // For astronomically large numbers, show a capped display
  if (absPrice >= 1e18) {
    return sign + '>999Q'
  }
  // Quadrillions (10^15)
  if (absPrice >= 1e15) {
    const val = absPrice / 1e15
    return sign + (val >= 100 ? Math.round(val) : val.toFixed(1)) + 'Q'
  }
  // Trillions (10^12)
  if (absPrice >= 1e12) {
    const val = absPrice / 1e12
    return sign + (val >= 100 ? Math.round(val) : val.toFixed(1)) + 'T'
  }
  // Billions (10^9)
  if (absPrice >= 1e9) {
    const val = absPrice / 1e9
    return sign + (val >= 100 ? Math.round(val) : val.toFixed(1)) + 'B'
  }
  // Millions (10^6)
  if (absPrice >= 1e6) {
    const val = absPrice / 1e6
    return sign + (val >= 100 ? Math.round(val) : val.toFixed(1)) + 'M'
  }
  // 100K - 999K: use K suffix
  if (absPrice >= 100000) {
    const val = absPrice / 1000
    return sign + Math.round(val) + 'K'
  }
  // 10K - 99.9K: show as "12.5K" with more precision
  if (absPrice >= 10000) {
    const val = absPrice / 1000
    return sign + val.toFixed(1) + 'K'
  }
  // 1K - 9.9K: show full number with comma (like "2,500" or "3,750")
  if (absPrice >= 1000) {
    // Round to nearest 10 for cleaner display
    const rounded = Math.round(absPrice / 10) * 10
    return sign + formatWithCommas(rounded)
  }
  // 100 - 999: show full number
  if (absPrice >= 100) {
    return sign + Math.round(absPrice).toString()
  }
  // 10 - 99.99: show with 1 decimal
  if (absPrice >= 10) {
    return price.toFixed(1)
  }
  // 1 - 9.99: show with 2 decimals
  if (absPrice >= 1) {
    return price.toFixed(2)
  }
  // Small decimals
  if (absPrice >= 0.01) {
    return price.toFixed(4)
  }
  if (absPrice >= 0.0001) {
    return price.toFixed(5)
  }
  // For extremely small numbers, show a floor display
  if (absPrice < 1e-8) {
    return sign + '<0.00001'
  }
  return price.toPrecision(3)
}

/**
 * Calculate edge intensity for zoom behavior
 * Returns 0-1 based on how close position is to edge
 */
export const getEdgeIntensity = (position: number, edgeThreshold: number): number => {
  if (position < edgeThreshold) {
    return 1 - position / edgeThreshold
  }
  if (position > 100 - edgeThreshold) {
    return (position - (100 - edgeThreshold)) / edgeThreshold
  }
  return 0
}

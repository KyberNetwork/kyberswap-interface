import { PriceCondition } from 'pages/Earns/types'

interface ExpectedAmounts {
  amount0: number
  amount1: number
}

/**
 * Calculate expected token amounts when removing liquidity at specific price conditions
 * Based on Uniswap V3 formulas:
 * - If price < priceLower: all liquidity is in token0
 * - If price > priceUpper: all liquidity is in token1
 * - If priceLower <= price <= priceUpper: liquidity is split between both tokens
 *
 * Correct Uniswap V3/V4 formulas:
 * When in range:
 * - amount0 = liquidity * (1/sqrt(price) - 1/sqrt(priceUpper))
 * - amount1 = liquidity * (sqrt(price) - sqrt(priceLower))
 * When price < priceLower (all in token0):
 * - amount0 = liquidity * (1/sqrt(priceLower) - 1/sqrt(priceUpper))
 * - amount1 = 0
 * When price > priceUpper (all in token1):
 * - amount0 = 0
 * - amount1 = liquidity * (sqrt(priceUpper) - sqrt(priceLower))
 */
export function calculateExpectedAmounts(
  position: { currentPrice: number; minPrice: number; maxPrice: number; token0Amount: number; token1Amount: number },
  priceCondition?: PriceCondition,
): ExpectedAmounts | null {
  const { currentPrice, minPrice, maxPrice, token0Amount, token1Amount } = position

  if ((!priceCondition?.gte && !priceCondition?.lte) || currentPrice <= 0 || minPrice > maxPrice) {
    return null
  }

  const exitPrice = priceCondition.gte ? parseFloat(priceCondition.gte) : parseFloat(priceCondition.lte)

  if (!exitPrice || exitPrice <= 0) {
    return null
  }

  // Calculate liquidity from current amounts and price
  // Using the relationship: L = sqrt(amount0 * amount1 * P)
  const liquidity = estimateLiquidity(token0Amount, token1Amount, currentPrice, minPrice, maxPrice)

  // Calculate expected amounts at exit price
  const { amount0, amount1 } = calculateAmountsAtPrice(exitPrice, minPrice, maxPrice, liquidity)

  return {
    amount0,
    amount1,
  }
}

/**
 * Estimate liquidity from current amounts and prices
 * Using correct Uniswap V3 formulas:
 * L = amount0 / (1/sqrt(P) - 1/sqrt(Pb))  where P is current price, Pb is upper bound
 * L = amount1 / (sqrt(P) - sqrt(Pa))      where Pa is lower bound
 */
function estimateLiquidity(
  amount0: number,
  amount1: number,
  currentPrice: number,
  priceLower: number,
  priceUpper: number,
): number {
  const sqrtPrice = Math.sqrt(currentPrice)
  const sqrtPriceLower = Math.sqrt(priceLower)
  const sqrtPriceUpper = Math.sqrt(priceUpper)

  const isOutOfRange = currentPrice < priceLower || currentPrice > priceUpper

  if (isOutOfRange) {
    if (currentPrice < priceLower) {
      // All in token0: L = amount0 / (1/sqrt(Pa) - 1/sqrt(Pb))
      return amount0 / (1 / sqrtPriceLower - 1 / sqrtPriceUpper)
    } else {
      // All in token1: L = amount1 / (sqrt(Pb) - sqrt(Pa))
      return amount1 / (sqrtPriceUpper - sqrtPriceLower)
    }
  }

  // In range - calculate from both and take average for stability
  let L0 = 0
  let L1 = 0

  if (amount0 > 0) {
    // L = amount0 / (1/sqrt(P) - 1/sqrt(Pb))
    const denominator0 = 1 / sqrtPrice - 1 / sqrtPriceUpper
    if (Math.abs(denominator0) > 0.000001) {
      // Avoid division by very small number
      L0 = amount0 / denominator0
    }
  }

  if (amount1 > 0) {
    // L = amount1 / (sqrt(P) - sqrt(Pa))
    const denominator1 = sqrtPrice - sqrtPriceLower
    if (Math.abs(denominator1) > 0.000001) {
      // Avoid division by very small number
      L1 = amount1 / denominator1
    }
  }

  // Return average if both are calculated, otherwise return the non-zero one
  if (L0 > 0 && L1 > 0) {
    return (L0 + L1) / 2
  }
  return L0 > 0 ? L0 : L1
}

/**
 * Calculate token amounts at a specific price using correct Uniswap V3 formulas
 */
function calculateAmountsAtPrice(
  price: number,
  priceLower: number,
  priceUpper: number,
  liquidity: number,
): { amount0: number; amount1: number } {
  // If no liquidity, return 0
  if (liquidity === 0) {
    return { amount0: 0, amount1: 0 }
  }

  const sqrtPrice = Math.sqrt(price)
  const sqrtPriceLower = Math.sqrt(priceLower)
  const sqrtPriceUpper = Math.sqrt(priceUpper)

  // Case 1: Price below range - all in token0
  if (price <= priceLower) {
    // amount0 = L * (1/sqrt(Pa) - 1/sqrt(Pb))
    const amount0 = liquidity * (1 / sqrtPriceLower - 1 / sqrtPriceUpper)
    return {
      amount0,
      amount1: 0,
    }
  }

  // Case 2: Price above range - all in token1
  if (price >= priceUpper) {
    // amount1 = L * (sqrt(Pb) - sqrt(Pa))
    const amount1 = liquidity * (sqrtPriceUpper - sqrtPriceLower)
    return {
      amount0: 0,
      amount1,
    }
  }

  // Case 3: Price in range - split between both tokens
  // amount0 = L * (1/sqrt(P) - 1/sqrt(Pb))
  // amount1 = L * (sqrt(P) - sqrt(Pa))
  const amount0 = liquidity * (1 / sqrtPrice - 1 / sqrtPriceUpper)
  const amount1 = liquidity * (sqrtPrice - sqrtPriceLower)

  return {
    amount0,
    amount1,
  }
}

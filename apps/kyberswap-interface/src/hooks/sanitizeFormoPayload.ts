const MAX_FEE_USD = 100_000
const MAX_SIDE_USD = 500_000_000
const RATIO_CLAMP_MIN_SIDE = 10
const RATIO_CLAMP_MAX_RATIO = 100
const ONE_SIDE_NEAR_ZERO_THRESHOLD = 10
const ONE_SIDE_LARGE_THRESHOLD = 100_000

const USD_FIELD_PATTERN = /usd$/i
const VOLUME_FIELD_PATTERN = /^volume/i

const parseUsd = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

const isUsdLikeKey = (key: string): boolean => USD_FIELD_PATTERN.test(key) || VOLUME_FIELD_PATTERN.test(key)

const writeBack = (payload: Record<string, any>, key: string, next: number): void => {
  payload[key] = typeof payload[key] === 'string' ? String(next) : next
}

export const sanitizeFormoPayload = (properties?: Record<string, any>): Record<string, any> | undefined => {
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) return properties

  const sanitized: Record<string, any> = { ...properties }

  const amountIn = parseUsd(properties.amount_in_usd)
  const amountOut = parseUsd(properties.amount_out_usd)

  if (amountIn !== undefined && amountOut !== undefined && Number.isFinite(amountIn) && Number.isFinite(amountOut)) {
    if (
      amountIn > RATIO_CLAMP_MIN_SIDE &&
      amountOut > RATIO_CLAMP_MIN_SIDE &&
      (amountIn / amountOut > RATIO_CLAMP_MAX_RATIO || amountOut / amountIn > RATIO_CLAMP_MAX_RATIO)
    ) {
      const min = Math.min(amountIn, amountOut)
      writeBack(sanitized, 'amount_in_usd', min)
      writeBack(sanitized, 'amount_out_usd', min)
    } else if (amountIn < ONE_SIDE_NEAR_ZERO_THRESHOLD && amountOut > ONE_SIDE_LARGE_THRESHOLD) {
      writeBack(sanitized, 'amount_out_usd', 0)
    } else if (amountOut < ONE_SIDE_NEAR_ZERO_THRESHOLD && amountIn > ONE_SIDE_LARGE_THRESHOLD) {
      writeBack(sanitized, 'amount_in_usd', 0)
    }
  }

  for (const key of Object.keys(sanitized)) {
    if (!isUsdLikeKey(key)) continue
    const value = parseUsd(sanitized[key])
    if (value === undefined) continue

    if (!Number.isFinite(value)) {
      writeBack(sanitized, key, 0)
      continue
    }

    const cap = key === 'amount_fee_usd' ? MAX_FEE_USD : MAX_SIDE_USD
    if (Math.abs(value) > cap) {
      writeBack(sanitized, key, 0)
    }
  }

  return sanitized
}

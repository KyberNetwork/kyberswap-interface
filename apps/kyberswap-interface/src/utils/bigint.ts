export const toBigIntSafe = (value: string | number | bigint): bigint => {
  if (typeof value === 'bigint') return value

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Invalid numeric value')
    return toBigIntSafe(value.toString())
  }

  const normalized = value.trim()
  if (!normalized) throw new Error('Invalid numeric value')

  try {
    return BigInt(normalized)
  } catch (error) {
    const match = normalized.match(/^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/)
    if (!match) throw error

    const [, sign, integer, fractional = '', exponentRaw = '0'] = match
    const exponent = Number(exponentRaw)
    if (!Number.isInteger(exponent)) throw error

    const digits = `${integer}${fractional}`.replace(/^0+/, '') || '0'
    const zerosToAppend = exponent - fractional.length

    if (zerosToAppend >= 0) {
      return BigInt(`${sign}${digits}${'0'.repeat(zerosToAppend)}`)
    }

    const cutoff = digits.length + zerosToAppend
    if (cutoff <= 0) {
      if (!/^0+$/.test(digits)) throw new Error('Value is not an integer')
      return 0n
    }

    const fractionalRemainder = digits.slice(cutoff)
    if (!/^0+$/.test(fractionalRemainder)) throw new Error('Fractional digits are not allowed')

    const integerDigits = digits.slice(0, cutoff) || '0'
    return BigInt(`${sign}${integerDigits}`)
  }
}

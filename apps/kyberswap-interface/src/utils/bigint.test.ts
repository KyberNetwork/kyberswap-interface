import { describe, expect, it } from 'vitest'

import { toBigIntSafe } from './bigint'

describe('toBigIntSafe', () => {
  it('returns bigint as-is', () => {
    const value = 123n
    expect(toBigIntSafe(value)).toBe(value)
  })

  it('parses plain integer strings', () => {
    expect(toBigIntSafe('42')).toBe(42n)
    expect(toBigIntSafe('-9000')).toBe(-9000n)
  })

  it('parses scientific notation with positive exponent', () => {
    expect(toBigIntSafe('5.726094079901064e+21')).toBe(5726094079901064000000n)
    expect(toBigIntSafe('1e6')).toBe(1000000n)
  })

  it('parses scientific notation with trailing zeros removed', () => {
    expect(toBigIntSafe('7.000e+3')).toBe(7000n)
  })

  it('parses large integer strings without scientific notation', () => {
    expect(toBigIntSafe('3471297019547290072000')).toBe(3471297019547290072000n)
  })

  it('handles numbers that result in zero after removing fractional digits', () => {
    expect(toBigIntSafe('0.0e+5')).toBe(0n)
  })

  it('accepts numeric inputs', () => {
    expect(toBigIntSafe(12345)).toBe(12345n)
  })

  it('throws on non-integer scientific notation', () => {
    expect(() => toBigIntSafe('1.23e-2')).toThrowError('Value is not an integer')
  })

  it('throws on fractional strings without scientific notation', () => {
    expect(() => toBigIntSafe('1.5')).toThrowError('Fractional digits are not allowed')
  })

  it('throws on invalid numeric values', () => {
    expect(() => toBigIntSafe('abc')).toThrow()
    expect(() => toBigIntSafe(Number.POSITIVE_INFINITY)).toThrow('Invalid numeric value')
  })
})

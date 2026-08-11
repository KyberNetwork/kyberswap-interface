import { describe, expect, it } from 'vitest'

import {
  compactUsd,
  formatApproximateUsd,
  formatCount,
  formatTokenAmount,
  formatUsd,
  percent,
  signedPercent,
  signedUsd,
  sumUsdValues,
} from './helpers'

describe('Copy Trading metric formatters', () => {
  it('displays N/A for missing metrics', () => {
    expect([
      compactUsd(undefined),
      formatUsd(undefined),
      signedUsd(undefined),
      formatTokenAmount(undefined),
      formatCount(undefined),
      percent(undefined),
      signedPercent(undefined),
      formatApproximateUsd(undefined),
    ]).toEqual(Array(8).fill('N/A'))
  })

  it('keeps zero as a valid metric', () => {
    expect(formatUsd('0')).not.toBe('N/A')
    expect(formatCount(0)).not.toBe('N/A')
    expect(percent('0')).not.toBe('N/A')
  })

  it('only prefixes approximate values when data is available', () => {
    expect(formatApproximateUsd('10')).toMatch(/^~\$/)
    expect(formatApproximateUsd(undefined)).toBe('N/A')
  })

  it('only calculates combined USD metrics when every value is available', () => {
    expect(sumUsdValues('10.5', '-2')).toBe('8.5')
    expect(sumUsdValues('10.5', undefined)).toBeUndefined()
  })
})

import { describe, expect, it } from 'vitest'

import {
  compactUsd,
  formatApproximateUsd,
  formatCount,
  formatTokenAmount,
  formatUsd,
  getDisplayCapitalInUsd,
  getSignedMetricClassName,
  getWinRateClassName,
  getWinRateTone,
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

  it('uses semantic colors only for signed metrics with a direction', () => {
    expect(getSignedMetricClassName('12.5')).toBe('text-primary')
    expect(getSignedMetricClassName('-0.1')).toBe('text-red')
    expect(getSignedMetricClassName('0')).toBe('text-text')
    expect(getSignedMetricClassName(undefined)).toBe('text-text')
  })

  it('colors win rates by performance range', () => {
    expect(getWinRateClassName('60')).toBe('text-primary')
    expect(getWinRateClassName('59.9')).toBe('text-warning')
    expect(getWinRateClassName('30')).toBe('text-warning')
    expect(getWinRateClassName('29.9')).toBe('text-red')
    expect(getWinRateClassName(undefined)).toBe('text-text')
    expect(getWinRateClassName('80', 'background')).toBe('bg-primary')
    expect(getWinRateClassName('20', 'background')).toBe('bg-red1')
    expect(getWinRateTone('60')).toBe('positive')
    expect(getWinRateTone('30')).toBe('warning')
    expect(getWinRateTone('20')).toBe('negative')
  })

  it('only prefixes approximate values when data is available', () => {
    expect(formatApproximateUsd('10')).toMatch(/^~\$/)
    expect(formatApproximateUsd(undefined)).toBe('N/A')
  })

  it('only calculates combined USD metrics when every value is available', () => {
    expect(sumUsdValues('10.5', '-2')).toBe('8.5')
    expect(sumUsdValues('10.5', undefined)).toBeUndefined()
  })

  it('uses observed capital only when canonical capital is unavailable', () => {
    expect(getDisplayCapitalInUsd({ capitalInUsd: '10', observedCapitalInUsd: '12' })).toBe('10')
    expect(getDisplayCapitalInUsd({ capitalInUsd: '0', observedCapitalInUsd: '12' })).toBe('0')
    expect(getDisplayCapitalInUsd({ observedCapitalInUsd: '12' })).toBe('12')
    expect(getDisplayCapitalInUsd({})).toBeUndefined()
  })
})

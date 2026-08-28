import { describe, expect, it } from 'vitest'

import {
  canAttemptPreparation,
  compactUsd,
  formatApproximateUsd,
  formatCount,
  formatTokenAmount,
  formatUsd,
  getSignedMetricClassName,
  getWinRateClassName,
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

  it('supports a shorter USD precision for compact table cells', () => {
    expect(formatUsd('0.366334', 2)).toBe('$0.36')
  })

  it('keeps a negative USD sign with its value when wrapping', () => {
    expect(formatUsd('-10')).toMatch(/^-\u2060/)
  })

  it('uses semantic colors only for signed metrics with a direction', () => {
    expect(getSignedMetricClassName('12.5')).toBe('text-primary')
    expect(getSignedMetricClassName('-0.1')).toBe('text-red')
    expect(getSignedMetricClassName('0')).toBe('text-text')
    expect(getSignedMetricClassName(undefined)).toBe('text-text')
  })

  it('uses primary for available win rates and neutral for missing values', () => {
    expect(getWinRateClassName('80')).toBe('text-primary')
    expect(getWinRateClassName('20')).toBe('text-primary')
    expect(getWinRateClassName(undefined)).toBe('text-text')
    expect(getWinRateClassName('20', 'background')).toBe('bg-primary')
    expect(getWinRateClassName(undefined, 'background')).toBe('bg-buttonGray')
  })

  it('only prefixes approximate values when data is available', () => {
    expect(formatApproximateUsd('10')).toMatch(/^~\$/)
    expect(formatApproximateUsd(undefined)).toBe('N/A')
  })

  it('only calculates combined USD metrics when every value is available', () => {
    expect(sumUsdValues('10.5', '-2')).toBe('8.5')
    expect(sumUsdValues('10.5', undefined)).toBeUndefined()
  })

  it('allows TRY_PREPARE to call the authoritative preparation flow', () => {
    expect(canAttemptPreparation({ status: 'ADVISORY_ACTION_STATUS_TRY_PREPARE' })).toBe(true)
    expect(canAttemptPreparation({ status: 'ADVISORY_ACTION_STATUS_AVAILABLE' })).toBe(true)
    expect(canAttemptPreparation({ status: 'ADVISORY_ACTION_STATUS_UNAVAILABLE' })).toBe(false)
  })
})

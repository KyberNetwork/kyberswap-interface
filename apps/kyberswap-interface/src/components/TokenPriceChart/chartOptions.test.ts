import { describe, expect, it } from 'vitest'

import { MAX_SAFE_CHART_VALUE, getSafeChartVolume } from './chartOptions'

describe('getSafeChartVolume', () => {
  it('keeps finite values supported by lightweight-charts', () => {
    expect(getSafeChartVolume(42)).toBe(42)
    expect(getSafeChartVolume(MAX_SAFE_CHART_VALUE)).toBe(MAX_SAFE_CHART_VALUE)
  })

  it('falls back to zero for unsupported or missing values', () => {
    expect(getSafeChartVolume(MAX_SAFE_CHART_VALUE + 1)).toBe(0)
    expect(getSafeChartVolume(-MAX_SAFE_CHART_VALUE - 1)).toBe(0)
    expect(getSafeChartVolume(Number.NaN)).toBe(0)
    expect(getSafeChartVolume(Number.POSITIVE_INFINITY)).toBe(0)
    expect(getSafeChartVolume()).toBe(0)
    expect(getSafeChartVolume(null)).toBe(0)
  })
})

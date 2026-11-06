import { type AutoscaleInfo, type LogicalRange } from 'lightweight-charts'
import { describe, expect, it } from 'vitest'

import {
  type DisplayCandle,
  getInitialVisibleRange,
  getRobustAutoscaleInfo,
  getTooltipPosition,
  getVisibleCandles,
} from 'components/TokenPriceChart/chartOptions'

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

const candles: DisplayCandle[] = Array.from({ length: 50 }, (_, index) => ({
  bucket: String(index),
  time: index,
  open: 100,
  close: 101,
  low: 99,
  high: 102,
  volume: 1,
}))

it('centers sparse candles and keeps the latest 40 visible in a full history', () => {
  expect(getInitialVisibleRange(1)).toEqual({ from: -19.5, to: 20 })
  expect(getInitialVisibleRange(50)).toEqual({ from: 10, to: 49.5 })
  expect(getVisibleCandles(candles, null)).toEqual(candles.slice(10))
  expect(getVisibleCandles(candles, { from: -5, to: 3.1 } as LogicalRange)).toEqual(candles.slice(0, 5))
})

it('excludes isolated extreme wicks while retaining library scaling for sparse data', () => {
  const base: AutoscaleInfo = { priceRange: { minValue: 1, maxValue: 10000 } }
  const withOutlier = [...candles.slice(0, 8), { ...candles[8], high: 10000, low: 1 }]
  const scale = getRobustAutoscaleInfo(withOutlier, base)
  expect(scale?.priceRange).not.toBeNull()
  expect(scale?.priceRange?.minValue).toBeGreaterThan(90)
  expect(scale?.priceRange?.maxValue).toBeLessThan(110)
  expect(getRobustAutoscaleInfo(withOutlier.slice(0, 7), base)).toBe(base)
  expect(getRobustAutoscaleInfo(withOutlier, null)).toBeNull()
})

it('keeps the tooltip inside the chart at either edge', () => {
  expect(getTooltipPosition({ chartHeight: 280, containerWidth: 400, pointX: 0, pointY: 0 })).toEqual({
    left: 16,
    top: 12,
  })
  expect(getTooltipPosition({ chartHeight: 280, containerWidth: 400, pointX: 399, pointY: 279 })).toEqual({
    left: 167,
    top: 58,
  })
})

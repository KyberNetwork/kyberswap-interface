import { describe, expect, it } from 'vitest'

import { getRoundedYAxisScale } from './utils'

describe('getRoundedYAxisScale', () => {
  it('rounds a positive maximum up to readable USD ticks', () => {
    expect(getRoundedYAxisScale([180, 720, 1_370])).toEqual({
      domain: [0, 1_500],
      ticks: [0, 500, 1_000, 1_500],
    })
  })

  it('includes rounded negative and positive P&L bounds', () => {
    expect(getRoundedYAxisScale([-240, 1_380])).toEqual({
      domain: [-500, 1_500],
      ticks: [-500, 0, 500, 1_000, 1_500],
    })
  })

  it('supports small percentage values without floating-point artifacts', () => {
    expect(getRoundedYAxisScale([0.004, 0.018])).toEqual({
      domain: [0, 0.02],
      ticks: [0, 0.005, 0.01, 0.015, 0.02],
    })
  })

  it('ignores missing values and returns no scale without finite data', () => {
    expect(getRoundedYAxisScale([undefined, Number.NaN])).toBeUndefined()
  })
})

import { getPriceImpactInfo } from 'services/crossChain/quote/priceImpact'
import { describe, expect, it } from 'vitest'

import { getPriceImpactAction } from 'utils/prices'

describe('price impact for the displayed quote', () => {
  it('preserves non-EVM handling for unavailable prices', () => {
    expect(getPriceImpactInfo(null, 'commonPair', false)).toMatchObject({
      unableToCalculate: false,
      isHigh: false,
      isVeryHigh: false,
      message: '',
    })
  })

  it.each([
    ['stablePair', true, 2, true, false],
    ['stablePair', true, 3, true, false],
    ['commonPair', true, 2, false, false],
    ['commonPair', true, 5, true, false],
    ['commonPair', false, 5, true, false],
    ['commonPair', false, 10, true, false],
  ] as const)('preserves %s thresholds for EVM pair=%s at %s%%', (category, evm, impact, high, veryHigh) => {
    expect(getPriceImpactInfo(impact, category, evm)).toMatchObject({ isHigh: high, isVeryHigh: veryHigh })
  })

  it('accepts a valid zero impact', () => {
    expect(getPriceImpactInfo(0, 'stablePair', true)).toMatchObject({ isHigh: false, isVeryHigh: false, message: '' })
  })

  it('preserves the unavailable-price warning on EVM routes', () => {
    expect(getPriceImpactInfo(null, 'commonPair', true)).toMatchObject({
      unableToCalculate: true,
      isVeryHigh: true,
      message: 'Unable to calculate price impact',
    })
  })
})

it.each([
  ['stablePair', true],
  ['commonPair', true],
  ['commonPair', false],
] as const)('aligns very-high warnings with the Degen gate for %s, EVM=%s', (category, evm) => {
  for (const impact of [0, 3, 5, 10, 10.01, 20]) {
    const info = getPriceImpactInfo(impact, category, evm)
    expect(info.isVeryHigh).toBe(getPriceImpactAction(false, impact) === 'enable-degen')
    expect(info.unableToCalculate).toBe(false)
  }
})

it('keeps the early stable-pair warning without requiring Degen', () => {
  expect(getPriceImpactInfo(3, 'stablePair', true)).toMatchObject({
    isHigh: true,
    isVeryHigh: false,
    message: 'The price impact is high — double check the output before proceeding.',
  })
})

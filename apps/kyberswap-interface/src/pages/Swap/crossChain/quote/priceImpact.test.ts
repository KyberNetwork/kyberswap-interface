import { describe, expect, it } from 'vitest'

import { getPriceImpactInfo } from 'pages/Swap/crossChain/quote/priceImpact'

describe('price impact for the displayed quote', () => {
  it('preserves non-EVM handling for unavailable prices', () => {
    expect(getPriceImpactInfo(null, 'commonPair', false)).toMatchObject({
      isHigh: false,
      isVeryHigh: false,
      message: '',
    })
  })

  it.each([
    ['stablePair', true, 2, true, false],
    ['stablePair', true, 3, true, true],
    ['commonPair', true, 2, false, false],
    ['commonPair', true, 5, true, true],
    ['commonPair', false, 5, true, false],
    ['commonPair', false, 10, true, true],
  ] as const)('preserves %s thresholds for EVM pair=%s at %s%%', (category, evm, impact, high, veryHigh) => {
    expect(getPriceImpactInfo(impact, category, evm)).toMatchObject({ isHigh: high, isVeryHigh: veryHigh })
  })

  it('accepts a valid zero impact', () => {
    expect(getPriceImpactInfo(0, 'stablePair', true)).toMatchObject({ isHigh: false, isVeryHigh: false, message: '' })
  })

  it('preserves the unavailable-price warning on EVM routes', () => {
    expect(getPriceImpactInfo(null, 'commonPair', true)).toMatchObject({
      isVeryHigh: true,
      message: 'Unable to calculate price impact',
    })
  })
})

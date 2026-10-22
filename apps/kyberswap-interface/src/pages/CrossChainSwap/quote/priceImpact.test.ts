import { describe, expect, it } from 'vitest'

import { getPriceImpactInfo } from 'pages/CrossChainSwap/quote/priceImpact'

describe('price impact for the displayed quote', () => {
  it('preserves non-EVM handling for unavailable prices', () => {
    expect(getPriceImpactInfo(null, 'commonPair', false)).toMatchObject({
      isHigh: false,
      isVeryHigh: false,
      message: '',
    })
  })

  it('raises and clears the warning as a reviewed quote changes', () => {
    expect(getPriceImpactInfo(0.1, 'stablePair', true)).toMatchObject({
      isHigh: false,
      isVeryHigh: false,
      message: '',
    })
    const refreshed = getPriceImpactInfo(10, 'stablePair', true)
    expect(refreshed).toMatchObject({ isHigh: true, isVeryHigh: true })
    expect(refreshed.message).not.toBe('')
    expect(getPriceImpactInfo(0.2, 'stablePair', true).message).toBe('')
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

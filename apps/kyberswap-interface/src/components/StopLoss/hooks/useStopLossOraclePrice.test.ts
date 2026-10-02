import { describe, expect, it } from 'vitest'

import { oraclePriceToNumber } from 'components/StopLoss/hooks/useStopLossOraclePrice'

// What the service actually returned for WETH/USDC on Base.
const FULL_PRECISION = '1910.54005140881556398545612944142014185027628295174124686246227000829135405475'

describe('oraclePriceToNumber', () => {
  it('reads a price carrying far more digits than a double can hold', () => {
    expect(oraclePriceToNumber(FULL_PRECISION)).toBeCloseTo(1910.54, 2)
  })

  it('handles the inverted pair, where the price is a small fraction', () => {
    expect(
      oraclePriceToNumber('0.00052341351767953090584730954391404738264091920821295605679614049325553777933625'),
    ).toBeCloseTo(0.000523413, 8)
  })

  it.each([
    ['a missing price', undefined],
    ['an empty string', ''],
    ['a non-numeric payload', 'not-a-price'],
    ['zero, which no live feed should report', '0'],
    ['a negative value', '-5'],
  ])('returns nothing for %s', (_label, input) => {
    expect(oraclePriceToNumber(input)).toBeUndefined()
  })

  it('never returns Infinity for an absurdly large exponent', () => {
    expect(oraclePriceToNumber('1e999')).toBeUndefined()
  })
})

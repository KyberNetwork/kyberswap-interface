import { getMidPrice } from 'services/tokenCatalog'
import { describe, expect, it } from 'vitest'

describe('getMidPrice', () => {
  it('returns the mid of a tight buy/sell spread', () => {
    expect(getMidPrice({ PriceBuy: 101, PriceSell: 99 })).toBe(100)
  })

  it('has no price when either side is missing', () => {
    expect(getMidPrice({ PriceBuy: 100, PriceSell: 0 })).toBeNull()
    expect(getMidPrice({ PriceBuy: 0, PriceSell: 100 })).toBeNull()
    expect(getMidPrice(undefined)).toBeNull()
  })

  it('has no price when the two sides are two times apart or more, whichever is higher', () => {
    expect(getMidPrice({ PriceBuy: 200, PriceSell: 100 })).toBeNull()
    expect(getMidPrice({ PriceBuy: 100, PriceSell: 200 })).toBeNull()
    expect(getMidPrice({ PriceBuy: 219094.58, PriceSell: 2487.49 })).toBeNull()
    expect(getMidPrice({ PriceBuy: 199, PriceSell: 100 })).toBe(149.5)
  })
})

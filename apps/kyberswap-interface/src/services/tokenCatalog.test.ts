import { MAX_PRICE_AGE_MS, getMidPrice } from 'services/tokenCatalog'
import { describe, expect, it } from 'vitest'

const NOW = 1_794_469_802_000

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

  it('has no price when either side was last priced more than a day ago', () => {
    const fresh = NOW - MAX_PRICE_AGE_MS
    const stale = NOW - MAX_PRICE_AGE_MS - 1
    expect(getMidPrice({ PriceBuy: 101, PriceSell: 99, buyAtMs: fresh, sellAtMs: fresh }, NOW)).toBe(100)
    expect(getMidPrice({ PriceBuy: 101, PriceSell: 99, buyAtMs: stale, sellAtMs: fresh }, NOW)).toBeNull()
    expect(getMidPrice({ PriceBuy: 101, PriceSell: 99, buyAtMs: fresh, sellAtMs: stale }, NOW)).toBeNull()
    // Robinhood TIBBIR on 2026-11-12: priced 15 days earlier, with no market left to trade on.
    expect(
      getMidPrice(
        { PriceBuy: 0.02251, PriceSell: 0.01702, buyAtMs: 1_793_161_583_000, sellAtMs: 1_793_161_583_000 },
        NOW,
      ),
    ).toBeNull()
  })

  it('treats a side without a timestamp as current', () => {
    expect(getMidPrice({ PriceBuy: 101, PriceSell: 99 }, NOW)).toBe(100)
    expect(getMidPrice({ PriceBuy: 101, PriceSell: 99, buyAtMs: NOW }, NOW)).toBe(100)
  })
})

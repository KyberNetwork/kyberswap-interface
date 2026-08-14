import { beforeEach, describe, expect, it } from 'vitest'

import reducer, { TokenPricesState, updatePrices } from 'state/tokenPrices'
import { NATIVE_TOKEN_PRICE_KEY, resolvePriceMap } from 'state/tokenPrices/priceMap'
import {
  markFailed,
  markFetched,
  metaKey,
  readMeta,
  readRegistry,
  register,
  resetRegistry,
  unregister,
} from 'state/tokenPrices/registry'
import { TTL_MS, diffPayload, packBodies, selectDue } from 'state/tokenPrices/sweep'
import { isAddressString } from 'utils/address'

const requireMeta = (key: string) => {
  const entry = readMeta(key)
  if (!entry) throw new Error(`no fetch bookkeeping recorded for ${key}`)
  return entry
}

const USDC = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
const WETH_BASE = '0x4200000000000000000000000000000000000006'
const BASE = 8453
const ETH = 1

describe('resolvePriceMap', () => {
  it('emits every address under both its lowercase and checksummed key', () => {
    const map = resolvePriceMap([USDC], { [USDC]: 1.0001 })

    expect(map[USDC]).toBe(1.0001)
    expect(map[isAddressString(USDC)]).toBe(1.0001)
    expect(isAddressString(USDC)).not.toBe(USDC)
  })

  it('is total and 0-filled with numbers, never null or undefined', () => {
    // A caller doing bare arithmetic on the result must never see null/undefined leak out.
    const map = resolvePriceMap([USDC, WETH_BASE], { [USDC]: null })

    expect(map[USDC]).toBe(0)
    expect(map[WETH_BASE]).toBe(0)
    Object.values(map).forEach(value => expect(typeof value).toBe('number'))
  })

  it('is a plain object, so probing a missing key yields undefined instead of throwing', () => {
    const map = resolvePriceMap([USDC], { [USDC]: 1 })
    expect(() => map['']).not.toThrow()
    expect(map['']).toBeUndefined()
  })

  it('falls back from the native sentinel to the wrapped native price, under both casings', () => {
    const map = resolvePriceMap([NATIVE_TOKEN_PRICE_KEY, WETH_BASE], { [WETH_BASE]: 2500 }, WETH_BASE)

    expect(map[NATIVE_TOKEN_PRICE_KEY]).toBe(2500)
    expect(map[isAddressString(NATIVE_TOKEN_PRICE_KEY)]).toBe(2500)
  })
})

describe('registry', () => {
  beforeEach(resetRegistry)

  it('nets a StrictMode mount -> cleanup -> mount flap to a single registration', () => {
    register(BASE, [USDC], 'once')
    unregister(BASE, [USDC], 'once')
    register(BASE, [USDC], 'once')

    expect(readRegistry().get(BASE)?.get(USDC)).toEqual({ live: 0, once: 1 })
  })

  it('keeps tiers independent so one consumer unmounting cannot drop another tier', () => {
    register(BASE, [USDC], 'live')
    register(BASE, [USDC], 'once')
    unregister(BASE, [USDC], 'once')

    expect(readRegistry().get(BASE)?.get(USDC)).toEqual({ live: 1, once: 0 })
  })

  it('keeps fetch bookkeeping after the last consumer unmounts', () => {
    register(BASE, [USDC], 'once')
    markFetched(metaKey(BASE, USDC))
    unregister(BASE, [USDC], 'once')

    expect(readRegistry().get(BASE)).toBeUndefined()
    // The slice is a cache: closing a modal must not force a refetch when it reopens.
    expect(readMeta(metaKey(BASE, USDC))?.fetchedAt).toBeGreaterThan(0)
  })

  it('backs off further on each consecutive failure', () => {
    const key = metaKey(BASE, USDC)
    markFailed(key)
    const first = requireMeta(key)
    markFailed(key)
    const second = requireMeta(key)

    expect(first.failures).toBe(1)
    expect(second.failures).toBe(2)
    expect(second.nextRetryAt).toBeGreaterThan(first.nextRetryAt)
  })
})

describe('selectDue', () => {
  beforeEach(resetRegistry)

  const now = 1_000_000

  it('fetches a cold address even while the tab is hidden', () => {
    register(BASE, [USDC], 'once')
    expect(selectDue(readRegistry(), readMeta, now, false)).toEqual({ [BASE]: [USDC] })
  })

  it('leaves a settled once-tier address alone forever', () => {
    register(BASE, [USDC], 'once')
    markFetched(metaKey(BASE, USDC))

    expect(selectDue(readRegistry(), readMeta, Date.now() + TTL_MS * 100, true)).toEqual({})
  })

  it('re-fetches a live-tier address only after the TTL, and only while visible', () => {
    register(BASE, [USDC], 'live')
    markFetched(metaKey(BASE, USDC))
    const fetchedAt = requireMeta(metaKey(BASE, USDC)).fetchedAt

    expect(selectDue(readRegistry(), readMeta, fetchedAt + TTL_MS - 1, true)).toEqual({})
    expect(selectDue(readRegistry(), readMeta, fetchedAt + TTL_MS, false)).toEqual({})
    expect(selectDue(readRegistry(), readMeta, fetchedAt + TTL_MS, true)).toEqual({ [BASE]: [USDC] })
  })

  it('keeps retrying a repeatedly failing address instead of pinning it at $0 forever', () => {
    register(BASE, [USDC], 'once')
    const key = metaKey(BASE, USDC)
    for (let i = 0; i < 10; i++) markFailed(key)

    // Before the backoff elapses it stays quiet, but it never gives up permanently.
    expect(selectDue(readRegistry(), readMeta, Date.now(), true)).toEqual({})
    expect(selectDue(readRegistry(), readMeta, Date.now() + 1_000_000, true)).toEqual({ [BASE]: [USDC] })
  })

  it('reports every subscribed chain, not just one', () => {
    register(BASE, [USDC], 'once')
    register(ETH, [WETH_BASE], 'once')

    expect(selectDue(readRegistry(), readMeta, now, true)).toEqual({ [BASE]: [USDC], [ETH]: [WETH_BASE] })
  })
})

describe('packBodies', () => {
  it('packs several chains into a single request when each is under the cap', () => {
    expect(packBodies({ [BASE]: [USDC], [ETH]: [WETH_BASE] })).toEqual([{ [BASE]: [USDC], [ETH]: [WETH_BASE] }])
  })

  it('chunks per chain rather than across a flat union, so a body never mis-associates addresses', () => {
    const many = Array.from({ length: 150 }, (_, i) => `0x${i.toString(16).padStart(40, '0')}`)
    const bodies = packBodies({ [BASE]: many, [ETH]: [WETH_BASE] })

    expect(bodies).toHaveLength(2)
    expect(bodies[0][BASE]).toHaveLength(100)
    expect(bodies[0][ETH]).toEqual([WETH_BASE])
    expect(bodies[1][BASE]).toHaveLength(50)
    // The short chain is exhausted in the first round and must not reappear empty.
    expect(bodies[1][ETH]).toBeUndefined()
  })

  it('returns nothing for an empty due set', () => {
    expect(packBodies({})).toEqual([])
    expect(packBodies({ [BASE]: [] })).toEqual([])
  })
})

describe('diffPayload', () => {
  it('drops writes that would not change the store', () => {
    const current: TokenPricesState = { [BASE]: { [USDC]: 1, [WETH_BASE]: null } }

    expect(diffPayload(current, { [BASE]: { [USDC]: 1, [WETH_BASE]: null } })).toEqual({})
    expect(diffPayload(current, { [BASE]: { [USDC]: 2 } })).toEqual({ [BASE]: { [USDC]: 2 } })
    expect(diffPayload(current, { [ETH]: { [USDC]: 1 } })).toEqual({ [ETH]: { [USDC]: 1 } })
  })
})

describe('slice', () => {
  it('keeps chains separate and returns the identical state object for a no-op write', () => {
    const withPrice = reducer(undefined, updatePrices({ [BASE]: { [USDC]: 1 } }))
    const withEth = reducer(withPrice, updatePrices({ [ETH]: { [WETH_BASE]: 2500 } }))

    expect(withEth[BASE]).toEqual({ [USDC]: 1 })
    expect(withEth[ETH]).toEqual({ [WETH_BASE]: 2500 })

    // Primitive leaves let immer short-circuit, so a sweep confirming unchanged prices re-renders
    // nobody. Boxing the value with a timestamp would break exactly this.
    const rewritten = reducer(withEth, updatePrices({ [BASE]: { [USDC]: 1 } }))
    expect(rewritten).toBe(withEth)
  })
})

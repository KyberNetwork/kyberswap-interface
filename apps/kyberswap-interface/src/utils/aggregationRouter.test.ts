import { describe, expect, it } from 'vitest'

import { AGGREGATION_ROUTER_V2, AGGREGATION_ROUTER_V3, encodeRouterPermit } from './aggregationRouter'

const owner = '0x1111111111111111111111111111111111111111' as const
const value = 123456789012345678901234567890n
const deadline = 1799999999n
const r = `0x${'ab'.repeat(32)}` as const
const s = `0x${'cd'.repeat(32)}` as const
const word = (value: bigint | number) => BigInt(value).toString(16).padStart(64, '0')
const tail = word(value) + word(deadline) + word(28) + r.slice(2) + s.slice(2)

describe('Aggregator token permit calldata', () => {
  it('preserves the seven-word V2 wire format', () => {
    const encoded = encodeRouterPermit({ owner, spender: AGGREGATION_ROUTER_V2, value, deadline, v: 28, r, s })
    expect(encoded).toBe(
      `0x${owner.slice(2).padStart(64, '0')}${AGGREGATION_ROUTER_V2.slice(2).toLowerCase().padStart(64, '0')}${tail}`,
    )
  })

  it('sends exactly five words for V3, with no owner or spender prefix', () => {
    const encoded = encodeRouterPermit({ owner, spender: AGGREGATION_ROUTER_V3, value, deadline, v: 28, r, s })
    expect(encoded).toBe(`0x${tail}`)
    expect((encoded.length - 2) / 2).toBe(160)
  })

  it('recognizes lowercase V3 addresses returned by the API', () => {
    expect(
      encodeRouterPermit({
        owner,
        spender: AGGREGATION_ROUTER_V3.toLowerCase() as `0x${string}`,
        value,
        deadline,
        v: 28,
        r,
        s,
      }),
    ).toBe(`0x${tail}`)
  })
})

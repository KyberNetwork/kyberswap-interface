import { describe, expect, it } from 'vitest'

import { permitUpdate, setRouterV3Test } from './actions'
import reducer from './reducer'

describe('Router V3 test setting', () => {
  it('clears signed permits when changing the routing client and preserves the input', () => {
    const signed = reducer(
      undefined,
      permitUpdate({
        account: 'wallet',
        chainId: 1,
        address: 'token',
        rawSignature: '0x1234',
        deadline: 9999999999,
        value: '100',
      }),
    )
    const enabled = reducer(signed, setRouterV3Test(true))
    expect(enabled.routerV3Test).toBe(true)
    expect(enabled.permitData).toEqual({})
    expect(enabled.typedValue).toBe(signed.typedValue)
    expect(reducer(enabled, setRouterV3Test(false)).routerV3Test).toBe(false)
  })
})

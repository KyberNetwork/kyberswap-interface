import { describe, expect, it } from 'vitest'

import { permitUpdate, setRouterV3Test } from './actions'
import reducer from './reducer'

describe('Router V3 test setting', () => {
  it('ignores a pending signature after switching clients, including switching back', () => {
    const pendingSignature = permitUpdate({
      account: 'wallet',
      chainId: 1,
      address: 'token',
      rawSignature: '0x1234',
      routerAddress: 'router-v2',
      permitGeneration: 0,
      deadline: 9999999999,
      value: '100',
    })
    const switched = reducer(undefined, setRouterV3Test(true))
    expect(reducer(switched, pendingSignature).permitData).toEqual({})
    const switchedBack = reducer(switched, setRouterV3Test(false))
    expect(reducer(switchedBack, pendingSignature).permitData).toEqual({})

    const freshSignature = permitUpdate({
      ...pendingSignature.payload,
      permitGeneration: switchedBack.permitGeneration,
    })
    expect(reducer(switchedBack, freshSignature).permitData?.wallet[1].token?.rawSignature).toBe('0x1234')
  })

  it('clears signed permits when changing the routing client and preserves the input', () => {
    const signed = reducer(
      undefined,
      permitUpdate({
        account: 'wallet',
        chainId: 1,
        address: 'token',
        rawSignature: '0x1234',
        routerAddress: 'router-v2',
        permitGeneration: 0,
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

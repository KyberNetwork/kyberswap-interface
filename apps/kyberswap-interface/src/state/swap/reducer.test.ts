import { describe, expect, it } from 'vitest'

import { Field, permitUpdate, replaceSwapState, setRouterV3Test, typeInput } from './actions'
import reducer from './reducer'

describe('swap input amount', () => {
  it('starts empty and stays empty when replacing state without an amount', () => {
    const initial = reducer(undefined, { type: 'init' })
    expect(initial.typedValue).toBe('')
    expect(reducer(initial, replaceSwapState({ field: Field.INPUT, recipient: null })).typedValue).toBe('')
  })

  it('preserves an existing amount when omitted and accepts an explicit empty amount', () => {
    const state = reducer(undefined, typeInput({ field: Field.INPUT, typedValue: '12.5' }))
    expect(reducer(state, replaceSwapState({ field: Field.INPUT, recipient: null })).typedValue).toBe('12.5')
    expect(reducer(state, replaceSwapState({ field: Field.INPUT, recipient: null, typedValue: '' })).typedValue).toBe(
      '',
    )
  })
})

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

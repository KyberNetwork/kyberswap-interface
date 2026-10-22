import { describe, expect, it } from 'vitest'

import { Field, replaceSwapState, typeInput, permitUpdate, setRouterV3Test } from './actions'
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

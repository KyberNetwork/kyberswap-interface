import { describe, expect, it } from 'vitest'

import { Field, replaceSwapState, typeInput } from './actions'
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

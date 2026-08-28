import { describe, expect, it } from 'vitest'

import { shouldResetCursor } from './cursorError'

describe('shouldResetCursor', () => {
  it('recognizes gRPC ABORTED payloads and rejected HTTP cursors', () => {
    expect(shouldResetCursor({ status: 500, data: { code: 10 } })).toBe(true)
    expect(shouldResetCursor({ status: 400 })).toBe(true)
  })

  it('does not reset pagination for unrelated failures', () => {
    expect(shouldResetCursor({ status: 409 })).toBe(true)
    expect(shouldResetCursor({ status: 500, data: { code: 13 } })).toBe(false)
    expect(shouldResetCursor(undefined)).toBe(false)
  })
})

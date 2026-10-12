import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { formatExpiry } from 'components/StopOrder/MyOrders/components'

const NOW = new Date('2026-08-06T12:00:00Z')
const at = (offsetSeconds: number) => Math.floor(NOW.getTime() / 1000) + offsetSeconds

const HOUR = 3600
const DAY = 24 * HOUR

describe('formatExpiry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    ['an hour out', 1 * HOUR],
    ['just under a week out', 7 * DAY - 60],
    ['a month out', 30 * DAY],
  ])('shows the date with its time split out %s', (_label, offset) => {
    const expiry = dayjs.unix(at(offset))
    expect(formatExpiry(at(offset))).toEqual({ label: expiry.format('DD/MM/YYYY'), time: expiry.format('HH:mm') })
  })

  it('reports an elapsed deadline as expired rather than a past date', () => {
    expect(formatExpiry(at(-HOUR))).toEqual({ label: 'Expired' })
    expect(formatExpiry(at(0))).toEqual({ label: 'Expired' })
  })
})

import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { formatDistanceMagnitude, formatExpiry } from 'components/StopLoss/MyOrders/components'

// The app entry extends these before any route renders; mirror that so the helper behaves the same.
dayjs.extend(duration)
dayjs.extend(relativeTime)

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
    ['in an hour', 1 * HOUR],
    ['in 3 days', 3 * DAY],
    ['a day short of the cutoff', 6 * DAY],
  ])('uses relative wording with no time line %s', (_label, offset) => {
    const result = formatExpiry(at(offset))
    expect(result.label).toMatch(/^in /)
    expect(result.time).toBeUndefined()
  })

  it.each([
    ['exactly a week out', 7 * DAY],
    ['a month out', 30 * DAY],
  ])('switches to an absolute date with its time split out %s', (_label, offset) => {
    const expiry = dayjs.unix(at(offset))
    expect(formatExpiry(at(offset))).toEqual({ label: expiry.format('DD/MM/YYYY'), time: expiry.format('HH:mm') })
  })

  it('reports an elapsed deadline as expired rather than a negative duration', () => {
    expect(formatExpiry(at(-HOUR))).toEqual({ label: 'Expired' })
    expect(formatExpiry(at(0))).toEqual({ label: 'Expired' })
  })
})

describe('formatDistanceMagnitude', () => {
  it('shows one decimal, keeping the trailing zero', () => {
    expect(formatDistanceMagnitude(-6.62)).toBe('6.6')
    expect(formatDistanceMagnitude(-10)).toBe('10.0')
    expect(formatDistanceMagnitude(-0.2858)).toBe('0.3')
    expect(formatDistanceMagnitude(0.1504)).toBe('0.2')
  })

  it('keeps the first significant digit of a distance that one decimal would round to zero', () => {
    expect(formatDistanceMagnitude(-0.023)).toBe('0.02')
    expect(formatDistanceMagnitude(-0.00344)).toBe('0.003')
    expect(formatDistanceMagnitude(-0.000092)).toBe('0.0₄9')
  })

  it('reads zero only for a trigger exactly at the market', () => {
    expect(formatDistanceMagnitude(0)).toBe('0.0')
  })
})

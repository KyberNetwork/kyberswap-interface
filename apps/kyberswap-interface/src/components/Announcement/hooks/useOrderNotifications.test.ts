import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  hasAnnouncedIds,
  loadAnnouncedIds,
  recordAsAnnounced,
  saveAnnouncedIds,
  selectUnannounced,
} from 'components/Announcement/hooks/useOrderNotifications'
import { PrivateAnnouncement } from 'components/Announcement/type'

const notification = (id: number, sentAt: number, isRead = false) => ({ id, sentAt, isRead } as PrivateAnnouncement)

describe('selectUnannounced', () => {
  it('picks every unread notification when nothing was announced, oldest first', () => {
    const picked = selectUnannounced([notification(3, 300), notification(1, 100), notification(2, 200)], new Set())

    expect(picked.map(item => item.id)).toEqual([1, 2, 3])
  })

  it('skips read and already announced notifications', () => {
    const picked = selectUnannounced(
      [notification(1, 100, true), notification(2, 200), notification(3, 300)],
      new Set([2]),
    )

    expect(picked.map(item => item.id)).toEqual([3])
  })

  it('picks a notification listed twice once', () => {
    const picked = selectUnannounced([notification(1, 100), notification(1, 100)], new Set())

    expect(picked.map(item => item.id)).toEqual([1])
  })
})

describe('announced ids storage', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads back what was saved, for the wallet in any letter case', () => {
    saveAnnouncedIds('0xAbC', new Set([5, 7]))

    expect([...loadAnnouncedIds('0xabc')].sort()).toEqual([5, 7])
    expect(loadAnnouncedIds('0xdef').size).toBe(0)
  })

  it('keeps the largest ids when over the limit', () => {
    saveAnnouncedIds('0xabc', new Set(Array.from({ length: 1005 }, (_, i) => i + 1)))

    const ids = loadAnnouncedIds('0xabc')
    expect(ids.size).toBe(1000)
    expect(ids.has(1)).toBe(false)
    expect(ids.has(1005)).toBe(true)
  })

  it('reads nothing from a corrupt entry', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    localStorage.setItem('orderAnnouncedNotifications:production:0xabc', '{oops')
    localStorage.setItem('orderAnnouncedNotifications:staging:0xabc', '{oops')

    expect(loadAnnouncedIds('0xabc').size).toBe(0)
  })

  it('records a first-seen history silently, read notifications included, so none is picked later', () => {
    const history = [notification(1, 100), notification(2, 200, true)]
    expect(hasAnnouncedIds('0xabc')).toBe(false)

    recordAsAnnounced('0xabc', history)

    expect(hasAnnouncedIds('0xabc')).toBe(true)
    expect(
      selectUnannounced([...history, notification(3, 300)], loadAnnouncedIds('0xabc')).map(item => item.id),
    ).toEqual([3])
  })

  it('marks a wallet without notifications as seen', () => {
    recordAsAnnounced('0xabc', [])

    expect(hasAnnouncedIds('0xabc')).toBe(true)
  })
})

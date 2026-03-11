import { PrivateAnnouncement } from 'components/Announcement/type'

const STORAGE_KEY = 'ks-pinned-private-announcements'

type PinMap = Record<string, PrivateAnnouncement[]>

const safeParse = (): PinMap => {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return typeof raw === 'object' && raw !== null ? raw : {}
  } catch (error) {
    console.error('parse pin storage error', error)
    return {}
  }
}

const sanitizePinnedNotification = (item: PrivateAnnouncement): PrivateAnnouncement => ({
  id: item.id,
  templateType: item.templateType,
  templateId: item.templateId,
  templateBody: item.templateBody,
  isRead: item.isRead,
  sentAt: item.sentAt,
  isPinned: true,
})

const normalizePinList = (list: any): PrivateAnnouncement[] => {
  if (!Array.isArray(list)) return []
  return list
    .map(entry => {
      if (!entry || typeof entry !== 'object') return null
      if (typeof entry.id !== 'number') return null
      return sanitizePinnedNotification(entry as PrivateAnnouncement)
    })
    .filter(Boolean) as PrivateAnnouncement[]
}

export const getPinnedNotifications = (account?: string): PrivateAnnouncement[] => {
  if (typeof localStorage === 'undefined') return []
  if (!account) return []
  const map = safeParse()
  const pins = map[account.toLowerCase()]
  return normalizePinList(pins)
}

const persist = (account: string | undefined, pins: PrivateAnnouncement[]) => {
  if (typeof localStorage === 'undefined') return
  if (!account) return
  try {
    const map = safeParse()
    map[account.toLowerCase()] = normalizePinList(pins)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch (error) {
    console.error('persist pin storage error', error)
  }
}

export const updatePinnedNotifications = (
  account: string | undefined,
  updater: (current: PrivateAnnouncement[]) => PrivateAnnouncement[],
): PrivateAnnouncement[] => {
  const current = getPinnedNotifications(account)
  const next = normalizePinList(updater(current))
  persist(account, next)
  return next
}

export const togglePinnedNotification = (
  account: string | undefined,
  notification: PrivateAnnouncement,
): PrivateAnnouncement[] =>
  updatePinnedNotifications(account, current => {
    const existing = new Map(current.map(item => [item.id, item]))
    if (existing.has(notification.id)) {
      existing.delete(notification.id)
    } else {
      existing.set(notification.id, sanitizePinnedNotification(notification))
    }
    return Array.from(existing.values())
  })

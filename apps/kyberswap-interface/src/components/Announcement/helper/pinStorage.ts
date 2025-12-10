const STORAGE_KEY = 'ks-pinned-private-announcements'

type PinMap = Record<string, number[]>

const safeParse = (): PinMap => {
  if (typeof localStorage === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch (error) {
    console.error('parse pin storage error', error)
    return {}
  }
}

export const getPinnedNotificationIds = (account?: string) => {
  if (typeof localStorage === 'undefined') return []
  if (!account) return []
  const map = safeParse()
  return map[account.toLowerCase()] ?? []
}

const persist = (account: string | undefined, ids: number[]) => {
  if (typeof localStorage === 'undefined') return
  if (!account) return
  try {
    const map = safeParse()
    map[account.toLowerCase()] = Array.from(new Set(ids))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch (error) {
    console.error('persist pin storage error', error)
  }
}

export const updatePinnedNotificationIds = (
  account: string | undefined,
  updater: (current: number[]) => number[],
): number[] => {
  const current = getPinnedNotificationIds(account)
  const next = updater(current)
  persist(account, next)
  return next
}

export const togglePinnedNotificationId = (account: string | undefined, id: number): number[] =>
  updatePinnedNotificationIds(account, current => {
    const set = new Set(current)
    if (set.has(id)) {
      set.delete(id)
    } else {
      set.add(id)
    }
    return Array.from(set)
  })

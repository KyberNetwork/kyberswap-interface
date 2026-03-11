import { PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'

export const applyPinnedToList = (list: PrivateAnnouncement[], pinnedList: PrivateAnnouncement[]) => {
  const pinnedMap = new Map(pinnedList.map(item => [item.id, item]))
  if (!pinnedMap.size) {
    return [...list]
      .map(item => ({ ...item, isPinned: false }))
      .sort((a, b) => {
        const timeDiff = (b.sentAt || 0) - (a.sentAt || 0)
        if (timeDiff) return timeDiff
        return (b.id || 0) - (a.id || 0)
      })
  }

  const merged = [...list]
  pinnedList.forEach(item => {
    if (!merged.some(current => current.id === item.id)) merged.push(item)
  })

  const normalized = merged
    .map(item => {
      const pinnedItem = pinnedMap.get(item.id)
      return pinnedItem ? { ...item, ...pinnedItem, isPinned: true } : { ...item, isPinned: false }
    })
    .sort((a, b) => {
      const pinDiff = Number(b.isPinned) - Number(a.isPinned)
      if (pinDiff) return pinDiff
      const timeDiff = (b.sentAt || 0) - (a.sentAt || 0)
      if (timeDiff) return timeDiff
      return (b.id || 0) - (a.id || 0)
    })

  return normalized
}

export const filterByType = (list: PrivateAnnouncement[], announcementType: PrivateAnnouncementType) =>
  list.filter(item => item.templateType === announcementType)

export const getListMeta = (
  fetched: PrivateAnnouncement[] | undefined,
  announcementType: PrivateAnnouncementType,
  hasTemplateFilter: boolean,
  resp?: { numberOfUnread?: number; pagination?: { totalItems?: number } },
) => {
  const notifications = filterByType(fetched ?? [], announcementType)
  const unread = hasTemplateFilter
    ? resp?.numberOfUnread ?? notifications.filter(item => !item.isRead).length
    : notifications.filter(item => !item.isRead).length
  const totalItems = hasTemplateFilter ? resp?.pagination?.totalItems ?? notifications.length : notifications.length

  return { notifications, unread, totalItems }
}

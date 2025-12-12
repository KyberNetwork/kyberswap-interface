import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useClearNotificationsMutation,
  useLazyGetNotificationsQuery,
  useReadAllNotificationsMutation,
  useReadNotificationsMutation,
} from 'services/notification'

import {
  getPinnedNotifications,
  togglePinnedNotification,
  updatePinnedNotifications,
} from 'components/Announcement/helper/pinStorage'
import { PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'
import { getAnnouncementsTemplateIds } from 'constants/env'
import { useActiveWeb3React } from 'hooks'

const responseDefault = { numberOfUnread: 0, pagination: { totalItems: 0 }, notifications: [] }

const applyPinnedToList = (list: PrivateAnnouncement[], pinnedList: PrivateAnnouncement[]) => {
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

export type PrivateAnnouncementPreview = { total: number; unread: number; first?: PrivateAnnouncement }

export const usePrivateAnnouncements = (
  announcementType: PrivateAnnouncementType = PrivateAnnouncementType.POSITION_STATUS,
) => {
  const { account } = useActiveWeb3React()
  const [page, setPage] = useState(1)
  const [announcements, setAnnouncements] = useState<PrivateAnnouncement[]>([])
  const [preview, setPreview] = useState<PrivateAnnouncementPreview>({ total: 0, unread: 0 })
  const [pinnedNotifications, setPinnedNotifications] = useState<PrivateAnnouncement[]>([])

  const templateIds = useMemo(() => getAnnouncementsTemplateIds(announcementType), [announcementType])
  const [fetchNotifications, { data: respNotification = responseDefault }] = useLazyGetNotificationsQuery()
  const [readNotifications] = useReadNotificationsMutation()
  const [readAllNotifications, { isLoading: isReadingAll }] = useReadAllNotificationsMutation()
  const [clearNotifications] = useClearNotificationsMutation()

  const loadingAnnouncement = useRef(false)

  const filterPinnedByType = useCallback(
    (list: PrivateAnnouncement[]) => list.filter(item => item.templateType === announcementType),
    [announcementType],
  )

  const syncPinnedNotifications = useCallback(
    (nextForType: PrivateAnnouncement[]) =>
      updatePinnedNotifications(account, current => {
        const others = current.filter(item => item.templateType !== announcementType)
        return [...others, ...nextForType]
      }),
    [account, announcementType],
  )

  const fetchPreview = useCallback(async () => {
    if (!account) {
      setPreview({ total: 0, unread: 0 })
      return
    }
    try {
      const { data } = await fetchNotifications({
        account,
        templateIds,
        page: 1,
        pageSize: 1,
      })
      const notifications = (data?.notifications ?? []) as PrivateAnnouncement[]
      setPreview({
        total: data?.pagination?.totalItems ?? 0,
        unread: data?.numberOfUnread ?? 0,
        first: notifications[0],
      })
    } catch (error) {
      console.error(error)
    }
  }, [account, fetchNotifications, templateIds])

  const loadPinnedIds = useCallback(() => {
    const nextPinned = filterPinnedByType(getPinnedNotifications(account))
    setPinnedNotifications(nextPinned)
    return nextPinned
  }, [account, filterPinnedByType])

  useEffect(() => {
    const nextPinned = loadPinnedIds()
    setAnnouncements(prev => applyPinnedToList(prev, nextPinned))
  }, [loadPinnedIds])

  const fetchList = useCallback(
    async (isReset = false) => {
      try {
        if (loadingAnnouncement.current || !account) return []
        loadingAnnouncement.current = true
        const nextPage = isReset ? 1 : page + 1
        const { data } = await fetchNotifications({
          account,
          templateIds,
          page: nextPage,
          pageSize: 10,
        })
        const notifications = (data?.notifications ?? []) as PrivateAnnouncement[]
        setPage(nextPage)
        const baseList = isReset ? notifications : [...announcements, ...notifications]
        const pinnedForList = isReset ? loadPinnedIds() : pinnedNotifications
        const normalized = applyPinnedToList(baseList, pinnedForList)
        setAnnouncements(normalized)
        return normalized
      } catch (error) {
        console.error(error)
      } finally {
        loadingAnnouncement.current = false
      }
      return []
    },
    [account, announcements, fetchNotifications, loadPinnedIds, page, pinnedNotifications, templateIds],
  )

  const markAsRead = useCallback(
    async (announcement: PrivateAnnouncement) => {
      if (!account || announcement.isRead) return
      setAnnouncements(prev => prev.map(item => (item.id === announcement.id ? { ...item, isRead: true } : item)))
      setPinnedNotifications(current => {
        const next = current.map(item => (item.id === announcement.id ? { ...item, isRead: true } : item))
        syncPinnedNotifications(next)
        return next
      })
      setPreview(prev => ({
        ...prev,
        unread: Math.max((prev.unread ?? respNotification.numberOfUnread ?? 0) - 1, 0),
      }))

      try {
        const filterTemplateIds = templateIds || undefined
        await readNotifications({ account, ids: [announcement.id], templateIds: filterTemplateIds }).unwrap()
      } catch (error) {
        console.error('readNotifications', error)
      }
    },
    [account, readNotifications, respNotification.numberOfUnread, syncPinnedNotifications, templateIds],
  )

  const markAllAsRead = useCallback(async () => {
    if (!account || !preview.unread) return
    try {
      const filterTemplateIds = templateIds || undefined
      await readAllNotifications({ account, templateIds: filterTemplateIds }).unwrap()
      setAnnouncements(prev => prev.map(item => ({ ...item, isRead: true })))
      setPinnedNotifications(current => {
        const next = current.map(item => ({ ...item, isRead: true }))
        syncPinnedNotifications(next)
        return next
      })
      setPreview(prev => ({ ...prev, unread: 0 }))
    } catch (error) {
      console.error('readAllNotifications', error)
    }
  }, [account, preview.unread, readAllNotifications, syncPinnedNotifications, templateIds])

  const pinAnnouncement = useCallback(
    (announcement: PrivateAnnouncement) => {
      if (!account) return
      const nextPinned = filterPinnedByType(togglePinnedNotification(account, announcement))
      setPinnedNotifications(nextPinned)
      setAnnouncements(prev => applyPinnedToList(prev, nextPinned))
    },
    [account, filterPinnedByType],
  )

  const deleteAnnouncement = useCallback(
    async (announcement: PrivateAnnouncement) => {
      if (!account) return
      const persistedPins = updatePinnedNotifications(account, current =>
        current.filter(item => item.id !== announcement.id),
      )
      const nextPinned = filterPinnedByType(persistedPins)
      setPinnedNotifications(nextPinned)
      setAnnouncements(prev =>
        applyPinnedToList(
          prev.filter(item => item.id !== announcement.id),
          nextPinned,
        ),
      )
      setPreview(prev => {
        const unreadDelta = announcement.isRead ? 0 : 1
        const currentTotal = prev.total ?? respNotification.pagination.totalItems ?? 0
        const currentUnread = prev.unread ?? respNotification.numberOfUnread ?? 0
        return {
          ...prev,
          total: Math.max(currentTotal - 1, 0),
          unread: Math.max(currentUnread - unreadDelta, 0),
        }
      })

      try {
        const filterTemplateIds = templateIds || undefined
        await clearNotifications({ account, ids: [announcement.id], templateIds: filterTemplateIds }).unwrap()
      } catch (error) {
        console.error('clearNotifications', error)
      }
    },
    [
      account,
      clearNotifications,
      filterPinnedByType,
      respNotification.numberOfUnread,
      respNotification.pagination.totalItems,
      templateIds,
    ],
  )

  const reset = useCallback(() => {
    setPage(1)
    setAnnouncements([])
    setPinnedNotifications([])
    setPreview({ total: 0, unread: 0 })
    loadingAnnouncement.current = false
  }, [])

  const total = useMemo(() => respNotification?.pagination?.totalItems ?? 0, [respNotification?.pagination?.totalItems])
  const unread = preview.unread ?? respNotification.numberOfUnread ?? 0

  return {
    announcements,
    preview,
    total,
    unread,
    isMarkAllLoading: isReadingAll,
    fetchList,
    fetchPreview,
    markAsRead,
    markAllAsRead,
    pinAnnouncement,
    deleteAnnouncement,
    reset,
  }
}

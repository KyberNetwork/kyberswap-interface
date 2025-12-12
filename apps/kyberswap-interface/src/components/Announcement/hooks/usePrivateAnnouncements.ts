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

export const usePrivateAnnouncements = () => {
  const { account } = useActiveWeb3React()
  const [page, setPage] = useState(1)
  const [announcements, setAnnouncements] = useState<PrivateAnnouncement[]>([])
  const [preview, setPreview] = useState<PrivateAnnouncementPreview>({ total: 0, unread: 0 })
  const [pinnedNotifications, setPinnedNotifications] = useState<PrivateAnnouncement[]>([])

  const earnTemplateIds = useMemo(() => getAnnouncementsTemplateIds(PrivateAnnouncementType.POSITION_STATUS), [])
  const [fetchNotifications, { data: respEarnNotification = responseDefault }] = useLazyGetNotificationsQuery()
  const [readNotifications] = useReadNotificationsMutation()
  const [readAllNotifications, { isLoading: isReadingAll }] = useReadAllNotificationsMutation()
  const [clearNotifications] = useClearNotificationsMutation()

  const loadingAnnouncement = useRef(false)

  const fetchPreview = useCallback(async () => {
    if (!account) {
      setPreview({ total: 0, unread: 0 })
      return
    }
    try {
      const { data } = await fetchNotifications({
        account,
        templateIds: earnTemplateIds,
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
  }, [account, earnTemplateIds, fetchNotifications])

  const loadPinnedIds = useCallback(() => {
    const nextPinned = getPinnedNotifications(account)
    setPinnedNotifications(nextPinned)
    setAnnouncements(prev => applyPinnedToList(prev, nextPinned))
  }, [account])

  useEffect(() => {
    loadPinnedIds()
  }, [loadPinnedIds])

  const fetchList = useCallback(
    async (isReset = false) => {
      try {
        if (loadingAnnouncement.current || !account) return []
        loadingAnnouncement.current = true
        const nextPage = isReset ? 1 : page + 1
        const { data } = await fetchNotifications({
          account,
          templateIds: earnTemplateIds,
          page: nextPage,
          pageSize: 10,
        })
        const notifications = (data?.notifications ?? []) as PrivateAnnouncement[]
        setPage(nextPage)
        const baseList = isReset ? notifications : [...announcements, ...notifications]
        const normalized = applyPinnedToList(baseList, pinnedNotifications)
        setAnnouncements(normalized)
        return normalized
      } catch (error) {
        console.error(error)
      } finally {
        loadingAnnouncement.current = false
      }
      return []
    },
    [account, announcements, earnTemplateIds, fetchNotifications, page, pinnedNotifications],
  )

  const markAsRead = useCallback(
    async (announcement: PrivateAnnouncement) => {
      if (!account || announcement.isRead) return
      setAnnouncements(prev => prev.map(item => (item.id === announcement.id ? { ...item, isRead: true } : item)))
      setPinnedNotifications(current => {
        const next = current.map(item => (item.id === announcement.id ? { ...item, isRead: true } : item))
        updatePinnedNotifications(account, () => next)
        return next
      })
      setPreview(prev => ({
        ...prev,
        unread: Math.max((prev.unread ?? respEarnNotification.numberOfUnread ?? 0) - 1, 0),
      }))

      try {
        const templateIds = earnTemplateIds || undefined
        await readNotifications({ account, ids: [announcement.id], templateIds }).unwrap()
      } catch (error) {
        console.error('readNotifications', error)
      }
    },
    [account, earnTemplateIds, readNotifications, respEarnNotification.numberOfUnread],
  )

  const markAllAsRead = useCallback(async () => {
    if (!account || !preview.unread) return
    try {
      const templateIds = earnTemplateIds || undefined
      await readAllNotifications({ account, templateIds }).unwrap()
      setAnnouncements(prev => prev.map(item => ({ ...item, isRead: true })))
      setPinnedNotifications(current => {
        const next = current.map(item => ({ ...item, isRead: true }))
        updatePinnedNotifications(account, () => next)
        return next
      })
      setPreview(prev => ({ ...prev, unread: 0 }))
    } catch (error) {
      console.error('readAllNotifications', error)
    }
  }, [account, earnTemplateIds, preview.unread, readAllNotifications])

  const pinAnnouncement = useCallback(
    (announcement: PrivateAnnouncement) => {
      if (!account) return
      const nextPinned = togglePinnedNotification(account, announcement)
      setPinnedNotifications(nextPinned)
      setAnnouncements(prev => applyPinnedToList(prev, nextPinned))
    },
    [account],
  )

  const deleteAnnouncement = useCallback(
    async (announcement: PrivateAnnouncement) => {
      if (!account) return
      const nextPinned = updatePinnedNotifications(account, current =>
        current.filter(item => item.id !== announcement.id),
      )
      setPinnedNotifications(nextPinned)
      setAnnouncements(prev =>
        applyPinnedToList(
          prev.filter(item => item.id !== announcement.id),
          nextPinned,
        ),
      )
      setPreview(prev => {
        const unreadDelta = announcement.isRead ? 0 : 1
        const currentTotal = prev.total ?? respEarnNotification.pagination.totalItems ?? 0
        const currentUnread = prev.unread ?? respEarnNotification.numberOfUnread ?? 0
        return {
          ...prev,
          total: Math.max(currentTotal - 1, 0),
          unread: Math.max(currentUnread - unreadDelta, 0),
        }
      })

      try {
        const templateIds = earnTemplateIds || undefined
        await clearNotifications({ account, ids: [announcement.id], templateIds }).unwrap()
      } catch (error) {
        console.error('clearNotifications', error)
      }
    },
    [
      account,
      clearNotifications,
      earnTemplateIds,
      respEarnNotification.numberOfUnread,
      respEarnNotification.pagination.totalItems,
    ],
  )

  const reset = useCallback(() => {
    setPage(1)
    setAnnouncements([])
    setPinnedNotifications([])
    setPreview({ total: 0, unread: 0 })
    loadingAnnouncement.current = false
  }, [])

  const total = useMemo(
    () => respEarnNotification?.pagination?.totalItems ?? 0,
    [respEarnNotification?.pagination?.totalItems],
  )
  const unread = preview.unread ?? respEarnNotification.numberOfUnread ?? 0

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

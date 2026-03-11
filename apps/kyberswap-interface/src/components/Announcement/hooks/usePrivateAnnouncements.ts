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

import { applyPinnedToList, filterByType, getListMeta } from './usePrivateAnnouncements.utils'

const responseDefault = { numberOfUnread: 0, pagination: { totalItems: 0 }, notifications: [] }

export type PrivateAnnouncementPreview = { total: number; unread: number; first?: PrivateAnnouncement }

export const usePrivateAnnouncements = (
  announcementType: PrivateAnnouncementType = PrivateAnnouncementType.POSITION_STATUS,
) => {
  const { account } = useActiveWeb3React()
  const [page, setPage] = useState(1)
  const [announcements, setAnnouncements] = useState<PrivateAnnouncement[]>([])
  const [preview, setPreview] = useState<PrivateAnnouncementPreview>({ total: 0, unread: 0 })
  const [meta, setMeta] = useState<{ totalItems: number; numberOfUnread: number }>({
    totalItems: 0,
    numberOfUnread: 0,
  })
  const [pinnedNotifications, setPinnedNotifications] = useState<PrivateAnnouncement[]>([])

  const templateIds = useMemo(() => getAnnouncementsTemplateIds(announcementType), [announcementType])
  const hasTemplateFilter = Boolean(templateIds)
  const [fetchNotifications, { data: respNotification = responseDefault }] = useLazyGetNotificationsQuery()
  const [readNotifications] = useReadNotificationsMutation()
  const [readAllNotifications, { isLoading: isReadingAll }] = useReadAllNotificationsMutation()
  const [clearNotifications] = useClearNotificationsMutation()

  const loadingAnnouncement = useRef(false)

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
      const { notifications, unread, totalItems } = getListMeta(
        (data?.notifications ?? []) as PrivateAnnouncement[],
        announcementType,
        hasTemplateFilter,
        data,
      )
      setPreview({
        total: totalItems,
        unread,
        first: notifications[0],
      })
      setMeta({ totalItems, numberOfUnread: unread })
    } catch (error) {
      console.error(error)
    }
  }, [account, announcementType, fetchNotifications, hasTemplateFilter, templateIds])

  const loadPinnedIds = useCallback(() => {
    const nextPinned = filterByType(getPinnedNotifications(account), announcementType)
    setPinnedNotifications(nextPinned)
    return nextPinned
  }, [account, announcementType])

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
        const { notifications, unread, totalItems } = getListMeta(
          (data?.notifications ?? []) as PrivateAnnouncement[],
          announcementType,
          hasTemplateFilter,
          data,
        )
        setPage(nextPage)
        const baseList = isReset ? notifications : [...announcements, ...notifications]
        const pinnedForList = isReset ? loadPinnedIds() : pinnedNotifications
        const normalized = applyPinnedToList(baseList, pinnedForList)
        setAnnouncements(normalized)
        setMeta({ totalItems, numberOfUnread: unread })
        return normalized
      } catch (error) {
        console.error(error)
      } finally {
        loadingAnnouncement.current = false
      }
      return []
    },
    [
      account,
      announcements,
      fetchNotifications,
      hasTemplateFilter,
      loadPinnedIds,
      page,
      pinnedNotifications,
      templateIds,
      announcementType,
    ],
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
        unread: Math.max((prev.unread ?? meta.numberOfUnread ?? 0) - 1, 0),
      }))
      setMeta(prev => ({ ...prev, numberOfUnread: Math.max((prev.numberOfUnread ?? 0) - 1, 0) }))

      try {
        const filterTemplateIds = templateIds || undefined
        await readNotifications({ account, ids: [announcement.id], templateIds: filterTemplateIds }).unwrap()
      } catch (error) {
        console.error('readNotifications', error)
      }
    },
    [account, meta.numberOfUnread, readNotifications, syncPinnedNotifications, templateIds],
  )

  const markAllAsRead = useCallback(async () => {
    if (!account || !(preview.unread || meta.numberOfUnread)) return
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
      setMeta(prev => ({ ...prev, numberOfUnread: 0 }))
    } catch (error) {
      console.error('readAllNotifications', error)
    }
  }, [account, meta.numberOfUnread, preview.unread, readAllNotifications, syncPinnedNotifications, templateIds])

  const pinAnnouncement = useCallback(
    (announcement: PrivateAnnouncement) => {
      if (!account) return
      const nextPinned = filterByType(togglePinnedNotification(account, announcement), announcementType)
      setPinnedNotifications(nextPinned)
      setAnnouncements(prev => applyPinnedToList(prev, nextPinned))
    },
    [account, announcementType],
  )

  const deleteAnnouncement = useCallback(
    async (announcement: PrivateAnnouncement) => {
      if (!account) return
      const persistedPins = updatePinnedNotifications(account, current =>
        current.filter(item => item.id !== announcement.id),
      )
      const nextPinned = filterByType(persistedPins, announcementType)
      setPinnedNotifications(nextPinned)
      setAnnouncements(prev =>
        applyPinnedToList(
          prev.filter(item => item.id !== announcement.id),
          nextPinned,
        ),
      )
      setPreview(prev => {
        const unreadDelta = announcement.isRead ? 0 : 1
        const currentTotal = prev.total ?? meta.totalItems ?? 0
        const currentUnread = prev.unread ?? meta.numberOfUnread ?? 0
        return {
          ...prev,
          total: Math.max(currentTotal - 1, 0),
          unread: Math.max(currentUnread - unreadDelta, 0),
        }
      })
      setMeta(prev => ({
        totalItems: Math.max((prev.totalItems ?? 0) - 1, 0),
        numberOfUnread: Math.max((prev.numberOfUnread ?? 0) - (announcement.isRead ? 0 : 1), 0),
      }))

      try {
        const filterTemplateIds = templateIds || undefined
        await clearNotifications({ account, ids: [announcement.id], templateIds: filterTemplateIds }).unwrap()
      } catch (error) {
        console.error('clearNotifications', error)
      }
    },
    [account, clearNotifications, announcementType, meta.numberOfUnread, meta.totalItems, templateIds],
  )

  const reset = useCallback(() => {
    setPage(1)
    setAnnouncements([])
    setPinnedNotifications([])
    setPreview({ total: 0, unread: 0 })
    setMeta({ totalItems: 0, numberOfUnread: 0 })
    loadingAnnouncement.current = false
  }, [])

  const total = useMemo(
    () => (hasTemplateFilter ? respNotification?.pagination?.totalItems ?? 0 : meta.totalItems),
    [hasTemplateFilter, meta.totalItems, respNotification?.pagination?.totalItems],
  )
  const unread = preview.unread ?? (hasTemplateFilter ? respNotification.numberOfUnread : meta.numberOfUnread) ?? 0

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

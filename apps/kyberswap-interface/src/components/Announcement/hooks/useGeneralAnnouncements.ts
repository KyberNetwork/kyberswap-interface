import { useCallback, useMemo, useRef, useState } from 'react'
import {
  useLazyGetAnnouncementsQuery,
  useMarkAllAnnouncementsAsReadMutation,
  useMarkAnnouncementAsReadMutation,
} from 'services/announcement'

import { Announcement } from 'components/Announcement/type'
import { useActiveWeb3React } from 'hooks'

export const useGeneralAnnouncements = () => {
  const { account } = useActiveWeb3React()
  const [page, setPage] = useState(1)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [meta, setMeta] = useState({ totalItems: 0, numberOfUnread: 0 })
  const [fetchAnnouncement] = useLazyGetAnnouncementsQuery()
  const [markAnnouncementAsRead] = useMarkAnnouncementAsReadMutation()
  const [markAllAnnouncementsAsRead, { isLoading: isReadingAll }] = useMarkAllAnnouncementsAsReadMutation()
  const loadingAnnouncement = useRef(false)

  const getMeta = useCallback(
    (data?: { pagination?: { totalItems?: number }; unreadCount?: number }) => ({
      totalItems: data?.pagination?.totalItems ?? 0,
      numberOfUnread: data?.unreadCount ?? 0,
    }),
    [],
  )

  const fetchPreview = useCallback(async () => {
    try {
      const { data } = await fetchAnnouncement({ page: 1, pageSize: 1, userId: account || undefined })
      setMeta(getMeta(data))
      setAnnouncements(prev => {
        if (prev.length) return prev
        return (data?.notifications ?? []) as Announcement[]
      })
      return data?.notifications?.[0] as Announcement | undefined
    } catch (error) {
      console.error(error)
    }
    return undefined
  }, [account, fetchAnnouncement, getMeta])

  const fetchList = useCallback(
    async (isReset = false) => {
      try {
        if (loadingAnnouncement.current) return []
        loadingAnnouncement.current = true
        const nextPage = isReset ? 1 : page + 1
        const { data } = await fetchAnnouncement({ page: nextPage, userId: account })
        const notifications = (data?.notifications ?? []) as Announcement[]
        setMeta(getMeta(data))
        setPage(nextPage)
        const merged = isReset ? notifications : [...announcements, ...notifications]
        setAnnouncements(merged)
        return merged
      } catch (error) {
        console.error(error)
      } finally {
        loadingAnnouncement.current = false
      }
      return []
    },
    [account, announcements, fetchAnnouncement, getMeta, page],
  )

  const markAsRead = useCallback(
    async (announcement: Announcement) => {
      if (!account || announcement.isRead) return
      setAnnouncements(prev => prev.map(item => (item.id === announcement.id ? { ...item, isRead: true } : item)))
      setMeta(prev => ({
        ...prev,
        numberOfUnread: Math.max((prev.numberOfUnread ?? 0) - 1, 0),
      }))
      await markAnnouncementAsRead({ userId: account, metaMessageId: announcement.id }).unwrap()
    },
    [account, markAnnouncementAsRead],
  )

  const markAllAsRead = useCallback(async () => {
    if (!account || meta.numberOfUnread === 0) return
    setAnnouncements(prev => prev.map(item => ({ ...item, isRead: true })))
    setMeta(prev => ({
      ...prev,
      numberOfUnread: 0,
    }))
    await markAllAnnouncementsAsRead({ userId: account }).unwrap()
  }, [account, markAllAnnouncementsAsRead, meta.numberOfUnread])

  const reset = useCallback(() => {
    setPage(1)
    setAnnouncements([])
    setMeta({ totalItems: 0, numberOfUnread: 0 })
    loadingAnnouncement.current = false
  }, [])

  const total = useMemo(() => meta.totalItems, [meta.totalItems])
  const unread = useMemo(() => meta.numberOfUnread, [meta.numberOfUnread])
  const preview = useMemo(
    () => ({
      total,
      unread,
      first: announcements[0] as Announcement | undefined,
    }),
    [announcements, total, unread],
  )

  return {
    announcements,
    total,
    unread,
    isMarkAllLoading: isReadingAll,
    preview,
    fetchList,
    fetchPreview,
    markAsRead,
    markAllAsRead,
    reset,
  }
}

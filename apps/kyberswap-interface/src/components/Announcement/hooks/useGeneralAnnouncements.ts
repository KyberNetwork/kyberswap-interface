import { useCallback, useMemo, useRef, useState } from 'react'
import { useLazyGetAnnouncementsQuery } from 'services/announcement'

import { Announcement } from 'components/Announcement/type'

const responseDefault = { numberOfUnread: 0, pagination: { totalItems: 0 }, notifications: [] }

export const useGeneralAnnouncements = () => {
  const [page, setPage] = useState(1)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [fetchAnnouncement, { data: respAnnouncement = responseDefault }] = useLazyGetAnnouncementsQuery()
  const loadingAnnouncement = useRef(false)

  const fetchPreview = useCallback(async () => {
    try {
      const { data } = await fetchAnnouncement({ page: 1, pageSize: 1 })
      setAnnouncements(prev => {
        if (prev.length) return prev
        return (data?.notifications ?? []) as Announcement[]
      })
      return data?.notifications?.[0] as Announcement | undefined
    } catch (error) {
      console.error(error)
    }
    return undefined
  }, [fetchAnnouncement])

  const fetchList = useCallback(
    async (isReset = false) => {
      try {
        if (loadingAnnouncement.current) return []
        loadingAnnouncement.current = true
        const nextPage = isReset ? 1 : page + 1
        const { data } = await fetchAnnouncement({ page: nextPage })
        const notifications = (data?.notifications ?? []) as Announcement[]
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
    [announcements, fetchAnnouncement, page],
  )

  const reset = useCallback(() => {
    setPage(1)
    setAnnouncements([])
  }, [])

  const total = useMemo(() => respAnnouncement?.pagination?.totalItems ?? 0, [respAnnouncement?.pagination?.totalItems])
  const preview = useMemo(
    () => ({
      total,
      first: announcements[0] as Announcement | undefined,
    }),
    [announcements, total],
  )

  return {
    announcements,
    total,
    preview,
    fetchList,
    fetchPreview,
    reset,
  }
}

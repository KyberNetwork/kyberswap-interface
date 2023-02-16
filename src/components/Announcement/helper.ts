import { useCallback } from 'react'
import { useLocalStorage } from 'react-use'

import { PopupContentAnnouncement } from 'components/Announcement/type'

export const useAckAnnouncement = () => {
  const [announcementsMap, setAnnouncementsMap] = useLocalStorage<{ [id: string]: string }>('ack-announcements', {})
  const ackAnnouncement = useCallback(
    (id: string | number) =>
      setAnnouncementsMap({
        ...announcementsMap,
        [id]: '1',
      }),
    [announcementsMap, setAnnouncementsMap],
  )
  return { announcementsAckMap: announcementsMap ?? {}, ackAnnouncement }
}

export const formatNumberOfUnread = (num: number) => (num > 10 ? '10+' : num)

export const isPopupExpired = (popupInfo: PopupContentAnnouncement, announcementsAckMap: { [id: string]: string }) => {
  const { expiredAt, startTime, metaMessageId } = popupInfo
  return announcementsAckMap[metaMessageId] || Date.now() < startTime || Date.now() > expiredAt
}

export const formatTime = (time: number) => {
  const delta = (Date.now() - time * 1000) / 1000
  const min = Math.floor(delta / 60)
  if (min < 1) return `< 1 minute ago`
  if (min < 60) return `${min} minutes ago`
  const hour = Math.floor(delta / 3600)
  if (hour < 24) return `${hour} hours ago`
  const day = Math.floor(delta / (24 * 3600))
  return `${day} days ago`
}

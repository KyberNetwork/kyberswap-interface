import { ChainId } from '@kyberswap/ks-sdk-core'

import { AnnouncementTemplatePopup, PopupContentAnnouncement, PopupItemType } from 'components/Announcement/type'
import { APP_PATHS, TIMES_IN_SECS } from 'constants/index'

const LsKey = 'ack-announcements'
export const getAnnouncementsAckMap = () => JSON.parse(localStorage[LsKey] || '{}')

export const ackAnnouncementPopup = (id: string | number) => {
  const announcementsMap = getAnnouncementsAckMap()
  const entries = Object.entries(announcementsMap).filter(
    // keep only ids that was added in the last 30 days
    ([_, value]) => typeof value === 'number' && Date.now() - value < TIMES_IN_SECS.ONE_DAY * 30 * 1000,
  )
  localStorage.setItem(
    LsKey,
    JSON.stringify({
      ...Object.fromEntries(entries),
      [id]: Date.now(),
    }),
  )
}

export const formatNumberOfUnread = (num: number | undefined) => (num ? (num > 10 ? '10+' : num + '') : null)

const NO_NOTI_PAGES = [APP_PATHS.IAM_CONSENT, APP_PATHS.IAM_LOGIN, APP_PATHS.IAM_LOGOUT, APP_PATHS.PARTNER_SWAP]

export const isPopupCanShow = (
  popupInfo: PopupItemType<PopupContentAnnouncement>,
  chainId: ChainId,
  account: string | undefined,
) => {
  if (NO_NOTI_PAGES.some(path => window.location.pathname.startsWith(path))) {
    return false
  }

  const { templateBody = {}, metaMessageId } = popupInfo.content
  const { endAt, startAt, chainIds = [] } = templateBody as AnnouncementTemplatePopup
  const isRightChain = chainIds.includes(chainId + '')
  const announcementsAckMap = getAnnouncementsAckMap()
  const isRead = announcementsAckMap[metaMessageId]

  const isOwn = popupInfo.account ? account === popupInfo.account : true

  const isExpired = Date.now() < startAt * 1000 || Date.now() > endAt * 1000
  return !isRead && !isExpired && isRightChain && isOwn
}

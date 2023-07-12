import { useCallback, useEffect, useRef, useState } from 'react'
import { useMedia, usePrevious } from 'react-use'
import {
  ANNOUNCEMENT_TAGS,
  useAckPrivateAnnouncementsByIdsMutation,
  useLazyGetAnnouncementsQuery,
  useLazyGetPrivateAnnouncementsQuery,
} from 'services/announcement'
import styled, { css } from 'styled-components'

import AnnouncementView, { Tab } from 'components/Announcement/AnnoucementView'
import DetailAnnouncementPopup from 'components/Announcement/Popups/DetailAnnouncementPopup'
import { formatNumberOfUnread, useInvalidateTagAnnouncement } from 'components/Announcement/helper'
import { Announcement, PrivateAnnouncement } from 'components/Announcement/type'
import NotificationIcon from 'components/Icons/NotificationIcon'
import MenuFlyout from 'components/MenuFlyout'
import Modal from 'components/Modal'
import { RTK_QUERY_TAGS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useInterval from 'hooks/useInterval'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { ApplicationModal } from 'state/application/actions'
import { useDetailAnnouncement, useModalOpen, useToggleNotificationCenter } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { MEDIA_WIDTHS } from 'theme'

const StyledMenuButton = styled.button<{ active?: boolean }>`
  border: none;
  margin: 0;
  padding: 0;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.subText};
  border-radius: 999px;
  position: relative;
  outline: none;
  background-color: transparent;
  border: 1px solid transparent;
  :hover {
    cursor: pointer;
  }
  ${({ active }) =>
    active &&
    css`
      color: ${({ theme }) => theme.text};
    `}
`

const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const Badge = styled.div<{ isOverflow: boolean }>`
  border-radius: 16px;
  position: absolute;
  top: -6px;
  right: ${({ isOverflow }) => (isOverflow ? -16 : -10)}px;
  background-color: ${({ theme }) => theme.primary};
  padding: 2px 4px 1px 4px;
  font-weight: 500;
  min-width: 20px;
  text-align: center;
  z-index: 1;
`

const browserCustomStyle = css`
  padding: 0;
  border-radius: 12px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    top: unset;
    bottom: 3.5rem;
  `};
`
const responseDefault = { numberOfUnread: 0, pagination: { totalItems: 0 }, notifications: [] }

export default function AnnouncementComponent() {
  const { account } = useActiveWeb3React()
  const [activeTab, setActiveTab] = useState(Tab.ANNOUNCEMENT)
  const { mixpanelHandler } = useMixpanel()
  const scrollRef = useRef<HTMLDivElement>(null)

  const isOpenNotificationCenter = useModalOpen(ApplicationModal.NOTIFICATION_CENTER)
  const toggleNotificationCenter = useToggleNotificationCenter()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const [curPage, setPage] = useState(1)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [privateAnnouncements, setPrivateAnnouncements] = useState<PrivateAnnouncement[]>([])

  const [fetchGeneralAnnouncement, { data: respAnnouncement = responseDefault }] = useLazyGetAnnouncementsQuery()
  const [fetchPrivateAnnouncement, { data: respPrivateAnnouncement = responseDefault, isError }] =
    useLazyGetPrivateAnnouncementsQuery()

  const isMyInboxTab = activeTab === Tab.INBOX
  const loadingAnnouncement = useRef(false)

  const fetchAnnouncementsByTab = useCallback(
    async (isReset = false, tab: Tab = activeTab) => {
      try {
        if (loadingAnnouncement.current) return
        const isMyInboxTab = tab === Tab.INBOX
        loadingAnnouncement.current = true
        const page = isReset ? 1 : curPage + 1
        const promise = isMyInboxTab ? fetchPrivateAnnouncement({ page }) : fetchGeneralAnnouncement({ page })

        if (!promise) return
        const { data } = await promise
        const notifications = data?.notifications ?? []
        setPage(page)
        let newData
        if (isMyInboxTab) {
          newData = isReset ? notifications : [...privateAnnouncements, ...notifications]
          setPrivateAnnouncements(newData as PrivateAnnouncement[])
        } else {
          newData = isReset ? notifications : [...announcements, ...notifications]
          setAnnouncements(newData as Announcement[])
        }
        return newData
      } catch (error) {
        console.error(error)
      } finally {
        loadingAnnouncement.current = false
      }
      return
    },
    [announcements, privateAnnouncements, curPage, activeTab, fetchGeneralAnnouncement, fetchPrivateAnnouncement],
  )

  const {
    pagination: { totalItems: totalAnnouncement },
  } = respAnnouncement

  const {
    numberOfUnread,
    pagination: { totalItems: totalPrivateAnnouncement },
  } = isError ? responseDefault : respPrivateAnnouncement
  const refreshAnnouncement = () => {
    fetchAnnouncementsByTab(true)
  }

  const loadMoreAnnouncements = useCallback(() => {
    fetchAnnouncementsByTab()
  }, [fetchAnnouncementsByTab])

  const trackingClickTab = useCallback(
    (tab: Tab, mode: 'manual' | 'auto') => {
      if (tab === Tab.INBOX)
        mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_TAB_INBOX, {
          mode,
          total_unread_message_count: numberOfUnread,
          total_message_count: totalPrivateAnnouncement,
        })
      else {
        mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_TAB_ANNOUNCEMENT, {
          mode,
          total_message_count: totalAnnouncement,
        })
      }
    },
    [mixpanelHandler, numberOfUnread, totalAnnouncement, totalPrivateAnnouncement],
  )
  const trackingClickTabRef = useRef(trackingClickTab)
  trackingClickTabRef.current = trackingClickTab

  const onSetTab = (tab: Tab) => {
    setActiveTab(tab)
    setPage(1)
    trackingClickTab(tab, 'manual')
    tab !== activeTab && fetchAnnouncementsByTab(true, tab)
  }

  const invalidateTag = useInvalidateTagAnnouncement()
  const { userInfo } = useSessionInfo()

  const prefetchPrivateAnnouncements = useCallback(async () => {
    try {
      if (!userInfo?.identityId) return []
      const { data } = await fetchPrivateAnnouncement({ page: 1 })
      const notifications = (data?.notifications ?? []) as PrivateAnnouncement[]
      const hasNewMsg = data?.numberOfUnread !== numberOfUnread
      if (hasNewMsg) {
        invalidateTag(RTK_QUERY_TAGS.GET_PRIVATE_ANN_BY_ID)
        invalidateTag(RTK_QUERY_TAGS.GET_TOTAL_UNREAD_PRIVATE_ANN)
        if (scrollRef.current) scrollRef.current.scrollTop = 0
      }
      setPrivateAnnouncements(prevData => (hasNewMsg || !prevData.length ? notifications : prevData))
      return notifications
    } catch (error) {
      setPrivateAnnouncements([])
      return []
    }
  }, [fetchPrivateAnnouncement, invalidateTag, numberOfUnread, userInfo?.identityId])

  const prevOpen = usePrevious(isOpenNotificationCenter)
  useEffect(() => {
    const justClosedPopup = prevOpen !== isOpenNotificationCenter && !isOpenNotificationCenter
    if (justClosedPopup) return

    // prefetch data
    prefetchPrivateAnnouncements().then((data: PrivateAnnouncement[]) => {
      const newTab = account && data.length ? Tab.INBOX : Tab.ANNOUNCEMENT
      setActiveTab(newTab)
      if (prevOpen !== isOpenNotificationCenter && isOpenNotificationCenter) {
        trackingClickTabRef.current(newTab, 'auto')
      }
      if (isOpenNotificationCenter && newTab === Tab.ANNOUNCEMENT)
        fetchGeneralAnnouncement({ page: 1 })
          .then(({ data }) => {
            setAnnouncements((data?.notifications ?? []) as Announcement[])
          })
          .catch(() => {
            setAnnouncements([])
          })
    })
  }, [account, prefetchPrivateAnnouncements, fetchGeneralAnnouncement, prevOpen, isOpenNotificationCenter])

  useEffect(() => {
    if (userInfo?.identityId) {
      invalidateTag(ANNOUNCEMENT_TAGS)
    }
  }, [userInfo?.identityId, invalidateTag])

  useInterval(prefetchPrivateAnnouncements, 10_000)

  const [readAllAnnouncement] = useAckPrivateAnnouncementsByIdsMutation()
  const togglePopupWithAckAllMessage = () => {
    toggleNotificationCenter()
    if (isOpenNotificationCenter && numberOfUnread) {
      readAllAnnouncement({})
    }
  }

  const [, setAnnouncementDetail] = useDetailAnnouncement()
  const showDetailAnnouncement = (selectedIndex: number) => {
    setAnnouncementDetail({
      announcements: announcements.map(e => e.templateBody),
      selectedIndex,
      hasMore: totalAnnouncement > announcements.length,
    })
  }

  const fetchMoreAnnouncement = async () => {
    const announcements = (await fetchAnnouncementsByTab(false, Tab.ANNOUNCEMENT)) as Announcement[]
    return announcements
      ? {
          announcements: announcements.map(e => e.templateBody),
          hasMore: totalAnnouncement > announcements.length,
        }
      : undefined
  }

  const props = {
    numberOfUnread,
    announcements: isMyInboxTab ? privateAnnouncements : announcements,
    totalAnnouncement: isMyInboxTab ? totalPrivateAnnouncement : totalAnnouncement,
    refreshAnnouncement,
    loadMoreAnnouncements,
    toggleNotificationCenter: togglePopupWithAckAllMessage,
    isMyInboxTab,
    onSetTab,
    showDetailAnnouncement,
    scrollRef,
  }

  const badgeText = numberOfUnread > 0 ? formatNumberOfUnread(numberOfUnread) : null
  const bellIcon = (
    <StyledMenuButton
      active={isOpenNotificationCenter || numberOfUnread > 0}
      onClick={() => {
        togglePopupWithAckAllMessage()
        if (!isOpenNotificationCenter) mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_BELL_ICON_OPEN_POPUP)
      }}
    >
      <NotificationIcon />
      {badgeText && <Badge isOverflow={badgeText.length >= 3}>{badgeText}</Badge>}
    </StyledMenuButton>
  )
  return (
    <StyledMenu>
      {isMobile ? (
        <>
          {bellIcon}
          <Modal isOpen={isOpenNotificationCenter} onDismiss={togglePopupWithAckAllMessage} minHeight={80}>
            <AnnouncementView {...props} />
          </Modal>
        </>
      ) : (
        <MenuFlyout
          trigger={bellIcon}
          customStyle={browserCustomStyle}
          isOpen={isOpenNotificationCenter}
          toggle={togglePopupWithAckAllMessage}
        >
          <AnnouncementView {...props} />
        </MenuFlyout>
      )}
      <DetailAnnouncementPopup fetchMore={fetchMoreAnnouncement} />
    </StyledMenu>
  )
}

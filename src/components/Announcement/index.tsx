import { useCallback, useEffect, useRef, useState } from 'react'
import { useMedia } from 'react-use'
import AnnouncementApi from 'services/announcement'
import styled, { css } from 'styled-components'

import AnnouncementView, { Tab } from 'components/Announcement/AnnoucementView'
import { formatNumberOfUnread } from 'components/Announcement/helper'
import { Announcement, PrivateAnnouncement } from 'components/Announcement/type'
import NotificationIcon from 'components/Icons/NotificationIcon'
import MenuFlyout from 'components/MenuFlyout'
import Modal from 'components/Modal'
import { useActiveWeb3React } from 'hooks'
import usePrevious from 'hooks/usePrevious'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleNotificationCenter } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { subscribePrivateAnnouncement } from 'utils/firebase'

const StyledMenuButton = styled.button<{ active?: boolean }>`
  border: none;
  margin: 0;
  padding: 0;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.text};
  border-radius: 999px;
  position: relative;
  outline: none;
  background-color: transparent;
  :hover {
    cursor: pointer;
  }

  ${({ active }) =>
    active
      ? css`
          background-color: ${({ theme }) => theme.buttonBlack};
        `
      : ''}
`

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const Badge = styled.div`
  border-radius: 16px;
  position: absolute;
  top: -6px;
  right: -16px;
  background-color: ${({ theme }) => theme.primary};
  padding: 2px 4px 1px 4px;
  font-weight: 500;
  min-width: 20px;
  text-align: center;
  z-index: 1;
`

const browserCustomStyle = css`
  padding: 0;
`
const responseDefault = { numberOfUnread: 0, pagination: { totalItems: 0 }, notifications: [] }

export default function AnnouncementComponent() {
  const { account } = useActiveWeb3React()
  const node = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState(Tab.ANNOUNCEMENT)

  const isOpenNotificationCenter = useModalOpen(ApplicationModal.NOTIFICATION_CENTER)
  const toggleNotificationCenter = useToggleNotificationCenter()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const [curPage, setPage] = useState(1)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [privateAnnouncements, setPrivateAnnouncements] = useState<PrivateAnnouncement[]>([])

  const { useLazyGetAnnouncementsQuery, useLazyGetPrivateAnnouncementsQuery } = AnnouncementApi
  const [fetchGeneralAnnouncement, { data: respAnnouncement = responseDefault }] = useLazyGetAnnouncementsQuery()
  const [fetchPrivateAnnouncement, { data: respPrivateAnnouncement = responseDefault, isError }] =
    useLazyGetPrivateAnnouncementsQuery()

  const isMyInboxTab = activeTab === Tab.INBOX
  const loadingAnnouncement = useRef(false)

  const fetchAnnouncementsByTab = useCallback(
    async (isReset = false, tab: Tab = activeTab) => {
      if (loadingAnnouncement.current) return
      try {
        const isMyInboxTab = tab === Tab.INBOX
        loadingAnnouncement.current = true
        const page = isReset ? 1 : curPage + 1
        const promise = isMyInboxTab
          ? account
            ? fetchPrivateAnnouncement({ page, account })
            : null
          : fetchGeneralAnnouncement({ page })

        if (!promise) return
        const { data } = await promise
        const notifications = data?.notifications ?? []
        if (isMyInboxTab) {
          const newData = isReset ? notifications : [...privateAnnouncements, ...notifications]
          setPrivateAnnouncements(newData as PrivateAnnouncement[])
        } else {
          const newData = isReset ? notifications : [...announcements, ...notifications]
          setAnnouncements(newData as Announcement[])
        }
        setPage(page)
      } catch (error) {
        console.error(error)
      } finally {
        loadingAnnouncement.current = false
      }
    },
    [
      account,
      announcements,
      privateAnnouncements,
      curPage,
      activeTab,
      fetchGeneralAnnouncement,
      fetchPrivateAnnouncement,
    ],
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

  const onSetTab = (tab: Tab) => {
    setActiveTab(tab)
    setPage(1)
    tab !== activeTab && fetchAnnouncementsByTab(true, tab)
  }

  const prefetchPrivateAnnouncements = useCallback(() => {
    if (account)
      fetchPrivateAnnouncement({ account, page: 1 })
        .then(({ data }) => {
          setPrivateAnnouncements((data?.notifications ?? []) as PrivateAnnouncement[])
        })
        .catch(() => {
          setPrivateAnnouncements([])
        })
  }, [account, fetchPrivateAnnouncement])

  const prevOpen = usePrevious(isOpenNotificationCenter)
  useEffect(() => {
    if (prevOpen !== isOpenNotificationCenter && !isOpenNotificationCenter) {
      // close popup
      return
    }
    const newTab = account ? Tab.INBOX : Tab.ANNOUNCEMENT
    setActiveTab(newTab)

    // prefetch data
    prefetchPrivateAnnouncements()

    if (isOpenNotificationCenter && newTab === Tab.ANNOUNCEMENT)
      fetchGeneralAnnouncement({ page: 1 })
        .then(({ data }) => {
          setAnnouncements((data?.notifications ?? []) as Announcement[])
        })
        .catch(() => {
          setAnnouncements([])
        })
  }, [account, prefetchPrivateAnnouncements, fetchGeneralAnnouncement, prevOpen, isOpenNotificationCenter])

  useEffect(() => {
    const unsubscribePrivate = subscribePrivateAnnouncement(account, prefetchPrivateAnnouncements)
    return () => unsubscribePrivate?.()
  }, [account, prefetchPrivateAnnouncements])

  const togglePopupWithAckAllMessage = () => {
    toggleNotificationCenter()
    if (isOpenNotificationCenter && numberOfUnread) {
      // todo call api ack all
      console.log('calll')
    }
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
  }

  return (
    <StyledMenu ref={node}>
      <StyledMenuButton
        active={isOpenNotificationCenter || numberOfUnread > 0}
        onClick={togglePopupWithAckAllMessage}
        aria-label="Notifications"
      >
        <NotificationIcon />
        {numberOfUnread > 0 && <Badge>{formatNumberOfUnread(numberOfUnread)}</Badge>}
      </StyledMenuButton>

      {isMobile ? (
        <Modal isOpen={isOpenNotificationCenter} onDismiss={togglePopupWithAckAllMessage} minHeight={80}>
          <AnnouncementView {...props} />
        </Modal>
      ) : (
        <MenuFlyout
          browserCustomStyle={browserCustomStyle}
          node={node}
          isOpen={isOpenNotificationCenter}
          toggle={togglePopupWithAckAllMessage}
        >
          <AnnouncementView {...props} />
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}

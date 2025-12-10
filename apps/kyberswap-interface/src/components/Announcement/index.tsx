import { Trans } from '@lingui/macro'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft } from 'react-feather'
import { useMedia } from 'react-use'
import { useLazyGetAnnouncementsQuery } from 'services/announcement'
import {
  useLazyGetNotificationsQuery,
  useReadAllNotificationsMutation,
  useReadNotificationsMutation,
} from 'services/notification'
import styled, { css } from 'styled-components'

import { ReactComponent as AnnouncementSvg } from 'assets/svg/ic_announcement.svg'
import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import AnnouncementView, { Category, Tab } from 'components/Announcement/AnnoucementView'
import CategoryItem from 'components/Announcement/CategoryItem'
import DetailAnnouncementPopup from 'components/Announcement/Popups/DetailAnnouncementPopup'
import { formatNumberOfUnread } from 'components/Announcement/helper'
import {
  Announcement,
  AnnouncementTemplatePopup,
  PoolPositionAnnouncement,
  PrivateAnnouncement,
  PrivateAnnouncementType,
} from 'components/Announcement/type'
import NotificationIcon from 'components/Icons/NotificationIcon'
import MenuFlyout from 'components/MenuFlyout'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { getAnnouncementsTemplateIds } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useDetailAnnouncement, useModalOpen, useToggleNotificationCenter } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/types'
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

const Wrapper = styled.div`
  width: 380px;
  display: flex;
  flex-direction: column;
  height: 600px;
  max-height: 80vh;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    min-width: 380px;
  `};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    min-width: 0px;
    height: unset;
  `};
`

const Container = styled.div`
  gap: 12px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
`

const Title = styled.div`
  font-size: 20px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
`

const ContentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 16px;
  min-height: 48px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.background};
  :hover {
    background-color: ${({ theme }) => theme.buttonBlack};
  }
`

const BackButton = styled.button`
  display: inline-flex;
  color: ${({ theme }) => theme.subText};
  background: transparent;
  border: none;
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => theme.text};
  }
`

const HeaderTitle = styled.div`
  flex: 1;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  text-transform: uppercase;
`

const HeaderAction = styled.button`
  display: inline-flex;
  gap: 4px;
  color: ${({ theme }) => theme.primary};
  background: transparent;
  border: none;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const responseDefault = { numberOfUnread: 0, pagination: { totalItems: 0 }, notifications: [] }

export default function AnnouncementComponent() {
  const [activeTab, setActiveTab] = useState(Tab.CATEGORY)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [earnPreview, setEarnPreview] = useState<{ total: number; unread: number; first?: PrivateAnnouncement }>({
    total: 0,
    unread: 0,
  })
  const [announcementPreview, setAnnouncementPreview] = useState<{ total: number; first?: Announcement }>({ total: 0 })
  const { mixpanelHandler } = useMixpanel()
  const { account } = useActiveWeb3React()
  const prevAccountRef = useRef<string | null | undefined>(account)

  const isOpenInbox = useModalOpen(ApplicationModal.NOTIFICATION_CENTER)
  const toggleNotificationCenter = useToggleNotificationCenter()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const [curPage, setPage] = useState(1)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [earnAnnouncements, setEarnAnnouncements] = useState<PrivateAnnouncement[]>([])

  const earnTemplateIds = getAnnouncementsTemplateIds(PrivateAnnouncementType.EARN_POSITION)
  const [fetchGeneralAnnouncement, { data: respAnnouncement = responseDefault }] = useLazyGetAnnouncementsQuery()
  const [fetchEarnNotifications, { data: respEarnNotification = responseDefault }] = useLazyGetNotificationsQuery()
  const [readNotifications] = useReadNotificationsMutation()
  const [readAllNotifications, { isLoading: isReadingAll }] = useReadAllNotificationsMutation()

  const isCategoryTab = activeTab === Tab.CATEGORY
  const loadingAnnouncement = useRef(false)

  const getEarnPosition = (announcement?: PrivateAnnouncement): PoolPositionAnnouncement | undefined => {
    const body = announcement?.templateBody as unknown
    if (body && typeof body === 'object' && 'position' in (body as { position?: PoolPositionAnnouncement })) {
      return (body as { position?: PoolPositionAnnouncement }).position
    }
    return undefined
  }

  const fetchAnnouncementsByTab = useCallback(
    async (isReset = false, tab: Tab = activeTab, category: Category | null = selectedCategory) => {
      try {
        if (loadingAnnouncement.current) return
        loadingAnnouncement.current = true
        const page = isReset ? 1 : curPage + 1
        if (tab === Tab.CATEGORY || !category) return

        if (category === Category.EARN_POSITION) {
          if (!account) return []
          const { data } = await fetchEarnNotifications({
            account,
            templateIds: earnTemplateIds,
            page,
            pageSize: 10,
          })
          const notifications = (data?.notifications ?? []) as PrivateAnnouncement[]
          setPage(page)
          const newData = isReset ? notifications : [...earnAnnouncements, ...notifications]
          setEarnAnnouncements(newData)
          return newData
        }

        const { data } = (await fetchGeneralAnnouncement({ page })) ?? {}
        const notifications = (data?.notifications ?? []) as Announcement[]
        setPage(page)
        const newData = isReset ? notifications : [...announcements, ...notifications]
        setAnnouncements(newData)
        return newData
      } catch (error) {
        console.error(error)
      } finally {
        loadingAnnouncement.current = false
      }
      return
    },
    [
      account,
      activeTab,
      announcements,
      earnAnnouncements,
      curPage,
      fetchEarnNotifications,
      fetchGeneralAnnouncement,
      earnTemplateIds,
      selectedCategory,
    ],
  )

  const fetchPreview = useCallback(async () => {
    try {
      if (account) {
        const { data } = await fetchEarnNotifications({
          account,
          templateIds: earnTemplateIds,
          page: 1,
          pageSize: 1,
        })
        const notifications = (data?.notifications ?? []) as PrivateAnnouncement[]
        setEarnPreview({
          total: data?.pagination?.totalItems ?? 0,
          unread: data?.numberOfUnread ?? 0,
          first: notifications[0],
        })
      } else {
        setEarnPreview({ total: 0, unread: 0 })
      }

      const { data } = await fetchGeneralAnnouncement({ page: 1, pageSize: 1 })
      setAnnouncementPreview({
        total: data?.pagination?.totalItems ?? 0,
        first: (data?.notifications ?? [])[0] as Announcement | undefined,
      })
    } catch (error) {
      console.error(error)
    }
  }, [account, earnTemplateIds, fetchEarnNotifications, fetchGeneralAnnouncement])

  useEffect(() => {
    fetchPreview()
  }, [fetchPreview])

  useEffect(() => {
    if (prevAccountRef.current === account) return
    prevAccountRef.current = account
    setPage(1)
    setAnnouncements([])
    setEarnAnnouncements([])
    if (activeTab === Tab.NOTIFICATIONS && selectedCategory) {
      fetchAnnouncementsByTab(true, Tab.NOTIFICATIONS, selectedCategory)
    }
  }, [account, activeTab, fetchAnnouncementsByTab, selectedCategory])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPreview()
      if (isOpenInbox && activeTab === Tab.NOTIFICATIONS && selectedCategory) {
        fetchAnnouncementsByTab(true, Tab.NOTIFICATIONS, selectedCategory)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [activeTab, fetchAnnouncementsByTab, fetchPreview, isOpenInbox, selectedCategory])

  const onPrivateAnnouncementRead = useCallback(
    async (announcement: PrivateAnnouncement, _statusMessage: string) => {
      if (!account || announcement.isRead) return

      setEarnAnnouncements(prev => prev.map(item => (item.id === announcement.id ? { ...item, isRead: true } : item)))
      setEarnPreview(prev => {
        const currentUnread = typeof prev.unread === 'number' ? prev.unread : respEarnNotification.numberOfUnread ?? 0
        return {
          ...prev,
          unread: Math.max(currentUnread - 1, 0),
        }
      })

      try {
        const templateIds = earnTemplateIds || undefined
        await readNotifications({ account, ids: [announcement.id], templateIds }).unwrap()
      } catch (error) {
        console.error('readNotifications', error)
      }
    },
    [account, earnTemplateIds, readNotifications, respEarnNotification.numberOfUnread],
  )

  const {
    pagination: { totalItems: totalAnnouncement },
  } = respAnnouncement

  const loadMoreAnnouncements = useCallback(() => {
    fetchAnnouncementsByTab(false, activeTab, selectedCategory)
  }, [activeTab, fetchAnnouncementsByTab, selectedCategory])

  const onSetTab = (tab: Tab) => {
    setActiveTab(tab)
    setPage(1)
    if (tab === Tab.CATEGORY) {
      setSelectedCategory(null)
    } else {
      const nextCategory = selectedCategory ?? Category.ANNOUNCEMENTS
      setSelectedCategory(nextCategory)
      fetchAnnouncementsByTab(true, tab, nextCategory)
    }
  }

  const onSelectCategory = (category: Category) => {
    setSelectedCategory(category)
    setActiveTab(Tab.NOTIFICATIONS)
    setPage(1)
    fetchAnnouncementsByTab(true, Tab.NOTIFICATIONS, category)
  }

  const togglePopupWithAckAllMessage = () => {
    toggleNotificationCenter()
  }

  const earnTotal = respEarnNotification?.pagination?.totalItems ?? 0

  const currentAnnouncements = selectedCategory === Category.EARN_POSITION ? earnAnnouncements : announcements

  const currentTotal = selectedCategory === Category.EARN_POSITION ? earnTotal : totalAnnouncement

  const numberOfUnread = earnPreview.unread ?? respEarnNotification.numberOfUnread ?? 0

  const onMarkAllAsRead = async () => {
    if (!account || selectedCategory !== Category.EARN_POSITION || numberOfUnread === 0) return
    try {
      const templateIds = earnTemplateIds || undefined
      await readAllNotifications({ account, templateIds }).unwrap()
      setEarnAnnouncements(prev => prev.map(item => ({ ...item, isRead: true })))
      setEarnPreview(prev => ({ ...prev, unread: 0 }))
    } catch (error) {
      console.error('readAllNotifications', error)
    }
  }

  const totalForView =
    selectedCategory === Category.EARN_POSITION
      ? currentTotal || earnPreview.total
      : selectedCategory === Category.ANNOUNCEMENTS
      ? currentTotal || announcementPreview.total
      : announcementPreview.total || currentTotal
  const announcementCount = announcementPreview.total || totalForView
  const previewPosition = getEarnPosition(earnPreview.first)

  const [, setAnnouncementDetail] = useDetailAnnouncement()
  const showDetailAnnouncement = (selectedIndex: number) => {
    setAnnouncementDetail({
      announcements: currentAnnouncements.map(e => e.templateBody as AnnouncementTemplatePopup),
      selectedIndex,
      hasMore: currentTotal > currentAnnouncements.length,
    })
  }

  const fetchMoreAnnouncement = async () => {
    if (selectedCategory !== Category.ANNOUNCEMENTS) return undefined
    const announcements = (await fetchAnnouncementsByTab(false, Tab.NOTIFICATIONS, selectedCategory)) as Announcement[]
    return announcements
      ? {
          announcements: announcements.map(e => e.templateBody),
          hasMore: currentTotal > announcements.length,
        }
      : undefined
  }

  const badgeText = numberOfUnread > 0 ? formatNumberOfUnread(numberOfUnread) : null

  const bellIcon = (
    <StyledMenuButton
      active={isOpenInbox || numberOfUnread > 0}
      onClick={() => {
        togglePopupWithAckAllMessage()
        if (!isOpenInbox) mixpanelHandler(MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_BELL_ICON_OPEN_POPUP)
      }}
    >
      <NotificationIcon />
      {badgeText && <Badge isOverflow={badgeText.length >= 3}>{badgeText}</Badge>}
    </StyledMenuButton>
  )

  const content = (
    <Wrapper>
      <Container>
        <RowBetween alignItems="center" gap="10px">
          <Title>
            <NotificationIcon size={18} />
            <Trans>Notifications</Trans>
          </Title>
        </RowBetween>
      </Container>

      {!isCategoryTab && (
        <ContentHeader>
          <BackButton onClick={() => onSetTab(Tab.CATEGORY)}>
            <ChevronLeft size={16} />
          </BackButton>
          <HeaderTitle>
            {selectedCategory === Category.EARN_POSITION ? <Trans>Earn Position</Trans> : <Trans>Announcements</Trans>}
          </HeaderTitle>
          {selectedCategory !== Category.ANNOUNCEMENTS && (
            <HeaderAction onClick={onMarkAllAsRead} disabled={!account || isReadingAll || numberOfUnread === 0}>
              <Check size={16} />
              <Trans>Mark all read</Trans>
            </HeaderAction>
          )}
        </ContentHeader>
      )}

      {isCategoryTab ? (
        <div>
          <CategoryItem
            title="Earn Position"
            counter={numberOfUnread}
            subLine1={previewPosition ? `${previewPosition.token0Symbol}/${previewPosition.token1Symbol}` : undefined}
            subLine2={previewPosition?.positionId ? `#${previewPosition.positionId}` : undefined}
            icon={<FarmingIcon />}
            onClick={() => onSelectCategory(Category.EARN_POSITION)}
          />
          <CategoryItem
            title="Announcements"
            counter={announcementCount}
            subLine1={announcementPreview.first?.templateBody?.name}
            icon={<AnnouncementSvg />}
            onClick={() => onSelectCategory(Category.ANNOUNCEMENTS)}
          />
        </div>
      ) : (
        <AnnouncementView
          announcements={currentAnnouncements}
          totalAnnouncement={totalForView}
          loadMoreAnnouncements={loadMoreAnnouncements}
          toggleNotificationCenter={togglePopupWithAckAllMessage}
          showDetailAnnouncement={showDetailAnnouncement}
          selectedCategory={selectedCategory}
          onPrivateAnnouncementRead={onPrivateAnnouncementRead}
        />
      )}
    </Wrapper>
  )

  return (
    <StyledMenu>
      {isMobile ? (
        <>
          {bellIcon}
          <Modal isOpen={isOpenInbox} onDismiss={togglePopupWithAckAllMessage} minHeight={80}>
            {content}
          </Modal>
        </>
      ) : (
        <MenuFlyout
          trigger={bellIcon}
          customStyle={browserCustomStyle}
          isOpen={isOpenInbox}
          toggle={togglePopupWithAckAllMessage}
        >
          {content}
        </MenuFlyout>
      )}
      <DetailAnnouncementPopup fetchMore={fetchMoreAnnouncement} />
    </StyledMenu>
  )
}

import { Trans } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronLeft } from 'react-feather'
import { useMedia } from 'react-use'

import { ReactComponent as AnnouncementSvg } from 'assets/svg/ic_announcement.svg'
import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import AnnouncementView, { Category, Tab } from 'components/Announcement/AnnoucementView'
import CategoryItem from 'components/Announcement/CategoryItem'
import DetailAnnouncementPopup from 'components/Announcement/Popups/DetailAnnouncementPopup'
import { formatNumberOfUnread } from 'components/Announcement/helper'
import { useGeneralAnnouncements } from 'components/Announcement/hooks/useGeneralAnnouncements'
import { usePrivateAnnouncements } from 'components/Announcement/hooks/usePrivateAnnouncements'
import {
  Announcement,
  AnnouncementTemplatePopup,
  PoolPositionAnnouncement,
  PrivateAnnouncement,
} from 'components/Announcement/type'
import NotificationIcon from 'components/Icons/NotificationIcon'
import MenuFlyout from 'components/MenuFlyout'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useDetailAnnouncement, useModalOpen, useToggleNotificationCenter } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/types'
import { MEDIA_WIDTHS } from 'theme'

import {
  BackButton,
  Badge,
  Container,
  ContentHeader,
  HeaderAction,
  HeaderTitle,
  StyledMenu,
  StyledMenuButton,
  Title,
  Wrapper,
  browserCustomStyle,
} from './styles'

function AnnouncementComponent() {
  const [activeTab, setActiveTab] = useState(Tab.CATEGORY)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const { mixpanelHandler } = useMixpanel()
  const { account } = useActiveWeb3React()
  const prevAccountRef = useRef<string | null | undefined>(account)

  const isOpenInbox = useModalOpen(ApplicationModal.NOTIFICATION_CENTER)
  const toggleNotificationCenter = useToggleNotificationCenter()
  const isMobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const {
    announcements: privateAnnouncements,
    preview: privatePreview,
    total: privateTotal,
    unread: numberOfUnread,
    isMarkAllLoading: isReadingAll,
    fetchList: fetchPrivateAnnouncements,
    fetchPreview: fetchPrivatePreview,
    markAsRead: onPrivateAnnouncementRead,
    markAllAsRead: onMarkAllPrivate,
    pinAnnouncement: onPinPrivateAnnouncement,
    deleteAnnouncement: onDeletePrivateAnnouncement,
    reset: resetPrivateAnnouncements,
  } = usePrivateAnnouncements()

  const {
    announcements: generalAnnouncements,
    total: generalTotal,
    preview: generalPreview,
    fetchList: fetchGeneralAnnouncements,
    fetchPreview: fetchGeneralPreview,
    reset: resetGeneralAnnouncements,
  } = useGeneralAnnouncements()

  const isCategoryTab = activeTab === Tab.CATEGORY

  const getEarnPosition = (announcement?: PrivateAnnouncement): PoolPositionAnnouncement | undefined => {
    const body = announcement?.templateBody as unknown
    if (body && typeof body === 'object' && 'position' in (body as { position?: PoolPositionAnnouncement })) {
      return (body as { position?: PoolPositionAnnouncement }).position
    }
    return undefined
  }

  const fetchByCategory = useCallback(
    (category: Category, isReset = false) => {
      if (category === Category.EARN_POSITION) {
        return fetchPrivateAnnouncements(isReset)
      }
      if (category === Category.ANNOUNCEMENTS) {
        return fetchGeneralAnnouncements(isReset)
      }
      return undefined
    },
    [fetchGeneralAnnouncements, fetchPrivateAnnouncements],
  )

  useEffect(() => {
    fetchPrivatePreview()
    fetchGeneralPreview()
  }, [fetchGeneralPreview, fetchPrivatePreview])

  useEffect(() => {
    if (prevAccountRef.current === account) return
    prevAccountRef.current = account
    resetPrivateAnnouncements()
    resetGeneralAnnouncements()
    if (activeTab === Tab.NOTIFICATIONS && selectedCategory) {
      fetchByCategory(selectedCategory, true)
    }
  }, [account, activeTab, fetchByCategory, resetGeneralAnnouncements, resetPrivateAnnouncements, selectedCategory])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPrivatePreview()
      fetchGeneralPreview()
      if (isOpenInbox && activeTab === Tab.NOTIFICATIONS && selectedCategory) {
        fetchByCategory(selectedCategory, true)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [activeTab, fetchByCategory, fetchGeneralPreview, fetchPrivatePreview, isOpenInbox, selectedCategory])

  const loadMoreAnnouncements = useCallback(() => {
    if (!selectedCategory) return undefined
    return fetchByCategory(selectedCategory, false)
  }, [fetchByCategory, selectedCategory])

  const onSetTab = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === Tab.CATEGORY) {
      setSelectedCategory(null)
    } else {
      const nextCategory = selectedCategory ?? Category.ANNOUNCEMENTS
      setSelectedCategory(nextCategory)
      fetchByCategory(nextCategory, true)
    }
  }

  const onSelectCategory = (category: Category) => {
    setSelectedCategory(category)
    setActiveTab(Tab.NOTIFICATIONS)
    fetchByCategory(category, true)
  }

  const currentAnnouncements = useMemo(
    () => (selectedCategory === Category.EARN_POSITION ? privateAnnouncements : generalAnnouncements),
    [generalAnnouncements, privateAnnouncements, selectedCategory],
  )

  const currentTotal = selectedCategory === Category.EARN_POSITION ? privateTotal : generalTotal
  const totalForView =
    selectedCategory === Category.EARN_POSITION
      ? currentTotal || privatePreview.total
      : selectedCategory === Category.ANNOUNCEMENTS
      ? currentTotal || generalPreview.total
      : generalPreview.total || currentTotal
  const announcementCount = generalPreview.total || totalForView
  const previewPosition = getEarnPosition(privatePreview.first)

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
    const announcements = (await fetchGeneralAnnouncements(false)) as Announcement[]
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
        toggleNotificationCenter()
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
            <HeaderAction onClick={onMarkAllPrivate} disabled={!account || isReadingAll || numberOfUnread === 0}>
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
            subLine1={generalPreview.first?.templateBody?.name}
            icon={<AnnouncementSvg />}
            onClick={() => onSelectCategory(Category.ANNOUNCEMENTS)}
          />
        </div>
      ) : (
        <AnnouncementView
          announcements={currentAnnouncements}
          totalAnnouncement={totalForView}
          loadMoreAnnouncements={loadMoreAnnouncements}
          toggleNotificationCenter={toggleNotificationCenter}
          showDetailAnnouncement={showDetailAnnouncement}
          selectedCategory={selectedCategory}
          onPrivateAnnouncementRead={onPrivateAnnouncementRead}
          onPrivateAnnouncementPin={onPinPrivateAnnouncement}
          onPrivateAnnouncementDelete={onDeletePrivateAnnouncement}
        />
      )}
    </Wrapper>
  )

  return (
    <StyledMenu>
      {isMobile ? (
        <>
          {bellIcon}
          <Modal isOpen={isOpenInbox} onDismiss={toggleNotificationCenter} minHeight={80}>
            {content}
          </Modal>
        </>
      ) : (
        <MenuFlyout
          trigger={bellIcon}
          customStyle={browserCustomStyle}
          isOpen={isOpenInbox}
          toggle={toggleNotificationCenter}
        >
          {content}
        </MenuFlyout>
      )}
      <DetailAnnouncementPopup fetchMore={fetchMoreAnnouncement} />
    </StyledMenu>
  )
}

export default AnnouncementComponent

import { Trans } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMedia } from 'react-use'

import AnnoucementList, { Category, Tab } from 'components/Announcement/AnnoucementList'
import AnnouncementCategoryList from 'components/Announcement/AnnouncementCategoryList'
import AnnouncementHeader from 'components/Announcement/AnnouncementHeader'
import DetailAnnouncementPopup from 'components/Announcement/Popups/DetailAnnouncementPopup'
import { formatNumberOfUnread } from 'components/Announcement/helper'
import { getEarnPosition, getLimitOrderPreview, getSmartExitPreview } from 'components/Announcement/helpers'
import { useGeneralAnnouncements } from 'components/Announcement/hooks/useGeneralAnnouncements'
import { usePrivateAnnouncements } from 'components/Announcement/hooks/usePrivateAnnouncements'
import { Announcement, AnnouncementTemplatePopup, PrivateAnnouncementType } from 'components/Announcement/type'
import NotificationIcon from 'components/Icons/NotificationIcon'
import MenuFlyout from 'components/MenuFlyout'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useDetailAnnouncement, useModalOpen, useToggleNotificationCenter } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/types'
import { MEDIA_WIDTHS } from 'theme'

import { Badge, Container, StyledMenu, StyledMenuButton, Title, Wrapper, browserCustomStyle } from './styles'

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
    announcements: earnAnnouncements,
    preview: earnPreview,
    total: earnTotal,
    unread: earnUnread,
    isMarkAllLoading: isReadingAllEarn,
    fetchList: fetchEarnAnnouncements,
    fetchPreview: fetchEarnPreview,
    markAsRead: onEarnAnnouncementRead,
    markAllAsRead: onMarkAllEarn,
    pinAnnouncement: onPinEarnAnnouncement,
    deleteAnnouncement: onDeleteEarnAnnouncement,
    reset: resetEarnAnnouncements,
  } = usePrivateAnnouncements(PrivateAnnouncementType.POSITION_STATUS)

  const {
    announcements: limitOrderAnnouncements,
    preview: limitOrderPreview,
    total: limitOrderTotal,
    unread: limitOrderUnread,
    isMarkAllLoading: isReadingAllLimitOrder,
    fetchList: fetchLimitOrderAnnouncements,
    fetchPreview: fetchLimitOrderPreview,
    markAsRead: onLimitOrderAnnouncementRead,
    markAllAsRead: onMarkAllLimitOrder,
    pinAnnouncement: onPinLimitOrderAnnouncement,
    deleteAnnouncement: onDeleteLimitOrderAnnouncement,
    reset: resetLimitOrderAnnouncements,
  } = usePrivateAnnouncements(PrivateAnnouncementType.LIMIT_ORDER)

  const {
    announcements: smartExitAnnouncements,
    preview: smartExitPreview,
    total: smartExitTotal,
    unread: smartExitUnread,
    isMarkAllLoading: isReadingAllSmartExit,
    fetchList: fetchSmartExitAnnouncements,
    fetchPreview: fetchSmartExitPreview,
    markAsRead: onSmartExitAnnouncementRead,
    markAllAsRead: onMarkAllSmartExit,
    pinAnnouncement: onPinSmartExitAnnouncement,
    deleteAnnouncement: onDeleteSmartExitAnnouncement,
    reset: resetSmartExitAnnouncements,
  } = usePrivateAnnouncements(PrivateAnnouncementType.SMART_EXIT)

  const {
    announcements: generalAnnouncements,
    preview: generalPreview,
    total: generalTotal,
    fetchList: fetchGeneralAnnouncements,
    fetchPreview: fetchGeneralPreview,
    reset: resetGeneralAnnouncements,
  } = useGeneralAnnouncements()

  const isCategoryTab = activeTab === Tab.CATEGORY

  const privateCategoryMap: Partial<Record<Category, ReturnType<typeof usePrivateAnnouncements>>> = useMemo(
    () => ({
      [Category.EARN_POSITION]: {
        announcements: earnAnnouncements,
        preview: earnPreview,
        total: earnTotal,
        unread: earnUnread,
        isMarkAllLoading: isReadingAllEarn,
        fetchList: fetchEarnAnnouncements,
        fetchPreview: fetchEarnPreview,
        markAsRead: onEarnAnnouncementRead,
        markAllAsRead: onMarkAllEarn,
        pinAnnouncement: onPinEarnAnnouncement,
        deleteAnnouncement: onDeleteEarnAnnouncement,
        reset: resetEarnAnnouncements,
      },
      [Category.LIMIT_ORDER]: {
        announcements: limitOrderAnnouncements,
        preview: limitOrderPreview,
        total: limitOrderTotal,
        unread: limitOrderUnread,
        isMarkAllLoading: isReadingAllLimitOrder,
        fetchList: fetchLimitOrderAnnouncements,
        fetchPreview: fetchLimitOrderPreview,
        markAsRead: onLimitOrderAnnouncementRead,
        markAllAsRead: onMarkAllLimitOrder,
        pinAnnouncement: onPinLimitOrderAnnouncement,
        deleteAnnouncement: onDeleteLimitOrderAnnouncement,
        reset: resetLimitOrderAnnouncements,
      },
      [Category.SMART_EXIT]: {
        announcements: smartExitAnnouncements,
        preview: smartExitPreview,
        total: smartExitTotal,
        unread: smartExitUnread,
        isMarkAllLoading: isReadingAllSmartExit,
        fetchList: fetchSmartExitAnnouncements,
        fetchPreview: fetchSmartExitPreview,
        markAsRead: onSmartExitAnnouncementRead,
        markAllAsRead: onMarkAllSmartExit,
        pinAnnouncement: onPinSmartExitAnnouncement,
        deleteAnnouncement: onDeleteSmartExitAnnouncement,
        reset: resetSmartExitAnnouncements,
      },
    }),
    [
      earnAnnouncements,
      earnPreview,
      earnTotal,
      earnUnread,
      isReadingAllEarn,
      fetchEarnAnnouncements,
      fetchEarnPreview,
      onEarnAnnouncementRead,
      onMarkAllEarn,
      onPinEarnAnnouncement,
      onDeleteEarnAnnouncement,
      resetEarnAnnouncements,
      limitOrderAnnouncements,
      limitOrderPreview,
      limitOrderTotal,
      limitOrderUnread,
      isReadingAllLimitOrder,
      fetchLimitOrderAnnouncements,
      fetchLimitOrderPreview,
      onLimitOrderAnnouncementRead,
      onMarkAllLimitOrder,
      onPinLimitOrderAnnouncement,
      onDeleteLimitOrderAnnouncement,
      resetLimitOrderAnnouncements,
      smartExitAnnouncements,
      smartExitPreview,
      smartExitTotal,
      smartExitUnread,
      isReadingAllSmartExit,
      fetchSmartExitAnnouncements,
      fetchSmartExitPreview,
      onSmartExitAnnouncementRead,
      onMarkAllSmartExit,
      onPinSmartExitAnnouncement,
      onDeleteSmartExitAnnouncement,
      resetSmartExitAnnouncements,
    ],
  )

  const fetchByCategory = useCallback(
    (category: Category, isReset = false) => {
      if (category === Category.ANNOUNCEMENTS) {
        return fetchGeneralAnnouncements(isReset)
      }
      return privateCategoryMap[category]?.fetchList(isReset)
    },
    [fetchGeneralAnnouncements, privateCategoryMap],
  )

  useEffect(() => {
    fetchEarnPreview()
    fetchLimitOrderPreview()
    fetchSmartExitPreview()
    fetchGeneralPreview()
  }, [fetchEarnPreview, fetchLimitOrderPreview, fetchSmartExitPreview, fetchGeneralPreview])

  useEffect(() => {
    if (prevAccountRef.current === account) return
    prevAccountRef.current = account
    resetEarnAnnouncements()
    resetLimitOrderAnnouncements()
    resetSmartExitAnnouncements()
    resetGeneralAnnouncements()
    if (activeTab === Tab.NOTIFICATIONS && selectedCategory) {
      fetchByCategory(selectedCategory, true)
    }
  }, [
    account,
    activeTab,
    fetchByCategory,
    resetEarnAnnouncements,
    resetGeneralAnnouncements,
    resetLimitOrderAnnouncements,
    resetSmartExitAnnouncements,
    selectedCategory,
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchEarnPreview()
      fetchLimitOrderPreview()
      fetchSmartExitPreview()
      fetchGeneralPreview()
      if (isOpenInbox && activeTab === Tab.NOTIFICATIONS && selectedCategory) {
        fetchByCategory(selectedCategory, true)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [
    activeTab,
    fetchByCategory,
    fetchEarnPreview,
    fetchGeneralPreview,
    fetchLimitOrderPreview,
    fetchSmartExitPreview,
    isOpenInbox,
    selectedCategory,
  ])

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

  const isAnnouncementsCategory = selectedCategory === Category.ANNOUNCEMENTS
  const selectedPrivateCategory =
    selectedCategory && !isAnnouncementsCategory ? privateCategoryMap[selectedCategory] : undefined

  const [currentAnnouncements, currentTotal, totalForView] = isAnnouncementsCategory
    ? [generalAnnouncements, generalTotal ?? 0, generalPreview.total ?? generalTotal ?? 0]
    : [
        selectedPrivateCategory?.announcements ?? [],
        selectedPrivateCategory?.total ?? 0,
        selectedPrivateCategory?.preview.total ?? selectedPrivateCategory?.total ?? 0,
      ]

  const announcementCount = generalPreview.total ?? generalTotal ?? 0
  const previewPosition = getEarnPosition(earnPreview.first)
  const previewLimitOrder = getLimitOrderPreview(limitOrderPreview.first)
  const previewSmartExit = getSmartExitPreview(smartExitPreview.first)

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

  const totalUnreadPrivate = (earnUnread ?? 0) + (limitOrderUnread ?? 0) + (smartExitUnread ?? 0)
  const badgeText = totalUnreadPrivate > 0 ? formatNumberOfUnread(totalUnreadPrivate) : null

  const bellIcon = (
    <StyledMenuButton
      active={isOpenInbox || totalUnreadPrivate > 0}
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

      <AnnouncementHeader
        isCategoryTab={isCategoryTab}
        selectedCategory={selectedCategory}
        selectedPrivateCategory={selectedPrivateCategory}
        account={account}
        onBack={() => onSetTab(Tab.CATEGORY)}
      />

      {isCategoryTab ? (
        <AnnouncementCategoryList
          earnUnread={earnUnread}
          smartExitUnread={smartExitUnread}
          limitOrderUnread={limitOrderUnread}
          announcementCount={announcementCount}
          previewPosition={previewPosition}
          previewLimitOrder={previewLimitOrder}
          previewSmartExit={previewSmartExit}
          announcementName={generalPreview.first?.templateBody?.name}
          onSelectCategory={onSelectCategory}
        />
      ) : (
        <AnnoucementList
          announcements={currentAnnouncements}
          totalAnnouncement={totalForView}
          loadMoreAnnouncements={loadMoreAnnouncements}
          toggleNotificationCenter={toggleNotificationCenter}
          showDetailAnnouncement={showDetailAnnouncement}
          selectedCategory={selectedCategory}
          onPrivateAnnouncementRead={selectedPrivateCategory?.markAsRead}
          onPrivateAnnouncementPin={selectedPrivateCategory?.pinAnnouncement}
          onPrivateAnnouncementDelete={selectedPrivateCategory?.deleteAnnouncement}
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

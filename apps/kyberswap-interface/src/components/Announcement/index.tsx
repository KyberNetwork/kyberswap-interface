import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronLeft } from 'react-feather'
import { useMedia } from 'react-use'

import { ReactComponent as AnnouncementSvg } from 'assets/svg/ic_announcement.svg'
import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as LimitOrderIcon } from 'assets/svg/limit_order.svg'
import AnnouncementView, { Category, Tab } from 'components/Announcement/AnnoucementView'
import CategoryItem from 'components/Announcement/CategoryItem'
import DetailAnnouncementPopup from 'components/Announcement/Popups/DetailAnnouncementPopup'
import { formatNumberOfUnread } from 'components/Announcement/helper'
import { useGeneralAnnouncements } from 'components/Announcement/hooks/useGeneralAnnouncements'
import { usePrivateAnnouncements } from 'components/Announcement/hooks/usePrivateAnnouncements'
import {
  Announcement,
  AnnouncementTemplateLimitOrder,
  AnnouncementTemplatePopup,
  PoolPositionAnnouncement,
  PrivateAnnouncement,
  PrivateAnnouncementType,
} from 'components/Announcement/type'
import NotificationIcon from 'components/Icons/NotificationIcon'
import MenuFlyout from 'components/MenuFlyout'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
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

  const getLimitOrderPreview = (announcement?: PrivateAnnouncement): { pair?: string; status?: string } | undefined => {
    const body = announcement?.templateBody as AnnouncementTemplateLimitOrder | undefined
    const order = body?.order
    if (!order) return undefined
    const pair =
      order.makerAssetSymbol && order.takerAssetSymbol
        ? `${order.makerAssetSymbol}/${order.takerAssetSymbol}`
        : undefined
    const isFilled = order.status === LimitOrderStatus.FILLED
    const isPartialFilled = order.status === LimitOrderStatus.PARTIALLY_FILLED
    const status = body?.isReorg
      ? `Reverted ${order.increasedFilledPercent}`
      : isFilled
      ? t`100% Filled`
      : isPartialFilled
      ? `${order.filledPercent} Filled ${order.increasedFilledPercent}`
      : `${order.filledPercent}% Filled | Expired`

    return { pair, status }
  }

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
    }),
    [
      earnAnnouncements,
      earnPreview,
      earnTotal,
      earnUnread,
      fetchEarnAnnouncements,
      fetchEarnPreview,
      isReadingAllEarn,
      limitOrderAnnouncements,
      limitOrderPreview,
      limitOrderTotal,
      limitOrderUnread,
      fetchLimitOrderAnnouncements,
      fetchLimitOrderPreview,
      isReadingAllLimitOrder,
      onDeleteEarnAnnouncement,
      onDeleteLimitOrderAnnouncement,
      onEarnAnnouncementRead,
      onLimitOrderAnnouncementRead,
      onMarkAllEarn,
      onMarkAllLimitOrder,
      onPinEarnAnnouncement,
      onPinLimitOrderAnnouncement,
      resetEarnAnnouncements,
      resetLimitOrderAnnouncements,
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
    fetchGeneralPreview()
  }, [fetchEarnPreview, fetchGeneralPreview, fetchLimitOrderPreview])

  useEffect(() => {
    if (prevAccountRef.current === account) return
    prevAccountRef.current = account
    resetEarnAnnouncements()
    resetLimitOrderAnnouncements()
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
    selectedCategory,
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchEarnPreview()
      fetchLimitOrderPreview()
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

  const totalUnreadPrivate = (earnUnread ?? 0) + (limitOrderUnread ?? 0)
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

      {!isCategoryTab && (
        <ContentHeader>
          <BackButton onClick={() => onSetTab(Tab.CATEGORY)}>
            <ChevronLeft size={16} />
          </BackButton>
          <HeaderTitle>
            {isAnnouncementsCategory ? (
              <Trans>Announcements</Trans>
            ) : selectedCategory === Category.LIMIT_ORDER ? (
              <Trans>Limit Orders</Trans>
            ) : (
              <Trans>Earn Position</Trans>
            )}
          </HeaderTitle>
          {selectedPrivateCategory && (
            <HeaderAction
              onClick={selectedPrivateCategory.markAllAsRead}
              disabled={
                !account || selectedPrivateCategory.isMarkAllLoading || (selectedPrivateCategory.unread || 0) === 0
              }
            >
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
            counter={earnUnread}
            subLine1={previewPosition ? `${previewPosition.token0Symbol}/${previewPosition.token1Symbol}` : undefined}
            subLine2={previewPosition?.positionId ? `#${previewPosition.positionId}` : undefined}
            icon={<FarmingIcon />}
            onClick={() => onSelectCategory(Category.EARN_POSITION)}
          />
          <CategoryItem
            title="Limit Orders"
            counter={limitOrderUnread}
            subLine1={previewLimitOrder?.pair}
            subLine2={previewLimitOrder?.status}
            icon={<LimitOrderIcon />}
            onClick={() => onSelectCategory(Category.LIMIT_ORDER)}
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

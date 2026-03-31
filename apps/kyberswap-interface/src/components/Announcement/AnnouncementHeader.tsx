import { Trans } from '@lingui/macro'
import { Check, ChevronLeft } from 'react-feather'

import { Category } from 'components/Announcement/AnnoucementList'

import { BackButton, ContentHeader, HeaderAction, HeaderTitle } from './styles'

export type SelectedCategoryState = {
  markAllAsRead?: () => void
  isMarkAllLoading?: boolean
  unread?: number
}

type Props = {
  isCategoryTab: boolean
  selectedCategory: Category | null
  selectedCategoryState?: SelectedCategoryState
  account?: string
  onBack: () => void
}

const getHeaderTitle = (category: Category | null) => {
  if (category === Category.LIMIT_ORDER) return <Trans>Limit Orders</Trans>
  if (category === Category.EARN_POSITION) return <Trans>Earn Position</Trans>
  if (category === Category.SMART_EXIT) return <Trans>Smart Exit</Trans>
  return <Trans>Announcements</Trans>
}

export default function AnnouncementHeader({
  isCategoryTab,
  selectedCategory,
  selectedCategoryState,
  account,
  onBack,
}: Props) {
  if (isCategoryTab) return null

  return (
    <ContentHeader>
      <BackButton onClick={onBack}>
        <ChevronLeft size={16} />
      </BackButton>
      <HeaderTitle>{getHeaderTitle(selectedCategory)}</HeaderTitle>
      {selectedCategoryState && (
        <HeaderAction
          onClick={selectedCategoryState.markAllAsRead}
          disabled={!account || selectedCategoryState.isMarkAllLoading || (selectedCategoryState.unread || 0) === 0}
        >
          <Check size={16} />
          <Trans>Mark all read</Trans>
        </HeaderAction>
      )}
    </ContentHeader>
  )
}

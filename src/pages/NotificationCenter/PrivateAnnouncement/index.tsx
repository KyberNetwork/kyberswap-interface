import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import {
  useAckPrivateAnnouncementsByIdsMutation,
  useClearAllPrivateAnnouncementByIdMutation,
  useGetPrivateAnnouncementsByIdsQuery,
  useGetPrivateAnnouncementsQuery,
} from 'services/announcement'
import styled from 'styled-components'

import { PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'
import { getAnnouncementsTemplateIds } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import DeleteAllAlertsButton from 'pages/NotificationCenter/DeleteAllAlertsButton'
import { MENU_TITLE } from 'pages/NotificationCenter/Menu'
import NoData from 'pages/NotificationCenter/NoData'
import { ShareContentWrapper, ShareWrapper } from 'pages/NotificationCenter/PriceAlerts'
import CommonPagination from 'pages/NotificationCenter/PriceAlerts/CommonPagination'
import { ITEMS_PER_PAGE } from 'pages/NotificationCenter/const'

import AnnouncementItem from './AnnouncementItem'

const HeaderWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding-bottom: 20px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 12px 0px;
  `}
`

export default function GeneralAnnouncement({ type }: { type?: PrivateAnnouncementType }) {
  const [page, setPage] = useState(1)
  const { account } = useActiveWeb3React()
  const templateIds = type ? getAnnouncementsTemplateIds()[type] : ''
  const { data: respNotificationByType, refetch: refetchById } = useGetPrivateAnnouncementsByIdsQuery(
    { page, account: account ?? '', templateIds, pageSize: ITEMS_PER_PAGE },
    { skip: !account || !templateIds },
  )
  const { data: dataAllNotification, refetch: refetchAll } = useGetPrivateAnnouncementsQuery(
    { page, account: account ?? '', pageSize: ITEMS_PER_PAGE },
    { skip: !account || !!templateIds },
  )

  const [ackAnnouncement] = useAckPrivateAnnouncementsByIdsMutation()
  const [clearAllAnnouncement] = useClearAllPrivateAnnouncementByIdMutation()

  const data = type ? respNotificationByType : dataAllNotification
  const numberOfUnread = data?.numberOfUnread || 0

  const refetch = type ? refetchById : refetchAll

  useEffect(() => {
    if (numberOfUnread > 0 && account) {
      // mark all as read
      ackAnnouncement({ templateIds: templateIds || undefined, account }).then(() => {
        refetch()
      })
    }
  }, [numberOfUnread, templateIds, account, ackAnnouncement, refetch])

  const totalAnnouncement = data?.notifications?.length ?? 0

  const [loading, setLoading] = useState(false)
  const clearAll = async () => {
    setLoading(true)
    return clearAllAnnouncement({ account: account ?? '', templateIds })
      .then(() => {
        refetch()
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <ShareWrapper>
      <ShareContentWrapper>
        <HeaderWrapper>
          <DeleteAllAlertsButton
            disabled={totalAnnouncement === 0 || loading}
            onClear={clearAll}
            notificationName={type ? MENU_TITLE[type] : t`Notifications`}
          />
        </HeaderWrapper>
        {data?.notifications?.length ? (
          data?.notifications?.map(item => (
            <AnnouncementItem key={item.id} announcement={item as PrivateAnnouncement} />
          ))
        ) : (
          <NoData msg={account ? t`No notification yet` : t`Connect wallet to view notification`} />
        )}
      </ShareContentWrapper>
      <CommonPagination
        onPageChange={setPage}
        totalCount={data?.pagination?.totalItems || 0}
        currentPage={page}
        pageSize={ITEMS_PER_PAGE}
        haveBg={false}
      />
    </ShareWrapper>
  )
}

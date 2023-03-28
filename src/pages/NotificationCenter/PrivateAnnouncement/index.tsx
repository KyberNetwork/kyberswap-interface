import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import {
  useAckPrivateAnnouncementsByIdsMutation,
  useClearAllPrivateAnnouncementByIdMutation,
  useGetPrivateAnnouncementsByIdsQuery,
  useGetPrivateAnnouncementsQuery,
} from 'services/announcement'

import { PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'
import { getAnnouncementsTemplateIds } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import DeleteAllAlertsButton from 'pages/NotificationCenter/DeleteAllAlertsButton'
import NoData from 'pages/NotificationCenter/NoData'
import { ShareContentWrapper, ShareWrapper } from 'pages/NotificationCenter/PriceAlerts'
import CommonPagination from 'pages/NotificationCenter/PriceAlerts/CommonPagination'
import { ITEMS_PER_PAGE } from 'pages/NotificationCenter/const'

import AnnouncementItem from './AnnouncementItem'

export default function GeneralAnnouncement({ type }: { type?: PrivateAnnouncementType }) {
  const [page, setPage] = useState(1)
  const { account } = useActiveWeb3React()
  const templateIds = type ? getAnnouncementsTemplateIds()[type] : ''
  const { data: respNotificationByType } = useGetPrivateAnnouncementsByIdsQuery(
    { page, account: account ?? '', templateIds, pageSize: ITEMS_PER_PAGE },
    { skip: !account || !templateIds },
  )
  const { data: dataAllNotification } = useGetPrivateAnnouncementsQuery(
    { page, account: account ?? '', pageSize: ITEMS_PER_PAGE },
    { skip: !account || !!templateIds },
  )

  const [ackAnnouncement] = useAckPrivateAnnouncementsByIdsMutation()
  const [clearAllAnnouncement] = useClearAllPrivateAnnouncementByIdMutation()

  const data = type ? respNotificationByType : dataAllNotification
  const numberOfUnread = data?.numberOfUnread || 0

  useEffect(() => {
    if (numberOfUnread > 0 && account) {
      // mark all as read
      ackAnnouncement({ templateIds: templateIds || undefined, account })
    }
  }, [numberOfUnread, templateIds, account, ackAnnouncement])

  return (
    <ShareWrapper>
      <ShareContentWrapper>
        {false && (
          <DeleteAllAlertsButton
            disabled={false}
            onClear={() => clearAllAnnouncement({ account: account ?? '', templateIds })}
            confirmBtnText={'Delete All Alerts'}
          />
        )}

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

import { useState } from 'react'
import { useGetPrivateAnnouncementsByIdsQuery, useGetPrivateAnnouncementsQuery } from 'services/announcement'

import { PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'
import { getAnnouncementsTemplateIds } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
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

  const data = type ? respNotificationByType : dataAllNotification

  return (
    <ShareWrapper>
      <ShareContentWrapper>
        {data?.notifications?.map(item => (
          <AnnouncementItem key={item.id} announcement={item as PrivateAnnouncement} />
        ))}
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

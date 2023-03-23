import { useState } from 'react'
import { useGetAnnouncementsQuery } from 'services/announcement'

import { Announcement } from 'components/Announcement/type'
import AnnouncementItem from 'pages/NotificationCenter/GeneralAnnouncement/AnnouncementItem'
import { ShareContentWrapper, ShareWrapper } from 'pages/NotificationCenter/PriceAlerts'
import CommonPagination from 'pages/NotificationCenter/PriceAlerts/CommonPagination'
import { ITEMS_PER_PAGE } from 'pages/NotificationCenter/const'

export default function GeneralAnnouncement() {
  const [page, setPage] = useState(1)
  const { data } = useGetAnnouncementsQuery({ page })

  return (
    <ShareWrapper>
      <ShareContentWrapper>
        {data?.notifications.map(item => (
          <AnnouncementItem key={item.id} announcement={item as Announcement} />
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

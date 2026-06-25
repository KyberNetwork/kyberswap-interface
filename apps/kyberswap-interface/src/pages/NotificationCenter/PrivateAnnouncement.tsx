import { t } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import {
  useAckPrivateAnnouncementsByIdsMutation,
  useAckPrivateAnnouncementsMutation,
  useClearAllPrivateAnnouncementByIdMutation,
  useGetPrivateAnnouncementsByIdsQuery,
  useGetPrivateAnnouncementsQuery,
} from 'services/announcement'

import { PRIVATE_ANN_TITLE } from 'components/Announcement/PrivateAnnoucement'
import InboxItemNotificationCenter from 'components/Announcement/PrivateAnnoucement/NotificationCenter'
import { PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'
import { getAnnouncementsTemplateIds } from 'constants/env'
import { useActiveWeb3React } from 'hooks'
import { useInvalidateTagAnnouncement } from 'hooks/useInvalidateTags'
import DeleteAllAlertsButton from 'pages/NotificationCenter/DeleteAllAlertsButton'
import NoData from 'pages/NotificationCenter/NoData'
import CommonPagination from 'pages/NotificationCenter/PriceAlerts/CommonPagination'
import { ITEMS_PER_PAGE } from 'pages/NotificationCenter/const'
import { ShareContentWrapper, ShareWrapper } from 'pages/NotificationCenter/styled'

export default function GeneralAnnouncement({ type }: { type?: PrivateAnnouncementType }) {
  const [page, setPage] = useState(1)
  const { account } = useActiveWeb3React()
  const templateIds = type ? getAnnouncementsTemplateIds(type) : ''
  const {
    data: respNotificationByType,
    refetch: refetchById,
    isLoading,
  } = useGetPrivateAnnouncementsByIdsQuery({ page, templateIds, pageSize: ITEMS_PER_PAGE }, { skip: !templateIds })
  const {
    data: dataAllNotification,
    refetch: refetchAll,
    isLoading: isLoadingAll,
  } = useGetPrivateAnnouncementsQuery({ page, pageSize: ITEMS_PER_PAGE }, { skip: !!templateIds })

  const [ackAnnouncement] = useAckPrivateAnnouncementsByIdsMutation()
  const [clearAllAnnouncement] = useClearAllPrivateAnnouncementByIdMutation()

  const data = type ? respNotificationByType : dataAllNotification
  const numberOfUnread = data?.numberOfUnread || 0

  const refetch = type ? refetchById : refetchAll
  const resetUnread = useInvalidateTagAnnouncement()

  const loadingRef = useRef(false)
  useEffect(() => {
    if (!account || numberOfUnread === 0 || loadingRef.current) return
    loadingRef.current = true
    ackAnnouncement({ templateIds: templateIds || undefined })
      .then(() => {
        refetch()
      })
      .catch(e => {
        console.error('ackAnnouncement', e)
      })
      .finally(() => {
        loadingRef.current = false
      })
  }, [numberOfUnread, templateIds, account, ackAnnouncement, refetch, resetUnread])

  const totalAnnouncement = data?.notifications?.length ?? 0
  const [clearAllRequest] = useAckPrivateAnnouncementsMutation()

  const [loading, setLoading] = useState(false)
  const clearAll = async () => {
    setLoading(true)
    return (templateIds ? clearAllAnnouncement({ templateIds }) : clearAllRequest({ action: 'clear-all' }))
      .then(() => {
        refetch()
      })
      .catch(e => {
        console.error('clearAllAnnouncement', e)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <ShareWrapper>
      <ShareContentWrapper>
        <div className="flex justify-end border-b border-solid border-border pb-5 max-md:px-0 max-md:py-3">
          <DeleteAllAlertsButton
            disabled={totalAnnouncement === 0 || loading}
            onClear={clearAll}
            notificationName={type ? PRIVATE_ANN_TITLE()[type] : t`Notifications`}
          />
        </div>
        {data?.notifications?.length ? (
          data?.notifications?.map(item => (
            <InboxItemNotificationCenter key={item.id} announcement={item as PrivateAnnouncement} />
          ))
        ) : (
          <NoData
            msg={account ? t`No notification yet` : t`Connect wallet to view notification`}
            isLoading={isLoading || isLoadingAll}
          />
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

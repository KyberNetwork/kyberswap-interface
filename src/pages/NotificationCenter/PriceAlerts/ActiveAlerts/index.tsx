import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Flex } from 'rebass'
import { useGetAlertStatsQuery, useGetListAlertsQuery } from 'services/priceAlert'

import { PrivateAnnouncementType } from 'components/Announcement/type'
import NoData from 'pages/NotificationCenter/NoData'
import CommonPagination from 'pages/NotificationCenter/PriceAlerts/CommonPagination'
import { ITEMS_PER_PAGE } from 'pages/NotificationCenter/const'
import { useSessionInfo } from 'state/authen/hooks'
import { subscribePrivateAnnouncementProfile } from 'utils/firebase'

import SingleAlert from './SingleAlert'

const ActiveAlerts = ({ setDisabledClearAll }: { setDisabledClearAll: (v: boolean) => void }) => {
  const { userInfo } = useSessionInfo()
  const [page, setPage] = useState(1)
  const { data, isFetching, isLoading, refetch } = useGetListAlertsQuery({
    page,
    pageSize: ITEMS_PER_PAGE,
    sort: 'is_enabled:desc,created_at:desc',
  })
  const { data: alertStat, refetch: refetchStat } = useGetAlertStatsQuery()
  const isMaxQuotaActiveAlert = alertStat ? alertStat.totalActiveAlerts >= alertStat.maxActiveAlerts : false

  useEffect(() => {
    try {
      refetch()
      refetchStat()
    } catch (error) {}
  }, [userInfo?.identityId, refetch, refetchStat])

  useEffect(() => {
    setDisabledClearAll(!data?.alerts?.length)
  }, [data?.alerts?.length, setDisabledClearAll])

  useEffect(() => {
    if (!userInfo?.identityId) return
    const unsubscribePrivate = subscribePrivateAnnouncementProfile(userInfo?.identityId, data => {
      data.forEach(item => {
        if (item.templateType === PrivateAnnouncementType.PRICE_ALERT) {
          refetch()
          refetchStat()
        }
      })
    })
    return () => unsubscribePrivate?.()
  }, [userInfo?.identityId, refetch, refetchStat])

  const totalAlert = data?.alerts?.length ?? 0
  console.log({ isFetching, data, isLoading })

  if (!totalAlert || isFetching) {
    return <NoData msg={t`No price alerts created yet`} isLoading={isFetching} />
  }

  return (
    <>
      <Flex
        sx={{
          flexDirection: 'column',
        }}
      >
        {data?.alerts.map(alert => (
          <SingleAlert key={alert.id} alert={alert} isMaxQuotaActiveAlert={isMaxQuotaActiveAlert} />
        ))}
      </Flex>

      <CommonPagination
        style={{ margin: 0 }}
        onPageChange={setPage}
        totalCount={data?.pagination?.totalItems || 0}
        currentPage={page}
        pageSize={ITEMS_PER_PAGE}
        haveBg={false}
      />
    </>
  )
}

export default ActiveAlerts

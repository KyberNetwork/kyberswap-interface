import { Trans } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useGetListPriceAlertHistoryQuery } from 'services/priceAlert'

import { AnnouncementTemplatePriceAlert, PrivateAnnouncement } from 'components/Announcement/type'
import Loader from 'components/Loader'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import CommonPagination from 'pages/NotificationCenter/PriceAlerts/CommonPagination'
import { ITEMS_PER_PAGE } from 'pages/NotificationCenter/const'

import SingleAlert from './SingleAlert'

const AlertsHistory = ({ setDisabledClearAll }: { setDisabledClearAll: (v: boolean) => void }) => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGetListPriceAlertHistoryQuery(
    {
      account: account || '',
      page,
      pageSize: ITEMS_PER_PAGE,
    },
    { skip: !account },
  )

  const notifications = data?.notifications ?? []

  useEffect(() => {
    setDisabledClearAll(!notifications?.length)
  }, [notifications?.length, setDisabledClearAll])

  if (isLoading) {
    return (
      <Flex justifyContent="center" height="100%" minHeight="100%" alignItems="center">
        <Loader size="36px" />
      </Flex>
    )
  }

  if (!notifications?.length) {
    return (
      <Flex flex="1 1 0" justifyContent="center" width="100%" alignItems="center">
        <Flex
          sx={{
            flexDirection: 'column',
            alignItems: 'center',
            color: theme.subText,
            gap: '0.75rem',
          }}
        >
          <Info size={'24px'} />
          <Text as="span">
            <Trans>No alerts yet</Trans>
          </Text>
        </Flex>
      </Flex>
    )
  }

  return (
    <>
      <Flex
        sx={{
          flexDirection: 'column',
        }}
      >
        {notifications.map(alert => (
          <SingleAlert key={alert.id} announcement={alert as PrivateAnnouncement<AnnouncementTemplatePriceAlert>} />
        ))}
      </Flex>

      <CommonPagination
        onPageChange={setPage}
        totalCount={data?.pagination?.totalItems || 0}
        currentPage={page}
        pageSize={ITEMS_PER_PAGE}
        haveBg={false}
      />
    </>
  )
}

export default AlertsHistory

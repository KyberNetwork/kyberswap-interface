import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useClearAllPriceAlertHistoryMutation, useGetListPriceAlertHistoryQuery } from 'services/priceAlert'

import Loader from 'components/Loader'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import CommonPagination from 'pages/NotificationCenter/PriceAlerts/CommonPagination'
import DeleteAllAlertsButton from 'pages/NotificationCenter/PriceAlerts/DeleteAllAlertsButton'
import Header from 'pages/NotificationCenter/PriceAlerts/Header'
import { ITEMS_PER_PAGE } from 'pages/NotificationCenter/const'

import SingleAlert from './SingleAlert'

const AlertsHistory = () => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const [page, setPage] = useState(1)
  const [clearAllHistory, clearAllHistoryResult] = useClearAllPriceAlertHistoryMutation()
  const { data, isLoading } = useGetListPriceAlertHistoryQuery(
    {
      account: account || '',
      page,
      pageSize: ITEMS_PER_PAGE,
    },
    { skip: !account },
  )

  const renderDeleteAllButton = () => {
    return (
      <DeleteAllAlertsButton
        isLoading={isLoading}
        disabled={!data?.pagination?.totalItems || clearAllHistoryResult.isLoading || !account}
        onClick={async () => {
          if (!account) {
            throw new Error('No connect account to delete active alerts')
          }
          await clearAllHistory({ account })
        }}
      />
    )
  }

  const renderPageContent = () => {
    if (isLoading) {
      return (
        <Flex justifyContent="center" height="100%" minHeight="100%" alignItems="center">
          <Loader size="36px" />
        </Flex>
      )
    }

    if (!data?.historicalAlerts?.length) {
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
          {data.historicalAlerts.map(alert => {
            return <SingleAlert key={alert.id} historicalAlert={alert} />
          })}
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

  return (
    <>
      <Header renderDeleteAllButton={renderDeleteAllButton} />
      {renderPageContent()}
    </>
  )
}

export default AlertsHistory

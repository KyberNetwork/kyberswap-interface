import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useGetListAlertsHistoryQuery } from 'services/priceAlert'
import styled from 'styled-components'

import Loader from 'components/Loader'
import Pagination from 'components/Pagination'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'

import SingleAlert from './SingleAlert'

const CustomPagination = styled(Pagination)`
  margin-top: 1rem;
  padding: 0 1rem;
`

const ITEMS_PER_PAGE = 10

const AlertsHistory = () => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGetListAlertsHistoryQuery(
    {
      walletAddress: account || '',
      page,
      pageSize: ITEMS_PER_PAGE,
    },
    { skip: !account },
  )

  if (isLoading) {
    return (
      <Flex justifyContent="center" height="100%" minHeight="100%" alignItems="center">
        <Loader size="36px" />
      </Flex>
    )
  }

  if (!data?.alerts?.length) {
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
        {data.alerts.map(alert => {
          return <SingleAlert key={alert.id} alert={alert} />
        })}
      </Flex>

      <CustomPagination
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

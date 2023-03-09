import { useState } from 'react'
import { Flex } from 'rebass'
import { useGetListAlertsQuery } from 'services/priceAlert'
import styled from 'styled-components'

import Pagination from 'components/Pagination'
import { useActiveWeb3React } from 'hooks'
import Header from 'pages/NotificationCenter/PriceAlerts/Header'

import SingleAlert from './SingleAlert'

const CustomPagination = styled(Pagination)`
  margin-top: 1rem;
  padding: 0 1rem;
`

const ITEMS_PER_PAGE = 10

const PriceAlerts = () => {
  const { account } = useActiveWeb3React()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGetListAlertsQuery({
    walletAddress: account || '',
    page,
    pageSize: ITEMS_PER_PAGE,
  })

  if (isLoading) {
    return <div>loading</div>
  }

  if (!data?.alerts) {
    return null
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
      }}
    >
      <Header />

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
    </Flex>
  )
}

export default PriceAlerts

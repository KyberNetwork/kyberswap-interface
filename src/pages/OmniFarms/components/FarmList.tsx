import { Trans } from '@lingui/macro'
import { useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import { Text } from 'rebass'
import { useGetFarmsQuery } from 'services/knprotocol'
import styled from 'styled-components'

import Pagination from 'components/Pagination'
import { useActiveWeb3React } from 'hooks'
import useFarmFilters from 'hooks/farms/useFarmFilters'
import useTheme from 'hooks/useTheme'

import FarmTableHeader, { HeaderWrapper } from './FarmTableHeader'
import FarmTableRow from './FarmTableRow'

const FarmTable = styled.div(({ theme }) => ({
  borderRadius: '20px',
  border: `1px solid ${theme.border}`,
  marginTop: '1.5rem',
  overflow: 'hidden',
}))

const Row = styled(HeaderWrapper)(({ theme }) => ({
  background: 'transparent',
  padding: '1rem 1.5rem',
  fontSize: '14px',
  fontWeight: '500',
  borderBottom: `1px solid ${theme.border}`,
  height: '70px',
}))

export default function FarmList() {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const [{ chainIds, ...filters }, setFarmFilters] = useFarmFilters()

  const params = useMemo(() => ({ ...filters, account }), [filters, account])

  const { data, isLoading, isFetching } = useGetFarmsQuery(params, {
    pollingInterval: 10_000,
  })

  const skeleton = (width: string, align?: 'left' | 'right') => {
    return (
      <Text textAlign={align || 'right'}>
        <Skeleton
          height="20px"
          width={width}
          baseColor={theme.border}
          highlightColor={theme.buttonGray}
          borderRadius="999px"
        />
      </Text>
    )
  }

  return (
    <FarmTable>
      <FarmTableHeader />

      {isLoading || isFetching ? (
        [...Array(10).keys()].map(i => (
          <Row key={i}>
            {skeleton('80%', 'left')}
            {skeleton('80%')}
            {skeleton('80%')}
            {skeleton('60%')}
            {skeleton('80%')}
            {skeleton('70%')}
            {skeleton('70%')}
          </Row>
        ))
      ) : data?.farmPools.length ? (
        data?.farmPools.map(farm => {
          return <FarmTableRow farm={farm} key={`${farm.chain.name}_${farm.protocol}_${farm.id}`} />
        })
      ) : (
        <Text padding="3rem" display="flex" alignItems="center" justifyContent="center" color={theme.subText}>
          <Trans>No Farm Found</Trans>
        </Text>
      )}

      <Pagination
        onPageChange={page => {
          setFarmFilters({
            page,
          })
        }}
        totalCount={data?.pagination.totalRecords || 0}
        currentPage={filters.page}
        pageSize={filters.perPage}
        style={{ background: theme.tableHeader }}
      />
    </FarmTable>
  )
}

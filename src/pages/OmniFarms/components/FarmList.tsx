import { useGetFarmsQuery } from 'services/knprotocol'
import styled from 'styled-components'

import Pagination from 'components/Pagination'
import { useActiveWeb3React } from 'hooks'
import useFarmFilters from 'hooks/farms/useFarmFilters'
import useTheme from 'hooks/useTheme'

import FarmTableHeader from './FarmTableHeader'
import FarmTableRow from './FarmTableRow'

const FarmTable = styled.div(({ theme }) => ({
  borderRadius: '20px',
  border: `1px solid ${theme.border}`,
  marginTop: '1.5rem',
  overflow: 'hidden',
}))

export default function FarmList() {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const [{ chainIds, ...filters }, setFarmFilters] = useFarmFilters()

  const { data } = useGetFarmsQuery({ ...filters, account })

  return (
    <FarmTable>
      <FarmTableHeader />

      {data?.farmPools.map(farm => {
        return <FarmTableRow farm={farm} key={`${farm.chain.name}_${farm.protocol}_${farm.id}`} />
      })}

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

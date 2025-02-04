import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import { PositionStatus } from 'services/zapEarn'

import Search from 'components/Search'
import useDebounce from 'hooks/useDebounce'
import { MEDIA_WIDTHS } from 'theme'

import DropdownMenu, { MenuOption } from '../PoolExplorer/DropdownMenu'
import { AllChainsOption, AllProtocolsOption } from '../useSupportedDexesAndChains'

const POSITION_STATUS = [
  { label: 'All Positions', value: '' },
  { label: 'In Range', value: PositionStatus.IN_RANGE },
  { label: 'Out Range', value: PositionStatus.OUT_RANGE },
]

export default function Filter({
  supportedChains,
  supportedDexes,
  filters,
  onFilterChange,
}: {
  supportedChains: MenuOption[]
  supportedDexes: MenuOption[]
  filters: {
    addresses: string
    chainIds: string
    protocols: string
    status: string
    q: string
  }
  onFilterChange: (key: string, value: string | number) => void
}) {
  const [search, setSearch] = useState('')
  const deboundedSearch = useDebounce(search, 300)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  useEffect(() => {
    if (filters.q !== deboundedSearch) {
      onFilterChange('q', deboundedSearch || '')
    }
  }, [deboundedSearch, filters.q, onFilterChange])

  return (
    <Flex
      flexDirection={upToSmall ? 'column' : 'row'}
      alignItems={'center'}
      justifyContent={'space-between'}
      sx={{ gap: 2 }}
    >
      <Flex sx={{ gap: 2, width: upToSmall ? '100%' : 'auto' }} flexWrap={'wrap'}>
        <DropdownMenu
          alignLeft
          mobileHalfWidth
          value={filters.chainIds}
          options={supportedChains.length ? supportedChains : [AllChainsOption]}
          onChange={value => value !== filters.chainIds && onFilterChange('chainIds', value)}
        />
        <DropdownMenu
          alignLeft
          mobileHalfWidth
          value={filters.protocols}
          options={supportedDexes.length ? supportedDexes : [AllProtocolsOption]}
          onChange={value => value !== filters.protocols && onFilterChange('protocols', value)}
        />
        <DropdownMenu
          alignLeft
          mobileFullWidth
          value={filters.status}
          options={POSITION_STATUS}
          onChange={value => value !== filters.status && onFilterChange('status', value)}
        />
      </Flex>
      <Search
        placeholder={t`Search by token symbol or address`}
        searchValue={search}
        allowClear
        onSearch={val => setSearch(val)}
        style={{ height: '36px' }}
      />
    </Flex>
  )
}

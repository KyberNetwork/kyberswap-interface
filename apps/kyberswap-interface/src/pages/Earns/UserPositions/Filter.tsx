import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'

import Search from 'components/Search'
import useDebounce from 'hooks/useDebounce'
import DropdownMenu, { MenuOption } from 'pages/Earns/components/DropdownMenu'
import { default as MultiSelectDropdownMenu } from 'pages/Earns/components/DropdownMenu/MultiSelect'
import { AllChainsOption, AllProtocolsOption } from 'pages/Earns/hooks/useSupportedDexesAndChains'
import { PositionFilter, PositionStatus } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'

const POSITION_STATUS = [
  { label: 'In Range', value: PositionStatus.IN_RANGE },
  { label: 'Out Range', value: PositionStatus.OUT_RANGE },
  { label: 'Closed Positions', value: PositionStatus.CLOSED },
]

export default function Filter({
  supportedChains,
  supportedDexes,
  filters,
  updateFilters,
}: {
  supportedChains: MenuOption[]
  supportedDexes: MenuOption[]
  filters: PositionFilter
  updateFilters: (key: keyof PositionFilter, value: string | number) => void
}) {
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const deboundedSearch = useDebounce(search, 300)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  useEffect(() => {
    if (filters.q !== deboundedSearch) {
      updateFilters('q', deboundedSearch || '')
    }
  }, [deboundedSearch, filters.q, updateFilters])

  useEffect(() => {
    if (searchParams.get('q') && !search) {
      setSearch(searchParams.get('q') || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (
      filters.protocols &&
      supportedDexes.length &&
      !supportedDexes
        .map(item => item.value)
        .filter(Boolean)
        .includes(filters.protocols)
    ) {
      updateFilters('protocols', '')
    }
  }, [filters.protocols, supportedDexes, updateFilters])

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
          value={filters.chainIds || ''}
          options={supportedChains.length ? supportedChains : [AllChainsOption]}
          onChange={value => value !== filters.chainIds && updateFilters('chainIds', value)}
        />
        <DropdownMenu
          alignLeft
          mobileHalfWidth
          value={filters.protocols || ''}
          options={supportedDexes.length ? supportedDexes : [AllProtocolsOption]}
          onChange={value => value !== filters.protocols && updateFilters('protocols', value)}
        />
        <MultiSelectDropdownMenu
          alignLeft
          mobileFullWidth
          label={t`Position status`}
          options={POSITION_STATUS}
          value={filters.status || ''}
          onChange={value => value !== filters.status && updateFilters('status', value)}
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

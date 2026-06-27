import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'

import Search from 'components/Search'
import useDebounce from 'hooks/useDebounce'
import DropdownMenu, { MenuOption } from 'pages/Earns/components/DropdownMenu'
import { default as MultiSelectDropdownMenu } from 'pages/Earns/components/DropdownMenu/MultiSelect'
import { AllProtocolsOption } from 'pages/Earns/hooks/useSupportedDexesAndChains'
import { PositionFilter, PositionStatus } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

const POSITION_STATUS = [
  { label: <Trans>In Range</Trans>, value: PositionStatus.IN_RANGE },
  { label: <Trans>Out Range</Trans>, value: PositionStatus.OUT_RANGE },
  { label: <Trans>Closed Positions</Trans>, value: PositionStatus.CLOSED },
]

export default function Filter({
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
    if (filters.keyword !== deboundedSearch) {
      updateFilters('keyword', deboundedSearch || '')
    }
  }, [deboundedSearch, filters.keyword, updateFilters])

  useEffect(() => {
    if (searchParams.get('keyword') && !search) {
      setSearch(searchParams.get('keyword') || '')
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
    <div className={cn('flex items-center justify-between gap-2', upToSmall ? 'flex-col' : 'flex-row')}>
      <div className={cn('flex flex-wrap gap-2', upToSmall ? 'w-full' : 'w-auto')}>
        <DropdownMenu
          mobileFullWidth
          options={supportedDexes.length ? supportedDexes : [AllProtocolsOption]}
          value={filters.protocols || ''}
          onChange={value => value !== filters.protocols && updateFilters('protocols', value)}
        />
        <MultiSelectDropdownMenu
          mobileFullWidth
          showOnlyButton
          label={t`Position status`}
          options={POSITION_STATUS as unknown as MenuOption[]}
          value={filters.statuses || ''}
          onChange={value => value !== filters.statuses && updateFilters('statuses', value)}
        />
      </div>
      <Search
        placeholder={t`Search by token symbol or address`}
        searchValue={search}
        allowClear
        onSearch={val => setSearch(val)}
        style={{ height: '36px' }}
      />
    </div>
  )
}

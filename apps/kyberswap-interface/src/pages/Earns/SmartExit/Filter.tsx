import { useEffect } from 'react'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'

import DropdownMenu, { MenuOption } from 'pages/Earns/components/DropdownMenu'
import { AllChainsOption, AllProtocolsOption } from 'pages/Earns/hooks/useSupportedDexesAndChains'
import { SmartExitFilter } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'

import { OrderStatus } from './useSmartExitFilter'

const ORDER_STATUS = [
  { label: 'Active', value: OrderStatus.OrderStatusOpen },
  { label: 'Executed', value: OrderStatus.OrderStatusDone },
  { label: 'Expired', value: OrderStatus.OrderStatusExpired },
  { label: 'Cancelled', value: OrderStatus.OrderStatusCancelled },
]

export default function Filter({
  supportedChains,
  supportedDexes,
  filters,
  updateFilters,
}: {
  supportedChains: MenuOption[]
  supportedDexes: MenuOption[]
  filters: SmartExitFilter
  updateFilters: (key: keyof SmartExitFilter, value: string | number) => void
}) {
  // const [searchParams] = useSearchParams()
  // const [search, setSearch] = useState('')
  // const deboundedSearch = useDebounce(search, 300)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  // useEffect(() => {
  //   if (filters.q !== deboundedSearch) {
  //     updateFilters('q', deboundedSearch || '')
  //   }
  // }, [deboundedSearch, filters.q, updateFilters])

  // useEffect(() => {
  //   if (searchParams.get('q') && !search) {
  //     setSearch(searchParams.get('q') || '')
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [])

  useEffect(() => {
    if (
      filters.dexTypes &&
      supportedDexes.length &&
      !supportedDexes
        .map(item => item.value)
        .filter(Boolean)
        .includes(filters.dexTypes)
    ) {
      updateFilters('dexTypes', '')
    }
  }, [filters.dexTypes, supportedDexes, updateFilters])

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
          value={filters.dexTypes || ''}
          options={supportedDexes.length ? supportedDexes : [AllProtocolsOption]}
          onChange={value => value !== filters.dexTypes && updateFilters('dexTypes', value)}
        />
        <DropdownMenu
          alignLeft
          mobileFullWidth
          options={ORDER_STATUS}
          value={filters.status || ''}
          onChange={value => {
            console.log(value)
            value !== filters.status && updateFilters('status', value)
          }}
        />
      </Flex>
    </Flex>
  )
}

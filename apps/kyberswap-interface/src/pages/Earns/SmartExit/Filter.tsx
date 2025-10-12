import { ChainId } from '@kyberswap/ks-sdk-core'
import { useEffect } from 'react'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'

import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import DropdownMenu from 'pages/Earns/components/DropdownMenu'
import { AllChainsOption } from 'pages/Earns/hooks/useSupportedDexesAndChains'
import { SmartExitFilter } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'

import { DexType, OrderStatus } from './useSmartExitFilter'

const ORDER_STATUS = [
  { label: 'All Status', value: '' },
  { label: 'Active', value: OrderStatus.OrderStatusOpen },
  { label: 'Executed', value: OrderStatus.OrderStatusDone },
  { label: 'Expired', value: OrderStatus.OrderStatusExpired },
  { label: 'Cancelled', value: OrderStatus.OrderStatusCancelled },
]

const SUPPORTED_CHAINS = [ChainId.BSCMAINNET, ChainId.BASE].map(chainId => ({
  label: NETWORKS_INFO[chainId].name,
  value: chainId.toString(),
  icon: NETWORKS_INFO[chainId].icon,
}))

const SUPPORTED_PROTOCOLS = [
  { label: 'All Protocols', value: '' },
  { label: 'Uniswap V3', value: DexType.DexTypeUniswapV3 },
  { label: 'Uniswap V4', value: DexType.DexTypeUniswapV4 },
  { label: 'Uniswap V4 FairFlow', value: DexType.DexTypeUniswapV4FairFlow },
  { label: 'PancakeSwap V3', value: DexType.DexTypePancakeV3 },
]

export default function Filter({
  filters,
  updateFilters,
}: {
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
      !SUPPORTED_PROTOCOLS.slice(1)
        .map(item => item.value)
        .filter(Boolean)
        .includes(filters.dexTypes)
    ) {
      updateFilters('dexTypes', '')
    }
  }, [filters.dexTypes, updateFilters])

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
          options={[AllChainsOption, ...SUPPORTED_CHAINS]}
          onChange={value => value !== filters.chainIds && updateFilters('chainIds', value)}
        />
        <DropdownMenu
          alignLeft
          mobileHalfWidth
          value={filters.dexTypes || ''}
          options={SUPPORTED_PROTOCOLS}
          onChange={value => value !== filters.dexTypes && updateFilters('dexTypes', value)}
        />
        <DropdownMenu
          alignLeft
          mobileFullWidth
          options={ORDER_STATUS}
          value={filters.status || ''}
          onChange={value => {
            value !== filters.status && updateFilters('status', value)
          }}
        />
      </Flex>
    </Flex>
  )
}

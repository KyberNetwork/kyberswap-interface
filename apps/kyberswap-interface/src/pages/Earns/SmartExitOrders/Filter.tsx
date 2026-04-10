import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo } from 'react'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'

import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import DropdownMenu from 'pages/Earns/components/DropdownMenu'
import { EARN_CHAINS, EARN_DEXES } from 'pages/Earns/constants'
import { AllChainsOption, AllProtocolsOption } from 'pages/Earns/hooks/useSupportedDexesAndChains'
import { OrderStatus, SmartExitFilter } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'

const ORDER_STATUS = [
  { label: 'All Status', value: '' },
  { label: 'Active', value: OrderStatus.OrderStatusOpen },
  { label: 'Executed', value: OrderStatus.OrderStatusDone },
  { label: 'Expired', value: OrderStatus.OrderStatusExpired },
  { label: 'Cancelled', value: OrderStatus.OrderStatusCancelled },
]

const supportedChains = Object.entries(EARN_CHAINS)
  .filter(([_, chainInfo]) => chainInfo.smartExitSupported)
  .map(([chainId, chainInfo]) => ({
    label: NETWORKS_INFO[Number(chainId) as ChainId].name,
    value: chainId,
    icon: chainInfo.logo,
  }))

const supportedDexes = Object.entries(EARN_DEXES)
  .filter(([_, dexInfo]) => dexInfo.smartExitDexType)
  .map(([_, dexInfo]) => ({
    label: dexInfo.name,
    value: dexInfo.smartExitDexType as string,
    icon: dexInfo.logo,
  }))

export default function Filter({
  filters,
  updateFilters,
}: {
  filters: SmartExitFilter
  updateFilters: (key: keyof SmartExitFilter, value: string | number) => void
}) {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const chainOptions = useMemo(() => [AllChainsOption, ...supportedChains], [])
  const dexOptions = useMemo(() => [AllProtocolsOption, ...supportedDexes], [])

  const handleChainChange = useCallback(
    (value: string | number) => {
      const stringValue = String(value)
      if (stringValue !== filters.chainIds) {
        updateFilters('chainIds', stringValue)
      }
    },
    [filters.chainIds, updateFilters],
  )

  const handleDexChange = useCallback(
    (value: string | number) => {
      const stringValue = String(value)
      if (stringValue !== filters.dexTypes) {
        updateFilters('dexTypes', stringValue)
      }
    },
    [filters.dexTypes, updateFilters],
  )

  const handleStatusChange = useCallback(
    (value: string | number) => {
      const stringValue = String(value)
      if (stringValue !== filters.status) {
        updateFilters('status', stringValue)
      }
    },
    [filters.status, updateFilters],
  )

  useEffect(() => {
    if (
      filters.dexTypes &&
      !supportedDexes
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
          options={chainOptions}
          onChange={handleChainChange}
        />
        <DropdownMenu
          alignLeft
          mobileHalfWidth
          value={filters.dexTypes || ''}
          options={dexOptions}
          onChange={handleDexChange}
        />
        <DropdownMenu
          alignLeft
          mobileFullWidth
          options={ORDER_STATUS}
          value={filters.status || ''}
          onChange={handleStatusChange}
        />
      </Flex>
    </Flex>
  )
}

import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo } from 'react'
import { useMedia } from 'react-use'

import DropdownMenu from 'components/DropdownMenu'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { EARN_CHAINS, EARN_DEXES } from 'pages/Earns/constants'
import { AllChainsOption, AllProtocolsOption } from 'pages/Earns/hooks/useSupportedDexesAndChains'
import { OrderStatus, SmartExitFilter } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

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
    <div className={cn('flex items-center justify-between gap-2', upToSmall ? 'flex-col' : 'flex-row')}>
      <div className={cn('flex flex-wrap gap-2', upToSmall ? 'w-full' : 'w-auto')}>
        <DropdownMenu
          mobileHalfWidth
          value={filters.chainIds || ''}
          options={chainOptions}
          onChange={handleChainChange}
        />
        <DropdownMenu mobileHalfWidth value={filters.dexTypes || ''} options={dexOptions} onChange={handleDexChange} />
        <DropdownMenu
          mobileFullWidth
          options={ORDER_STATUS}
          value={filters.status || ''}
          onChange={handleStatusChange}
        />
      </div>
    </div>
  )
}

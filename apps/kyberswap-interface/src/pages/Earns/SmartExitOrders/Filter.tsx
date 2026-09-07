import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect } from 'react'

import DropdownMenu from 'components/DropdownMenu'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { EARN_CHAINS, EARN_DEXES } from 'pages/Earns/constants'
import { AllChainsOption, AllProtocolsOption } from 'pages/Earns/hooks/useSupportedDexesAndChains'
import { OrderStatus, SmartExitFilter } from 'pages/Earns/types'

const ORDER_STATUS = [
  { label: 'All Status', value: '' },
  { label: 'Active', value: OrderStatus.OrderStatusOpen },
  { label: 'Executed', value: OrderStatus.OrderStatusDone },
  { label: 'Expired', value: OrderStatus.OrderStatusExpired },
  { label: 'Cancelled', value: OrderStatus.OrderStatusCancelled },
]

const SUPPORTED_CHAINS = Object.entries(EARN_CHAINS)
  .filter(([_, chainInfo]) => chainInfo.smartExitSupported)
  .map(([chainId, chainInfo]) => ({
    label: NETWORKS_INFO[Number(chainId) as ChainId].name,
    value: chainId,
    icon: chainInfo.logo,
  }))

const SUPPORTED_DEXES = Object.entries(EARN_DEXES)
  .filter(([_, dexInfo]) => dexInfo.smartExitDexType)
  .map(([_, dexInfo]) => ({
    label: dexInfo.name,
    value: dexInfo.smartExitDexType as string,
    icon: dexInfo.logo,
  }))

const CHAIN_OPTIONS = [AllChainsOption, ...SUPPORTED_CHAINS]
const DEX_OPTIONS = [AllProtocolsOption, ...SUPPORTED_DEXES]

export default function Filter({
  filters,
  updateFilters,
}: {
  filters: SmartExitFilter
  updateFilters: (key: keyof SmartExitFilter, value: string | number) => void
}) {
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
      !SUPPORTED_DEXES.map(item => item.value)
        .filter(Boolean)
        .includes(filters.dexTypes)
    ) {
      updateFilters('dexTypes', '')
    }
  }, [filters.dexTypes, updateFilters])

  return (
    <div className="flex flex-wrap gap-4 max-sm:w-full max-sm:gap-3">
      <div className="contents max-sm:flex max-sm:w-full max-sm:gap-2">
        <DropdownMenu
          mobileHalfWidth
          value={filters.chainIds || ''}
          options={CHAIN_OPTIONS}
          onChange={handleChainChange}
        />
        <DropdownMenu mobileHalfWidth value={filters.dexTypes || ''} options={DEX_OPTIONS} onChange={handleDexChange} />
      </div>
      <DropdownMenu mobileFullWidth options={ORDER_STATUS} value={filters.status || ''} onChange={handleStatusChange} />
    </div>
  )
}

import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export enum FarmType {
  All = 'all',
  Kyber = 'kyber',
  Joint = 'joint',
  Partner = 'partner',
  MyFarm = 'my_farm',
}

export enum ProtocolType {
  All = 'all',
  Dynamic = 'dynamic',
  Static = 'static',
  Classic = 'classic',
}

interface FarmFilter {
  farmType: FarmType
  protocolType: ProtocolType
}

interface SetFilterParams {
  farmType?: FarmType | undefined
  protocolType?: ProtocolType | undefined
}

export default function useFarmFilters(): [FarmFilter, (filters: SetFilterParams) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const farmTypeUrl = searchParams.get('farmType')
  const protocolTypeUrl = searchParams.get('farmType')
  const farmType: FarmType = Object.values(FarmType).includes(farmTypeUrl) ? farmTypeUrl : FarmType.All
  const protocolType: ProtocolType = Object.values(ProtocolType).includes(protocolTypeUrl)
    ? protocolTypeUrl
    : ProtocolType.All

  const setFarmFilters = useCallback(
    (filters: SetFilterParams) => {
      Object.keys(filters).forEach(key => {
        searchParams.set(key, (filters as any)[key] || '')
      })

      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams],
  )

  return [
    {
      farmType,
      protocolType,
    },
    setFarmFilters,
  ]
}

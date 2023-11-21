import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { MAINNET_NETWORKS } from 'constants/networks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { chainIdByRoute } from 'pages/MyEarnings/utils'

export enum FarmType {
  All = 'all',
  Kyber = 'kyber',
  Joint = 'joint',
  Partner = 'partner',
  MyFarm = 'mine',
}

export enum ProtocolType {
  All = 'all',
  Dynamic = 'dynamic',
  Static = 'static',
  Classic = 'classic',
}

export enum FarmStatus {
  Active = 'active',
  Ended = 'ended',
}

interface FarmFilter {
  type: FarmType
  protocol: ProtocolType
  chainNames: string
  chainIds: ChainId[]
  search: string
  page: number
  perPage: number
  status: FarmStatus
}

interface SetFilterParams {
  type?: FarmType
  protocol?: ProtocolType
  chainIds?: ChainId[]
  search?: string
  page?: number
  perPage?: number
  status?: FarmStatus
}

export default function useFarmFilters(): [FarmFilter, (filters: SetFilterParams) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFromUrl = searchParams.get('status') || ''
  const search = searchParams.get('search') || ''
  const pageFromUrl = searchParams.get('page') || '1'
  const perPageFromUrl = searchParams.get('perPage') || '10'
  const page = Number.isNaN(+pageFromUrl) ? 1 : +pageFromUrl
  const perPage = Number.isNaN(+perPageFromUrl) ? 10 : +perPageFromUrl

  const farmTypeUrl = searchParams.get('type')
  const protocolTypeUrl = searchParams.get('protocol')
  const type: FarmType = Object.values(FarmType).includes(farmTypeUrl) ? farmTypeUrl : FarmType.All
  const protocol: ProtocolType = Object.values(ProtocolType).includes(protocolTypeUrl)
    ? protocolTypeUrl
    : ProtocolType.All

  const status = Object.values(FarmStatus).includes(statusFromUrl) ? statusFromUrl : FarmStatus.Active

  const chainFromUrl = searchParams.get('chainNames') || ''

  const chainIds = useMemo(() => {
    const temp = chainFromUrl
      .split(',')
      .map(item => chainIdByRoute[item])
      .filter(Boolean)

    if (!temp.length) return [...MAINNET_NETWORKS]
    return temp
  }, [chainFromUrl])

  const chainNames = useMemo(() => {
    return chainIds.map(item => NETWORKS_INFO[item].aggregatorRoute).join(',')
  }, [chainIds])

  const setFarmFilters = useCallback(
    (filters: SetFilterParams) => {
      Object.keys(filters).forEach(key => {
        if (key === 'chainIds') {
          const chainIds = filters[key]
          if (chainIds?.length) {
            searchParams.set('chainNames', chainIds.map(item => NETWORKS_INFO[item].aggregatorRoute).join(','))
          }
        } else searchParams.set(key, (filters as any)[key] || '')
      })

      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams],
  )

  return [
    {
      type,
      protocol,
      chainIds,
      chainNames,
      search,
      page,
      perPage,
      status,
    },
    setFarmFilters,
  ]
}

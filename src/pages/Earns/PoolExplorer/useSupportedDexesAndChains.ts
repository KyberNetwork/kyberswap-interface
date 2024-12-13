import { useMemo } from 'react'
import { useGetDexListQuery } from 'services/ksSetting'
import { QueryParams, useSupportedProtocolsQuery } from 'services/zapEarn'

import { NETWORKS_INFO } from 'constants/networks'
import useChainsConfig from 'hooks/useChainsConfig'

const useSupportedDexesAndChains = (filters: QueryParams) => {
  const { supportedChains } = useChainsConfig()
  const dexList = useGetDexListQuery({
    chainId: NETWORKS_INFO[filters.chainId].ksSettingRoute,
  })
  const { data: supportedProtocols } = useSupportedProtocolsQuery()

  const supportedDexes = useMemo(() => {
    if (!supportedProtocols?.data?.chains) return []
    const parsedProtocols =
      supportedProtocols.data.chains[filters.chainId]?.protocols?.map(item => ({
        label: (dexList?.data?.find(dex => dex.dexId === item.id)?.name || item.name).replaceAll('-', ' '),
        value: item.id,
      })) || []
    return [{ label: 'All Protocols', value: '' }].concat(parsedProtocols)
  }, [filters.chainId, supportedProtocols, dexList])

  const chains = useMemo(
    () =>
      supportedChains
        .map(chain => ({
          label: chain.name,
          value: chain.chainId,
          icon: chain.icon,
        }))
        .filter(chain => supportedProtocols?.data?.chains?.[chain.value]),
    [supportedChains, supportedProtocols],
  )

  return { supportedDexes, supportedChains: chains }
}

export default useSupportedDexesAndChains

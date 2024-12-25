import { useMemo } from 'react'
import { useGetDexListQuery } from 'services/ksSetting'
import { QueryParams, useSupportedProtocolsQuery } from 'services/zapEarn'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useChainsConfig from 'hooks/useChainsConfig'

const useSupportedDexesAndChains = (filters?: QueryParams) => {
  const { chainId: currentChainId } = useActiveWeb3React()
  const { supportedChains } = useChainsConfig()
  const { data: supportedProtocols } = useSupportedProtocolsQuery()

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

  const chainId =
    filters?.chainId || (chains.some(chain => chain.value === currentChainId) ? currentChainId : chains[0]?.value)

  const dexList = useGetDexListQuery({
    chainId: NETWORKS_INFO[chainId].ksSettingRoute,
  })

  const supportedDexes = useMemo(() => {
    if (!supportedProtocols?.data?.chains) return []
    const parsedProtocols =
      supportedProtocols.data.chains[chainId]?.protocols?.map(item => ({
        label: (dexList?.data?.find(dex => dex.dexId === item.id)?.name || item.name).replaceAll('-', ' '),
        value: item.id,
      })) || []
    return [{ label: 'All Protocols', value: '' }].concat(parsedProtocols)
  }, [chainId, supportedProtocols, dexList])

  return { supportedDexes, supportedChains: chains }
}

export default useSupportedDexesAndChains

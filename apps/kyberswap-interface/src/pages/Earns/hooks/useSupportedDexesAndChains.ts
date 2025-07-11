import { useMemo } from 'react'
import { PoolQueryParams, useSupportedProtocolsQuery } from 'services/zapEarn'

import useChainsConfig from 'hooks/useChainsConfig'
import { MenuOption } from 'pages/Earns/components/DropdownMenu'
import { earnSupportedChains, earnSupportedProtocols } from 'pages/Earns/constants'
import { PositionFilter } from 'pages/Earns/types'

export const AllChainsOption = { label: 'All Chains', value: '' }
export const AllProtocolsOption = { label: 'All Protocols', value: '' }

const useSupportedDexesAndChains = (filters: PoolQueryParams | PositionFilter) => {
  const { supportedChains } = useChainsConfig()
  const { data: supportedProtocols } = useSupportedProtocolsQuery()

  const chains = useMemo(() => {
    const parsedChains = supportedChains
      .map(chain => ({
        label: chain.name,
        value: chain.chainId.toString(),
        icon: chain.icon,
      }))
      .filter(
        chain => supportedProtocols?.data?.chains?.[chain.value] && earnSupportedChains.includes(Number(chain.value)),
      )

    const allowAllChains = 'chainIds' in filters
    return allowAllChains ? [AllChainsOption].concat(parsedChains) : parsedChains
  }, [filters, supportedChains, supportedProtocols?.data?.chains])

  const selectedChainId = useMemo(() => {
    if ('chainId' in filters) return filters.chainId || chains[0]?.value
    else if ('chainIds' in filters) return filters.chainIds

    return ''
  }, [chains, filters])

  const supportedDexes = useMemo(() => {
    if (!supportedProtocols?.data?.chains) return []

    let parsedProtocols: MenuOption[] = []

    if (selectedChainId)
      parsedProtocols =
        supportedProtocols.data.chains[selectedChainId]?.protocols?.map(item => ({
          label: item.name,
          value: item.id.toString(),
        })) || []
    else
      Object.keys(supportedProtocols.data.chains)
        .map(chain => supportedProtocols.data.chains[chain].protocols)
        .reduce((a, b) => a.concat(b), [])
        .map(item => ({
          label: item.name,
          value: item.id.toString(),
        }))
        .forEach(item => {
          if (!parsedProtocols.some(protocol => protocol.value === item.value)) parsedProtocols.push(item)
        })

    parsedProtocols = parsedProtocols.filter(protocol => earnSupportedProtocols.includes(protocol.label))
    return [AllProtocolsOption].concat(parsedProtocols)
  }, [selectedChainId, supportedProtocols])

  return { supportedDexes, supportedChains: chains }
}

export default useSupportedDexesAndChains

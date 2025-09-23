import { useMemo } from 'react'
import { PoolQueryParams, useSupportedProtocolsQuery } from 'services/zapEarn'

import useChainsConfig from 'hooks/useChainsConfig'
import { MenuOption } from 'pages/Earns/components/DropdownMenu'
import { EarnDex, earnSupportedChains, earnSupportedProtocols } from 'pages/Earns/constants'
import { PositionFilter } from 'pages/Earns/types'

export const AllChainsOption = { label: 'All Chains', value: '' }
export const AllProtocolsOption = { label: 'All Protocols', value: '' }

const CHAIN_PRIORITY_ORDER = [
  '1', // Ethereum
  '56', // BNB Chain
  '8453', // Base
  '42161', // Arbitrum
  '10', // Optimism
  '137', // Polygon PoS
]

const DEX_PRIORITY_ORDER = [
  EarnDex.DEX_UNISWAP_V4,
  EarnDex.DEX_UNISWAP_V4_FAIRFLOW,
  EarnDex.DEX_UNISWAPV3,
  EarnDex.DEX_UNISWAPV2,
  EarnDex.DEX_PANCAKESWAPV3,
  EarnDex.DEX_SUSHISWAPV3,
  EarnDex.DEX_QUICKSWAPV3ALGEBRA,
]

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
      .sort((a, b) => {
        const aIndex = CHAIN_PRIORITY_ORDER.indexOf(a.value)
        const bIndex = CHAIN_PRIORITY_ORDER.indexOf(b.value)

        // If both chains are in priority order, sort by their priority
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
        // If only one chain is in priority order, prioritize it
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        // If neither chain is in priority order, sort alphabetically
        return a.label.localeCompare(b.label)
      })

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

    parsedProtocols = parsedProtocols
      .filter(protocol => earnSupportedProtocols.includes(protocol.label))
      .sort((a, b) => {
        const aIndex = DEX_PRIORITY_ORDER.indexOf(a.label as EarnDex)
        const bIndex = DEX_PRIORITY_ORDER.indexOf(b.label as EarnDex)

        // If both DEXes are in priority order, sort by their priority
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
        // If only one DEX is in priority order, prioritize it
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        // If neither DEX is in priority order, sort alphabetically
        return a.label.localeCompare(b.label)
      })

    return [AllProtocolsOption].concat(parsedProtocols)
  }, [selectedChainId, supportedProtocols])

  return { supportedDexes, supportedChains: chains }
}

export default useSupportedDexesAndChains

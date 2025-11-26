import { useMemo } from 'react'
import { PoolQueryParams, useSupportedProtocolsQuery } from 'services/zapEarn'

import useChainsConfig from 'hooks/useChainsConfig'
import { MenuOption } from 'pages/Earns/components/DropdownMenu'
import { EARN_CHAINS, EARN_DEXES, EarnChain, Exchange } from 'pages/Earns/constants'
import { PositionFilter } from 'pages/Earns/types'

export const AllChainsOption: MenuOption = { label: 'All Chains', value: '' }
export const AllProtocolsOption: MenuOption = { label: 'All Protocols', value: '' }

const CHAIN_PRIORITY_ORDER = [
  EarnChain.MAINNET,
  EarnChain.BASE,
  EarnChain.BSC,
  EarnChain.ARBITRUM,
  EarnChain.OPTIMISM,
  EarnChain.MATIC,
  EarnChain.AVAX,
  EarnChain.BERA,
]

const DEX_PRIORITY_ORDER = [
  Exchange.DEX_UNISWAP_V4_FAIRFLOW,
  Exchange.DEX_UNISWAP_V4,
  Exchange.DEX_PANCAKE_INFINITY_CL_FAIRFLOW,
  Exchange.DEX_PANCAKE_INFINITY_CL,
  Exchange.DEX_UNISWAPV3,
  Exchange.DEX_PANCAKESWAPV3,
  Exchange.DEX_SUSHISWAPV3,
  Exchange.DEX_QUICKSWAPV3ALGEBRA,
  Exchange.DEX_CAMELOTV3,
  Exchange.DEX_THENAFUSION,
  Exchange.DEX_KODIAK_V3,
  Exchange.DEX_UNISWAPV2,
]

const useSupportedDexesAndChains = (
  filters: PoolQueryParams | PositionFilter,
): { supportedDexes: MenuOption[]; supportedChains: MenuOption[] } => {
  const { supportedChains } = useChainsConfig()
  const { data: supportedProtocols } = useSupportedProtocolsQuery()

  const chains = useMemo(() => {
    const parsedChains = supportedChains
      .map(chain => ({
        label: chain.name,
        value: chain.chainId.toString(),
        icon: chain.icon,
      }))
      .filter(chain => supportedProtocols?.data?.chains?.[chain.value] && EARN_CHAINS[Number(chain.value) as EarnChain])
      .sort((a, b) => {
        const aIndex = CHAIN_PRIORITY_ORDER.indexOf(Number(a.value))
        const bIndex = CHAIN_PRIORITY_ORDER.indexOf(Number(b.value))

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

  const selectedChainIds = useMemo(() => {
    if ('chainId' in filters) return [filters.chainId || chains[0]?.value].filter(Boolean)
    if ('chainIds' in filters) return filters.chainIds?.split(',').filter(Boolean)

    return []
  }, [chains, filters])

  const supportedDexes = useMemo(() => {
    if (!supportedProtocols?.data?.chains) return []

    let parsedProtocols: MenuOption[] = []

    if (selectedChainIds?.length)
      selectedChainIds.forEach(chainId => {
        const protocols =
          supportedProtocols.data.chains[chainId]?.protocols?.map(item => ({
            label: item.name,
            value: item.id.toString(),
          })) || []
        protocols.forEach(item => {
          if (!parsedProtocols.some(protocol => protocol.value === item.value)) parsedProtocols.push(item)
        })
      })
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
      .filter(protocol => EARN_DEXES[protocol.value as Exchange])
      .sort((a, b) => {
        const aIndex = DEX_PRIORITY_ORDER.indexOf(a.value as Exchange)
        const bIndex = DEX_PRIORITY_ORDER.indexOf(b.value as Exchange)

        // If both DEXes are in priority order, sort by their priority
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
        // If only one DEX is in priority order, prioritize it
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        // If neither DEX is in priority order, sort alphabetically
        return a.label.localeCompare(b.label)
      })

    return [AllProtocolsOption].concat(parsedProtocols)
  }, [selectedChainIds, supportedProtocols])

  return { supportedDexes, supportedChains: chains }
}

export default useSupportedDexesAndChains

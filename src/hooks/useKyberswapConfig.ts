import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { ethers } from 'ethers'
import { useEffect, useMemo, useState } from 'react'
import {
  KyberswapConfigurationResponse,
  useGetKyberswapConfigurationQuery,
  useGetKyberswapGlobalConfigurationQuery,
  useLazyGetKyberswapConfigurationQuery,
} from 'services/ksSetting'

import { NETWORKS_INFO, SUPPORTED_NETWORKS, isEVM } from 'constants/networks'
import ethereumInfo from 'constants/networks/ethereum'
import { useActiveWeb3React } from 'hooks'
import { createClient } from 'utils/client'

type KyberswapConfig = {
  prochart: boolean
  rpc: string
  blockClient: ApolloClient<NormalizedCacheObject>
  classicClient: ApolloClient<NormalizedCacheObject>
  elasticClient: ApolloClient<NormalizedCacheObject>
  provider: ethers.providers.JsonRpcProvider
}

const convertConfig = (
  data: KyberswapConfigurationResponse['data'] | undefined,
  defaultChainId: ChainId,
): KyberswapConfig => {
  const rpc = isEVM(defaultChainId)
    ? data?.rpc ?? NETWORKS_INFO[defaultChainId].defaultRpcUrl
    : ethereumInfo.defaultRpcUrl
  return {
    prochart: data?.prochart ?? false,
    rpc,
    blockClient: isEVM(defaultChainId)
      ? createClient(data?.['block-subgraph'] ?? NETWORKS_INFO[defaultChainId].blockDefaultSubgraph)
      : createClient(ethereumInfo.blockDefaultSubgraph),
    classicClient: isEVM(defaultChainId)
      ? createClient(data?.['classic-subgraph'] ?? NETWORKS_INFO[defaultChainId].classic.defaultSubgraph)
      : createClient(ethereumInfo.classic.defaultSubgraph),
    elasticClient: isEVM(defaultChainId)
      ? createClient(data?.['elastic-subgraph'] ?? NETWORKS_INFO[defaultChainId].elastic.defaultSubgraph)
      : createClient(ethereumInfo.elastic.defaultSubgraph),
    provider: new ethers.providers.JsonRpcProvider(rpc),
  }
}
export const useKyberswapConfig = (customChainId?: ChainId): KyberswapConfig => {
  const { chainId } = useActiveWeb3React()
  const { data } = useGetKyberswapConfigurationQuery({ chainId: customChainId ?? chainId })
  const result = useMemo(() => convertConfig(data?.data, chainId), [chainId, data?.data])
  return result
}

export const useKyberswapGlobalConfig = () => {
  const { data } = useGetKyberswapGlobalConfigurationQuery(undefined)
  return { banner: data?.data?.banner ?? [] }
}

export const useAllKyberswapConfig = (): {
  [chain in ChainId]: KyberswapConfig
} => {
  const [allKyberswapConfig, setAllKyberswapConfig] = useState<
    | {
        [chain in ChainId]: KyberswapConfig
      }
    | null
  >(null)
  const [getKyberswapConfiguration] = useLazyGetKyberswapConfigurationQuery()

  useEffect(() => {
    const run = async () => {
      const fetches = SUPPORTED_NETWORKS.map(async chainId => {
        try {
          const result = (await getKyberswapConfiguration({ chainId }))?.data?.data
          return {
            chainId,
            result: convertConfig(result, chainId),
          }
        } catch {
          return {
            chainId,
            result: convertConfig(undefined, chainId),
          }
        }
      })
      const results = await Promise.all(fetches)
      setAllKyberswapConfig(
        results.reduce(
          (acc, cur) => {
            acc[cur.chainId] = cur.result
            return acc
          },
          {} as {
            [chainId in ChainId]: KyberswapConfig
          },
        ),
      )
    }
    run()
  }, [getKyberswapConfiguration])

  const defaultConfig = useMemo(
    () =>
      SUPPORTED_NETWORKS.reduce(
        (acc, cur) => {
          acc[cur] = convertConfig(undefined, cur)
          return acc
        },
        {} as {
          [chainId in ChainId]: KyberswapConfig
        },
      ),
    [],
  )

  return allKyberswapConfig ?? defaultConfig
}

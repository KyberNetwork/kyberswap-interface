import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { KyberswapGlobalConfigurationResponse, useGetKyberswapGlobalConfigurationQuery } from 'services/ksSetting'

import { AGGREGATOR_API } from 'constants/env'
import { NETWORKS_INFO } from 'constants/networks'
import { ChainStateMap } from 'hooks/useChainsConfig'
import { AppState } from 'state'

type KyberswapGlobalConfig = {
  aggregatorDomain: string
  aggregatorAPI: string
  isEnableAuthenAggregator: boolean
  chainStates: ChainStateMap
}

const parseGlobalResponse = (
  responseData: KyberswapGlobalConfigurationResponse | undefined,
  chainId: ChainId,
): KyberswapGlobalConfig => {
  const data = responseData?.data?.config
  const aggregatorDomain = data?.aggregator ?? AGGREGATOR_API
  const isEnableAuthenAggregator = !!data?.isEnableAuthenAggregator
  return {
    chainStates: data?.chainStates || ({} as ChainStateMap),
    aggregatorDomain,
    aggregatorAPI: `${aggregatorDomain}/${NETWORKS_INFO[chainId].aggregatorRoute}/route/encode`,
    isEnableAuthenAggregator,
  }
}
export const useKyberswapGlobalConfig = () => {
  const chainId = useSelector<AppState, ChainId>(state => state.user.chainId) || ChainId.MAINNET // read directly from store instead of useActiveWeb3React to prevent circular loop
  const { data } = useGetKyberswapGlobalConfigurationQuery(undefined)
  const result = useMemo(() => parseGlobalResponse(data, chainId), [data, chainId])
  return result
}

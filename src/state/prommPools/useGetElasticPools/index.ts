import { ChainId } from '@kyberswap/ks-sdk-core'

import { useKyberSwapConfig } from 'state/application/hooks'

import { CommonReturn } from './type'
import useGetElasticPoolsV1 from './useGetElasticPoolsV1'
import useGetElasticPoolsV2 from './useGetElasticPoolsV2'

const useGetElasticPools = (poolAddresses: string[], customChainId?: ChainId): CommonReturn => {
  const { isEnableKNProtocol } = useKyberSwapConfig(customChainId)

  const responseV1 = useGetElasticPoolsV1(poolAddresses)
  const responseV2 = useGetElasticPoolsV2()

  if (isEnableKNProtocol) {
    return responseV2
  }

  return responseV1
}

export default useGetElasticPools

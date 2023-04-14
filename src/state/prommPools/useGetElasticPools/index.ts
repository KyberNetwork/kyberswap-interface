import { useKyberSwapConfig } from 'state/application/hooks'
import { ElasticPoolDetail } from 'types/pool'

import useGetElasticPoolsV1 from './useGetElasticPoolsV1'
import useGetElasticPoolsV2 from './useGetElasticPoolsV2'

export type CommonReturn = {
  isLoading: boolean
  isError: boolean
  data?: {
    [address: string]: ElasticPoolDetail
  }
}

const useGetElasticPools = (poolAddresses: string[]): CommonReturn => {
  const { isEnableKNProtocol } = useKyberSwapConfig()

  const responseV1 = useGetElasticPoolsV1(poolAddresses)
  const responseV2 = useGetElasticPoolsV2()

  return isEnableKNProtocol ? responseV2 : responseV1
}

export default useGetElasticPools

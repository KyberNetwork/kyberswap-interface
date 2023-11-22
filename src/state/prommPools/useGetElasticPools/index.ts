import { useGetAllPoolsQuery } from 'services/knprotocol'

import { isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useKyberSwapConfig } from 'state/application/hooks'
import { ElasticPoolDetail } from 'types/pool'

import { CommonReturn } from './type'
import useGetElasticPoolsV1 from './useGetElasticPoolsV1'

const useGetElasticPools = (poolAddresses: string[]): CommonReturn => {
  const { chainId } = useActiveWeb3React()
  const { isEnableKNProtocol } = useKyberSwapConfig()

  const responseV1 = useGetElasticPoolsV1(poolAddresses)

  const { currentData, error, isLoading } = useGetAllPoolsQuery({
    chainIds: isEVM(chainId) ? [chainId] : [],
    page: 1,
    size: 10000,
    protocol: 'elastic',
  })

  if (isEnableKNProtocol) {
    return {
      isLoading: isLoading,
      isError: !!error,
      data: currentData?.pools as
        | {
            [address: string]: ElasticPoolDetail
          }
        | undefined,
    }
  }

  return responseV1
}

export default useGetElasticPools

import { useGetAllPoolsQuery } from 'services/knprotocol'

import { isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useKyberSwapConfig } from 'state/application/hooks'

import { CommonReturn } from './type'
import useGetElasticPoolsV1 from './useGetElasticPoolsV1'

const useGetElasticPools = (
  poolAddresses: string[],
  // page: number, size: number
): CommonReturn => {
  const { chainId } = useActiveWeb3React()
  const { isEnableKNProtocol } = useKyberSwapConfig()

  const responseV1 = useGetElasticPoolsV1(poolAddresses)

  const { currentData, error, isLoading } = useGetAllPoolsQuery({
    chainIds: isEVM(chainId) ? [chainId] : [],
    search: '',
    page: 1,
    size: 1000,
  })

  if (isEnableKNProtocol) {
    return {
      isLoading: isLoading,
      isError: !!error,
      data: currentData,
    }
  }

  return responseV1
}

export default useGetElasticPools

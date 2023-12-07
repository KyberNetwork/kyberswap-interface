import { useKyberSwapConfig } from 'state/application/hooks'
import { useGetClassicPoolsSubgraph } from 'state/pools/hooks'

import { CommonReturn } from './type'
import useGetClassicPoolsKN from './useGetClassicPoolsKN'

const useGetClassicPools = (): CommonReturn => {
  const { isEnableKNProtocol } = useKyberSwapConfig()
  const responseSubgraph = useGetClassicPoolsSubgraph()
  const responseKN = useGetClassicPoolsKN()

  if (isEnableKNProtocol) {
    return responseKN
  }

  return responseSubgraph
}

export default useGetClassicPools

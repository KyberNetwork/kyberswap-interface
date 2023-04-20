import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback } from 'react'
import routeApi from 'services/route'

import { CHAINS_SUPPORT_FEE_CONFIGS, ETHER_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useKyberswapGlobalConfig } from 'hooks/useKyberSwapConfig'
import { getTokenScore as getTokenScoreFromLocal, saveTokenScore } from 'utils/tokenScore'

export type TokenScoreByChainId = Record<
  ChainId,
  Record<
    string /* token0-token1 */,
    {
      tokenToTakeFee: string
      feePercent: number
      savedAt: number
    }
  >
>

const useGetTokenFeeScore = () => {
  const { aggregatorDomain, isEnableAuthenAggregator } = useKyberswapGlobalConfig()

  const [triggerGetTokenScoreQuery] = routeApi.useLazyGetTokenScoreQuery()

  const getTokenScore = useCallback(
    async (chainId: ChainId, tokenIn: string, tokenOut: string) => {
      const now = Math.floor(Date.now() / 1000)

      // TODO: check applicable chains
      if (!CHAINS_SUPPORT_FEE_CONFIGS.includes(chainId)) {
        return {
          tokenToTakeFee: '',
          feePercent: 0,
        }
      }

      const storedTokenScore = getTokenScoreFromLocal(chainId, tokenIn, tokenOut)
      if (storedTokenScore && now - storedTokenScore.savedAt < 86400) {
        const { tokenToTakeFee, feePercent } = storedTokenScore
        return {
          tokenToTakeFee,
          feePercent,
        }
      }

      const { data, isError } = await triggerGetTokenScoreQuery({
        url: `${aggregatorDomain}/${NETWORKS_INFO[chainId].aggregatorRoute}/api/v1/routes`,
        params: {
          chainId,
          tokenIn: ETHER_ADDRESS,
          tokenOut: '0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202',
        },
        authentication: isEnableAuthenAggregator,
      })

      if (isError || !data?.data) {
        return {
          tokenToTakeFee: tokenIn,
          feePercent: 30,
        }
      }

      saveTokenScore(chainId, tokenIn, tokenOut, data.data.tokenToTakeFee, data.data.feePercent)

      return data.data
    },
    [aggregatorDomain, isEnableAuthenAggregator, triggerGetTokenScoreQuery],
  )

  return getTokenScore
}

export default useGetTokenFeeScore

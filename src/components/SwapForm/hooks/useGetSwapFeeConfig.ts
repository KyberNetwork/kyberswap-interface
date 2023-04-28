import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback } from 'react'
import tokenApi from 'services/token'

import { CHAINS_SUPPORT_FEE_CONFIGS } from 'constants/index'
import {
  DEFAULT_SWAP_FEE_NOT_STABLE_PAIRS,
  DEFAULT_SWAP_FEE_STABLE_PAIRS,
  STABLE_COIN_ADDRESSES_TO_TAKE_FEE,
  TOKENS_WITH_FEE_TIER_1,
} from 'constants/tokens'
import { useKyberswapGlobalConfig } from 'hooks/useKyberSwapConfig'
import { getTokenScore as getTokenScoreFromLocal, saveTokenScore } from 'utils/tokenScore'

export type SwapFeeConfig = {
  token: string
  feeBips: number
}

const checkBothTokensAreStable = (chainId: ChainId, tokenIn: string, tokenOut: string) => {
  return (
    STABLE_COIN_ADDRESSES_TO_TAKE_FEE[chainId].includes(tokenIn) &&
    STABLE_COIN_ADDRESSES_TO_TAKE_FEE[chainId].includes(tokenOut)
  )
}

const getFeeConfigIfTokensDifferentTier = (
  chainId: ChainId,
  tokenIn: string,
  tokenOut: string,
): SwapFeeConfig | undefined => {
  const isTokenInTier1 = TOKENS_WITH_FEE_TIER_1[chainId].includes(tokenIn)
  const isTokenOutTier1 = TOKENS_WITH_FEE_TIER_1[chainId].includes(tokenOut)

  if (isTokenInTier1 === isTokenOutTier1) {
    return undefined
  }

  // either isTokenInTier1 or isTokenOutTier1 is true
  const tokenToTakeFee = isTokenInTier1 ? tokenIn : tokenOut

  return {
    token: tokenToTakeFee,
    feeBips: DEFAULT_SWAP_FEE_NOT_STABLE_PAIRS,
  }
}

const useGetSwapFeeConfig = () => {
  const { isEnableAuthenAggregator } = useKyberswapGlobalConfig()

  const [triggerGetTokenScoreQuery] = tokenApi.useLazyGetTokenScoreQuery()

  const getSingleTokenScore = useCallback(
    async (chainId: ChainId, tokenAddress: string): Promise<string | undefined> => {
      const now = Math.floor(Date.now() / 1000)

      const { score, savedAt } = getTokenScoreFromLocal(chainId, tokenAddress) || {}
      if (score && savedAt && now - savedAt < 86400) {
        return score
      }

      const { data, isError } = await triggerGetTokenScoreQuery({
        params: {
          chainId,
          tokenAddress,
        },
        authentication: isEnableAuthenAggregator,
      })

      if (isError || !data?.data?.score) {
        return undefined
      }

      saveTokenScore(chainId, tokenAddress, data.data.score)

      return data.data.score
    },
    [isEnableAuthenAggregator, triggerGetTokenScoreQuery],
  )

  const getTokenScores = useCallback(
    (chainId: ChainId, tokenIn: string, tokenOut: string) => {
      return Promise.all([getSingleTokenScore(chainId, tokenIn), getSingleTokenScore(chainId, tokenOut)])
    },
    [getSingleTokenScore],
  )

  const getSwapFeeConfig = useCallback(
    async (chainId: ChainId, tokenIn: string, tokenOut: string): Promise<SwapFeeConfig | undefined> => {
      // TODO: check applicable chains
      if (!CHAINS_SUPPORT_FEE_CONFIGS.includes(chainId)) {
        return undefined
      }

      const feeConfig = getFeeConfigIfTokensDifferentTier(chainId, tokenIn, tokenOut)
      if (feeConfig) {
        return feeConfig
      }

      // This means they're in the same tier
      const isTokensBothStable = checkBothTokensAreStable(chainId, tokenIn, tokenOut)
      const feeBips = isTokensBothStable ? DEFAULT_SWAP_FEE_STABLE_PAIRS : DEFAULT_SWAP_FEE_NOT_STABLE_PAIRS

      const [tokenInScore, tokenOutScore] = await getTokenScores(chainId, tokenIn, tokenOut)

      if (!tokenInScore && !tokenOutScore) {
        return {
          token: tokenIn,
          feeBips,
        }
      } else if (!tokenInScore || !tokenOutScore) {
        if (tokenInScore) {
          return {
            token: tokenIn,
            feeBips,
          }
        }

        return {
          token: tokenOut,
          feeBips,
        }
      }

      return {
        token: tokenInScore > tokenOutScore ? tokenIn : tokenOut,
        feeBips,
      }
    },
    [getTokenScores],
  )

  return getSwapFeeConfig
}

export default useGetSwapFeeConfig

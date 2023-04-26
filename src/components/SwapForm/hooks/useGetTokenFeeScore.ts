import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback } from 'react'
import routeApi from 'services/route'

import { CHAINS_SUPPORT_FEE_CONFIGS, ETHER_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import {
  DEFAULT_SWAP_FEE_NOT_STABLE_PAIRS,
  DEFAULT_SWAP_FEE_STABLE_PAIRS,
  STABLE_COIN_ADDRESSES_TO_TAKE_FEE,
  TOKENS_WITH_FEE_TIER_1,
} from 'constants/tokens'
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

const checkBothTokensAreStable = (chainId: ChainId, tokenIn: string, tokenOut: string) => {
  return (
    STABLE_COIN_ADDRESSES_TO_TAKE_FEE[chainId].includes(tokenIn) &&
    STABLE_COIN_ADDRESSES_TO_TAKE_FEE[chainId].includes(tokenOut)
  )
}

const getFeeConfigIfTokensSameTier = (chainId: ChainId, tokenIn: string, tokenOut: string) => {
  const isTokenInTier1 = TOKENS_WITH_FEE_TIER_1[chainId].includes(tokenIn)
  const isTokenOutTier1 = TOKENS_WITH_FEE_TIER_1[chainId].includes(tokenOut)

  if (isTokenInTier1 === isTokenOutTier1) {
    return undefined
  }

  // either isTokenInTier1 or isTokenOutTier1 is true
  const tokenToTakeFee = isTokenInTier1 ? tokenIn : tokenOut

  return {
    tokenToTakeFee,
    feePercent: DEFAULT_SWAP_FEE_NOT_STABLE_PAIRS,
  }
}

const useGetTokenFeeScore = () => {
  const { aggregatorDomain, isEnableAuthenAggregator } = useKyberswapGlobalConfig()

  const [triggerGetTokenScoreQuery] = routeApi.useLazyGetTokenScoreQuery()

  const getTokenScore = useCallback(
    async (
      chainId: ChainId,
      tokenIn: string,
      tokenOut: string,
    ): Promise<{
      tokenToTakeFee: string
      feePercent: number
    }> => {
      const now = Math.floor(Date.now() / 1000)

      // TODO: check applicable chains
      if (!CHAINS_SUPPORT_FEE_CONFIGS.includes(chainId)) {
        return {
          tokenToTakeFee: '',
          feePercent: 0,
        }
      }

      const feeConfig = getFeeConfigIfTokensSameTier(chainId, tokenIn, tokenOut)
      if (feeConfig) {
        return feeConfig
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
        if (checkBothTokensAreStable(chainId, tokenIn, tokenOut)) {
          return {
            tokenToTakeFee: tokenIn,
            feePercent: DEFAULT_SWAP_FEE_STABLE_PAIRS,
          }
        }

        return {
          tokenToTakeFee: tokenIn,
          feePercent: DEFAULT_SWAP_FEE_NOT_STABLE_PAIRS,
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

import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback } from 'react'

import { STOP_MARKET_SLIPPAGE_CONFIG } from 'components/StopMarket/constants'
import { PAIR_CATEGORY } from 'constants/trade'
import { PairTokens, usePairCategory } from 'state/swap/hooks'
import { SLIPPAGE_STATUS } from 'utils/slippage'

/**
 * Reads Stop Market's own slippage settings for the page's pair, or the explicit pair of an edited order.
 */
export const useStopMarketSlippageOptions = (chainId: ChainId, pair?: PairTokens) => {
  const pairCategory = usePairCategory(chainId, pair)
  const {
    defaultSlippage,
    presets: slippagePresets,
    lowThreshold,
    highThreshold,
  } = STOP_MARKET_SLIPPAGE_CONFIG[pairCategory] ?? STOP_MARKET_SLIPPAGE_CONFIG[PAIR_CATEGORY.EXOTIC]
  const getSlippageStatus = useCallback(
    (slippage: number) => {
      if (lowThreshold !== undefined && slippage < lowThreshold) return SLIPPAGE_STATUS.LOW
      if (slippage > highThreshold) return SLIPPAGE_STATUS.HIGH
      return SLIPPAGE_STATUS.NORMAL
    },
    [lowThreshold, highThreshold],
  )
  return { defaultSlippage, slippagePresets, getSlippageStatus }
}

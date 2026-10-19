import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'

import { STOP_ORDER_SLIPPAGE_MULTIPLIER } from 'components/StopOrder/constants'
import { DEFAULT_SLIPPAGES, DEFAULT_SLIPPAGES_HIGH_VOLATILITY, PAIR_CATEGORY } from 'constants/trade'
import { PairTokens, useDefaultSlippageByPair, usePairCategory } from 'state/swap/hooks'
import { checkRangeSlippage } from 'utils/slippage'

/**
 * The swap form's suggestion, presets and warning bands for the pair's category, each scaled by the
 * same multiplier so the stop order stays in step with swap as either changes. The pair is the one on the
 * page unless `pair` names another — an open order being edited, say.
 */
export const useStopOrderSlippageOptions = (chainId: ChainId, pair?: PairTokens) => {
  const pairCategory = usePairCategory(chainId, pair)
  const defaultSlippage = useDefaultSlippageByPair(chainId, pair) * STOP_ORDER_SLIPPAGE_MULTIPLIER
  const slippagePresets = useMemo(
    () =>
      (pairCategory === PAIR_CATEGORY.HIGH_VOLATILITY ? DEFAULT_SLIPPAGES_HIGH_VOLATILITY : DEFAULT_SLIPPAGES).map(
        preset => preset * STOP_ORDER_SLIPPAGE_MULTIPLIER,
      ),
    [pairCategory],
  )
  // Scaling the value down against swap's bands is the same as scaling the bands up.
  const getSlippageStatus = useCallback(
    (slippage: number) => checkRangeSlippage(slippage / STOP_ORDER_SLIPPAGE_MULTIPLIER, pairCategory),
    [pairCategory],
  )
  return { defaultSlippage, slippagePresets, getSlippageStatus }
}

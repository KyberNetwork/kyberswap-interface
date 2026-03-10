import { useMemo } from 'react'

import {
  AddLiquidityReviewData,
  UseAddLiquidityReviewDataProps,
  buildAddLiquidityReviewData,
} from 'pages/Earns/PoolDetail/AddLiquidity/hooks/reviewData'

export type { AddLiquidityReviewData, UseAddLiquidityReviewDataProps }

export default function useAddLiquidityReviewData({
  chainId,
  exchange,
  poolType,
  pool,
  route,
  tokens,
  amounts,
  prices,
  revertPrice,
  poolPrice,
  tickLower,
  tickUpper,
  minPrice,
  maxPrice,
  slippage,
}: UseAddLiquidityReviewDataProps) {
  return useMemo<AddLiquidityReviewData>(
    () =>
      buildAddLiquidityReviewData({
        chainId,
        exchange,
        poolType,
        pool,
        route,
        tokens,
        amounts,
        prices,
        revertPrice,
        poolPrice,
        tickLower,
        tickUpper,
        minPrice,
        maxPrice,
        slippage,
      }),
    [
      amounts,
      chainId,
      exchange,
      maxPrice,
      minPrice,
      pool,
      poolPrice,
      poolType,
      prices,
      revertPrice,
      route,
      slippage,
      tickLower,
      tickUpper,
      tokens,
    ],
  )
}

import { PoolType } from '@kyber/schema'

import useAddLiquidityPriceRange from 'pages/Earns/PoolDetail/hooks/add-liquidity/useAddLiquidityPriceRange'
import useAddLiquidityRoute from 'pages/Earns/PoolDetail/hooks/add-liquidity/useAddLiquidityRoute'
import useAddLiquiditySlippage from 'pages/Earns/PoolDetail/hooks/add-liquidity/useAddLiquiditySlippage'
import useAddLiquidityTokens from 'pages/Earns/PoolDetail/hooks/add-liquidity/useAddLiquidityTokens'
import useAddLiquidityPositionApr from 'pages/Earns/PoolDetail/hooks/position-apr/useAddLiquidityPositionApr'

interface UseAddLiquidityStateProps {
  chainId: number
  poolAddress: string
  poolType: PoolType
  account?: string
  positionId?: string
  initialTick?: { tickLower: number; tickUpper: number }
}

export default function useAddLiquidityState({
  chainId,
  poolAddress,
  poolType,
  account,
  positionId,
  initialTick,
}: UseAddLiquidityStateProps) {
  const tokenState = useAddLiquidityTokens({
    chainId,
    poolAddress,
    poolType,
    account,
  })

  const priceRangeState = useAddLiquidityPriceRange({
    chainId,
    pool: tokenState.pool,
    poolType,
    initialTick,
  })

  const slippageState = useAddLiquiditySlippage({
    chainId,
    pool: tokenState.pool,
    tokensIn: tokenState.tokensIn,
  })

  const routeState = useAddLiquidityRoute({
    chainId,
    poolAddress,
    poolType,
    pool: tokenState.pool,
    account,
    positionId,
    tokensIn: tokenState.tokensIn,
    amountsIn: tokenState.amountsIn,
    slippage: slippageState.slippage,
    tickLower: priceRangeState.tickLower,
    tickUpper: priceRangeState.tickUpper,
  })

  const positionAprState = useAddLiquidityPositionApr({
    amounts: tokenState.amountsIn,
    route: routeState.route,
  })

  return {
    pool: {
      data: tokenState.pool,
      error: tokenState.poolError,
      loading: tokenState.poolLoading,
    },
    tokenInput: {
      tokens: tokenState.tokensIn,
      amounts: tokenState.amountsIn,
      balances: tokenState.tokenBalances,
      prices: tokenState.tokenPrices,
      setTokens: tokenState.setTokensIn,
      setAmounts: tokenState.setAmountsIn,
    },
    priceRange: {
      isUniV3: priceRangeState.isUniV3,
      poolPrice: priceRangeState.poolPrice,
      revertPrice: priceRangeState.revertPrice,
      tickLower: priceRangeState.tickLower,
      tickUpper: priceRangeState.tickUpper,
      minPrice: priceRangeState.minPrice,
      maxPrice: priceRangeState.maxPrice,
      toggleRevertPrice: priceRangeState.toggleRevertPrice,
      setTickLower: priceRangeState.setTickLower,
      setTickUpper: priceRangeState.setTickUpper,
    },
    slippage: {
      value: slippageState.slippage,
      suggestedValue: slippageState.suggestedSlippage,
      setValue: slippageState.setSlippage,
    },
    route: {
      data: routeState.route,
      error: routeState.routeError,
      loading: routeState.routeLoading,
    },
    positionApr: {
      hasInput: positionAprState.hasInput,
      positionLiquidity: positionAprState.positionLiquidity,
      positionTvl: positionAprState.positionTvl,
    },
  }
}

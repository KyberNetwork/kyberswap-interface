import { formatUnits } from '@ethersproject/units'
import {
  AddLiquidityAction,
  AggregatorSwapAction,
  DEXES_INFO,
  NATIVE_TOKEN_ADDRESS,
  NETWORKS_INFO,
  PartnerFeeAction,
  Pool,
  PoolSwapAction,
  PoolType,
  ProtocolFeeAction,
  RefundAction,
  Token,
  ZapAction,
  ZapRouteDetail,
  getDexName,
  univ2PoolNormalize,
  univ2Types,
  univ3PoolNormalize,
  univ3Types,
} from '@kyber/schema'
import { PI_LEVEL, getPoolPrice, getZapImpact } from '@kyber/utils'
import { useMemo } from 'react'

import { formatDisplayNumber } from 'utils/numbers'

export interface ReviewZapState {
  chainId?: number
  poolType?: PoolType
  tokens?: Token[]
  amounts?: string
  prices?: Record<string, number>
  slippage?: number
  priceRange?: {
    revertPrice?: boolean
    poolPrice?: number | null
    tickLower?: number | null
    tickUpper?: number | null
    minPrice?: string | null
    maxPrice?: string | null
  }
}

export interface UseReviewDataProps {
  pool?: Pool | null
  route?: ZapRouteDetail | null
  zapState?: ReviewZapState
}

export interface ReviewTokenItem {
  token: Token
  amount: number
  usdValue: number
}

export interface ReviewWarningItem {
  kind: 'remaining' | 'zap_impact' | 'out_of_range' | 'full_range' | 'price_deviation'
  tone: 'info' | 'warning' | 'error'
  message: string
}

interface ReviewSummaryStep {
  text: string
}

interface ReviewEstimate {
  totalUsd?: number
  slippage?: number
  suggestedSlippage?: number
  items?: ReviewTokenItem[]
  remainingUsd?: number
  remainingItems?: ReviewTokenItem[]
  zapFeePercent?: number
  protocolFeePercent?: number
  partnerFeePercent?: number
  gasUsd?: number
  zapImpact?: {
    level: PI_LEVEL
    display: string
    message: string
  } | null
  summarySteps?: ReviewSummaryStep[]
}

export interface AddLiquidityReviewData {
  hasInput: boolean
  header: {
    poolType?: PoolType
    protocolName?: string
    protocolLogo?: string
    token0: Token
    token1: Token
    feeLabel?: string
    pairLabel: string
  } | null
  zapInItems: ReviewTokenItem[]
  totalInputUsd: number
  priceInfo: {
    isUniV3?: boolean
    currentPrice?: number | null
    estimatedPriceAfterZap?: number | null
    baseToken?: { symbol: string }
    quoteToken?: { symbol: string }
    minPrice?: string | null
    maxPrice?: string | null
  } | null
  estimate: ReviewEstimate | null
  warnings: ReviewWarningItem[]
}

const parseAmount = (value?: string) => {
  if (!value) return 0

  const parsed = Number(value.trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const getPoolTokenPrice = (token?: Token) => {
  const poolToken = token as (Token & { price?: number }) | undefined
  return poolToken?.price || 0
}

const isPoolPriceDeviated = (price: number | null, newPrice: number | undefined | null) =>
  !!price && !!newPrice && Math.abs(price / newPrice - 1) > 0.02

const getTokenPrice = ({
  token,
  prices,
  wrappedNativeAddress,
}: {
  token: Token
  prices: Record<string, number>
  wrappedNativeAddress?: string
}) => {
  const tokenAddress = token.address.toLowerCase()
  const directPrice = prices[tokenAddress]
  if (directPrice) return directPrice

  if (tokenAddress === NATIVE_TOKEN_ADDRESS.toLowerCase() && wrappedNativeAddress) {
    return prices[wrappedNativeAddress] || 0
  }

  return getPoolTokenPrice(token)
}

const buildZapInItems = ({
  tokens,
  amounts,
  prices,
  wrappedNativeAddress,
}: {
  tokens: Token[]
  amounts: string
  prices: Record<string, number>
  wrappedNativeAddress?: string
}) =>
  tokens
    .map((token, index) => {
      const amount = parseAmount(amounts.split(',')[index])
      return {
        token,
        amount,
        usdValue: amount * getTokenPrice({ token, prices, wrappedNativeAddress }),
      }
    })
    .filter(item => item.amount > 0)

const buildSummarySteps = ({
  aggregatorSwapAction,
  poolSwapAction,
  addLiquidityAction,
  allTokens,
  pool,
  protocolName,
}: {
  aggregatorSwapAction?: AggregatorSwapAction
  poolSwapAction?: PoolSwapAction
  addLiquidityAction?: AddLiquidityAction
  allTokens: Token[]
  pool: Pool
  protocolName: string
}) => {
  const summarySteps: ReviewSummaryStep[] = []

  aggregatorSwapAction?.aggregatorSwap.swaps.forEach(item => {
    const tokenIn = allTokens.find(token => token.address.toLowerCase() === item.tokenIn.address.toLowerCase())
    const tokenOut = allTokens.find(token => token.address.toLowerCase() === item.tokenOut.address.toLowerCase())

    summarySteps.push({
      text: `Swap ${formatDisplayNumber(Number(formatUnits(item.tokenIn.amount, tokenIn?.decimals || 18)), {
        significantDigits: 8,
      })} ${tokenIn?.symbol || '--'} for ${formatDisplayNumber(
        Number(formatUnits(item.tokenOut.amount, tokenOut?.decimals || 18)),
        { significantDigits: 8 },
      )} ${tokenOut?.symbol || '--'} via KyberSwap`,
    })
  })

  poolSwapAction?.poolSwap.swaps.forEach(item => {
    const tokenIn = allTokens.find(token => token.address.toLowerCase() === item.tokenIn.address.toLowerCase())
    const tokenOut = allTokens.find(token => token.address.toLowerCase() === item.tokenOut.address.toLowerCase())
    const poolLabel =
      item.poolAddress && pool.address && item.poolAddress.toLowerCase() !== pool.address.toLowerCase()
        ? `${tokenIn?.symbol || '--'}-${tokenOut?.symbol || '--'} Pool`
        : `${protocolName} Pool`

    summarySteps.push({
      text: `Swap ${formatDisplayNumber(Number(formatUnits(item.tokenIn.amount, tokenIn?.decimals || 18)), {
        significantDigits: 8,
      })} ${tokenIn?.symbol || '--'} for ${formatDisplayNumber(
        Number(formatUnits(item.tokenOut.amount, tokenOut?.decimals || 18)),
        { significantDigits: 8 },
      )} ${tokenOut?.symbol || '--'} via ${poolLabel}`,
    })
  })

  if (addLiquidityAction) {
    const estimatedToken0Amount = Number(
      formatUnits(addLiquidityAction.addLiquidity.token0.amount || '0', pool.token0.decimals),
    )
    const estimatedToken1Amount = Number(
      formatUnits(addLiquidityAction.addLiquidity.token1.amount || '0', pool.token1.decimals),
    )

    if (estimatedToken0Amount > 0 || estimatedToken1Amount > 0) {
      summarySteps.push({
        text: `Build LP using ${formatDisplayNumber(estimatedToken0Amount, {
          significantDigits: 8,
        })} ${pool.token0.symbol} and ${formatDisplayNumber(estimatedToken1Amount, {
          significantDigits: 8,
        })} ${pool.token1.symbol} on ${protocolName}`,
      })
    }
  }

  return summarySteps
}

const getEstimatedPriceAfterZap = ({
  pool,
  poolType,
  route,
  revertPrice,
}: {
  pool: Pool
  poolType?: PoolType
  route?: ZapRouteDetail | null
  revertPrice: boolean
}) => {
  const { success: isUniV3Pool, data: normalizedUniV3Pool } = univ3PoolNormalize.safeParse(pool)
  const { success: isUniV2Pool, data: normalizedUniV2Pool } = univ2PoolNormalize.safeParse(pool)

  if (!route) return null

  if (isUniV3Pool && univ3Types.includes(poolType as any)) {
    const nextPoolDetails = route.poolDetails.uniswapV3 || route.poolDetails.algebraV1
    if (!nextPoolDetails) return null

    return getPoolPrice({
      pool: {
        ...normalizedUniV3Pool,
        sqrtPriceX96: nextPoolDetails.newSqrtP,
        tick: nextPoolDetails.newTick,
        liquidity: (BigInt(normalizedUniV3Pool.liquidity) + BigInt(route.positionDetails.addedLiquidity)).toString(),
      },
      revertPrice,
    })
  }

  if (isUniV2Pool && univ2Types.includes(poolType as any)) {
    return getPoolPrice({
      pool: {
        ...normalizedUniV2Pool,
        reserves: [route.poolDetails.uniswapV2.newReserve0, route.poolDetails.uniswapV2.newReserve1],
      },
      revertPrice,
    })
  }

  return null
}

const buildWarnings = ({
  route,
  totalInputUsd,
  remainingUsd,
  tickLower,
  tickUpper,
  pool,
  poolPrice,
  estimatedPriceAfterZap,
  displayToken0,
  displayToken1,
}: {
  route?: ZapRouteDetail | null
  totalInputUsd: number
  remainingUsd: number
  tickLower: number | null
  tickUpper: number | null
  pool: Pool
  poolPrice?: number | null
  estimatedPriceAfterZap?: number | null
  displayToken0: Token
  displayToken1: Token
}) => {
  const warnings: ReviewWarningItem[] = []
  const zapImpact = route ? getZapImpact(route.zapDetails.priceImpact, route.zapDetails.suggestedSlippage || 100) : null

  if (route && totalInputUsd > 0 && route.zapDetails.suggestedSlippage > 0) {
    const remainingRatio = remainingUsd / totalInputUsd
    if (remainingRatio >= route.zapDetails.suggestedSlippage / 10_000) {
      warnings.push({
        kind: 'remaining',
        tone: 'warning',
        message: `${(remainingRatio * 100).toFixed(
          2,
        )}% remains unused and will be returned to your wallet. Refresh or change your amount to get updated routes.`,
      })
    }
  }

  if (zapImpact && zapImpact.level !== PI_LEVEL.NORMAL) {
    warnings.push({
      kind: 'zap_impact',
      tone: zapImpact.level === PI_LEVEL.HIGH ? 'warning' : 'error',
      message: zapImpact.msg,
    })
  }

  if (route) {
    const nextPoolDetails = route.poolDetails.uniswapV3 || route.poolDetails.algebraV1
    if (nextPoolDetails && tickLower !== null && tickUpper !== null) {
      const isOutOfRangeAfterZap = nextPoolDetails.newTick < tickLower || nextPoolDetails.newTick >= tickUpper
      if (isOutOfRangeAfterZap) {
        warnings.push({
          kind: 'out_of_range',
          tone: 'info',
          message:
            'Your liquidity is outside the current market range and will not be used or earn fees until the market price enters your specified range.',
        })
      }
    }
  }

  if ('minTick' in pool && 'maxTick' in pool && tickLower === pool.minTick && tickUpper === pool.maxTick) {
    warnings.push({
      kind: 'full_range',
      tone: 'info',
      message:
        'Your liquidity is active across the full price range. However, this may result in a lower APR than estimated due to less concentration of liquidity.',
    })
  }

  if (isPoolPriceDeviated(poolPrice || null, estimatedPriceAfterZap)) {
    warnings.push({
      kind: 'price_deviation',
      tone: 'warning',
      message: `The pool's estimated price after zapping of 1 ${displayToken0.symbol} = ${formatDisplayNumber(
        estimatedPriceAfterZap,
        { significantDigits: 6 },
      )} ${displayToken1.symbol} deviates from the market price (1 ${displayToken0.symbol} = ${formatDisplayNumber(
        poolPrice,
        { significantDigits: 6 },
      )} ${displayToken1.symbol}). You might have high impermanent loss after you add liquidity to this pool.`,
    })
  }

  return {
    warnings,
    zapImpact: zapImpact
      ? {
          level: zapImpact.level,
          display: zapImpact.display,
          message: zapImpact.msg,
        }
      : null,
  }
}

export const buildAddLiquidityReviewData = ({ pool, route, zapState }: UseReviewDataProps): AddLiquidityReviewData => {
  const chainId = zapState?.chainId
  const poolType = zapState?.poolType
  const tokens = zapState?.tokens || []
  const amounts = zapState?.amounts || ''
  const prices = zapState?.prices || {}
  const slippage = zapState?.slippage
  const revertPrice = zapState?.priceRange?.revertPrice || false
  const poolPrice = zapState?.priceRange?.poolPrice ?? null
  const tickLower = zapState?.priceRange?.tickLower ?? null
  const tickUpper = zapState?.priceRange?.tickUpper ?? null
  const minPrice = zapState?.priceRange?.minPrice ?? null
  const maxPrice = zapState?.priceRange?.maxPrice ?? null
  const wrappedNativeAddress = chainId
    ? (NETWORKS_INFO as Record<number, any>)[chainId]?.wrappedToken?.address?.toLowerCase()
    : undefined
  const zapInItems = buildZapInItems({ tokens, amounts, prices, wrappedNativeAddress })
  const totalInputUsd = zapInItems.reduce((total, item) => total + item.usdValue, 0)
  const hasInput = zapInItems.length > 0

  if (!pool) {
    return {
      hasInput,
      header: null,
      zapInItems,
      totalInputUsd,
      priceInfo: null,
      estimate: null,
      warnings: [],
    }
  }

  const displayToken0 = revertPrice ? pool.token1 : pool.token0
  const displayToken1 = revertPrice ? pool.token0 : pool.token1
  const feeLabel = pool.fee !== undefined ? `${pool.fee}%` : poolType ? `${poolType}` : undefined
  const protocolName = poolType && chainId ? getDexName(poolType, chainId) : poolType ? String(poolType) : 'Pool'
  const protocolLogo = poolType ? DEXES_INFO[poolType]?.icon : undefined
  const allTokens = Array.from(
    new Map([...tokens, pool.token0, pool.token1].map(token => [token.address, token])).values(),
  )
  const addLiquidityAction = route?.zapDetails.actions.find(item => item.type === ZapAction.ADD_LIQUIDITY) as
    | AddLiquidityAction
    | undefined
  const refundAction = route?.zapDetails.actions.find(item => item.type === ZapAction.REFUND) as
    | RefundAction
    | undefined
  const protocolFeeAction = route?.zapDetails.actions.find(item => item.type === ZapAction.PROTOCOL_FEE) as
    | ProtocolFeeAction
    | undefined
  const partnerFeeAction = route?.zapDetails.actions.find(item => item.type === ZapAction.PARTNET_FEE) as
    | PartnerFeeAction
    | undefined
  const aggregatorSwapAction = route?.zapDetails.actions.find(item => item.type === ZapAction.AGGREGATOR_SWAP) as
    | AggregatorSwapAction
    | undefined
  const poolSwapAction = route?.zapDetails.actions.find(item => item.type === ZapAction.POOL_SWAP) as
    | PoolSwapAction
    | undefined
  const estimatedToken0Amount = addLiquidityAction
    ? Number(formatUnits(addLiquidityAction.addLiquidity.token0.amount || '0', pool.token0.decimals))
    : 0
  const estimatedToken1Amount = addLiquidityAction
    ? Number(formatUnits(addLiquidityAction.addLiquidity.token1.amount || '0', pool.token1.decimals))
    : 0
  const estimatedToken0Usd = Number(addLiquidityAction?.addLiquidity.token0.amountUsd || 0)
  const estimatedToken1Usd = Number(addLiquidityAction?.addLiquidity.token1.amountUsd || 0)
  const remainingItems =
    refundAction?.refund.tokens
      .map(item => {
        const matchedToken = allTokens.find(token => token.address.toLowerCase() === item.address.toLowerCase())
        if (!matchedToken) return null

        return {
          token: matchedToken,
          amount: Number(formatUnits(item.amount || '0', matchedToken.decimals)),
          usdValue: Number(item.amountUsd || 0),
        }
      })
      .filter((item): item is ReviewTokenItem => Boolean(item && item.amount > 0)) || []
  const remainingUsd = remainingItems.reduce((total, item) => total + item.usdValue, 0)
  const estimatedPriceAfterZap = getEstimatedPriceAfterZap({ pool, poolType, route, revertPrice })
  const { warnings, zapImpact } = buildWarnings({
    route,
    totalInputUsd,
    remainingUsd,
    tickLower,
    tickUpper,
    pool,
    poolPrice,
    estimatedPriceAfterZap,
    displayToken0,
    displayToken1,
  })

  return {
    hasInput,
    header: {
      poolType,
      protocolName,
      protocolLogo,
      token0: pool.token0,
      token1: pool.token1,
      feeLabel,
      pairLabel: `${pool.token0.symbol}/${pool.token1.symbol}`,
    },
    zapInItems,
    totalInputUsd: Number(route?.zapDetails.initialAmountUsd || totalInputUsd),
    priceInfo: {
      isUniV3: minPrice !== null || maxPrice !== null,
      currentPrice: poolPrice,
      estimatedPriceAfterZap,
      baseToken: displayToken0,
      quoteToken: displayToken1,
      minPrice,
      maxPrice,
    },
    estimate: {
      totalUsd: Number(route?.positionDetails.addedAmountUsd || estimatedToken0Usd + estimatedToken1Usd || 0),
      slippage,
      suggestedSlippage: route?.zapDetails.suggestedSlippage,
      items: [
        {
          token: pool.token0,
          amount: estimatedToken0Amount,
          usdValue: estimatedToken0Usd,
        },
        {
          token: pool.token1,
          amount: estimatedToken1Amount,
          usdValue: estimatedToken1Usd,
        },
      ],
      remainingUsd,
      remainingItems,
      zapFeePercent:
        (((protocolFeeAction?.protocolFee.pcm || 0) + (partnerFeeAction?.partnerFee.pcm || 0)) / 100_000) * 100,
      protocolFeePercent: ((protocolFeeAction?.protocolFee.pcm || 0) / 100_000) * 100,
      partnerFeePercent: ((partnerFeeAction?.partnerFee.pcm || 0) / 100_000) * 100,
      gasUsd: Number(route?.gasUsd || 0),
      zapImpact,
      summarySteps: buildSummarySteps({
        aggregatorSwapAction,
        poolSwapAction,
        addLiquidityAction,
        allTokens,
        pool,
        protocolName,
      }),
    },
    warnings,
  }
}

export default function useReviewData({ pool, route, zapState }: UseReviewDataProps) {
  return useMemo(
    () =>
      buildAddLiquidityReviewData({
        pool,
        route,
        zapState,
      }),
    [pool, route, zapState],
  )
}

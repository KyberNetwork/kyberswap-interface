import { formatUnits } from '@ethersproject/units'
import {
  AddLiquidityAction,
  AggregatorSwapAction,
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
  univ2PoolNormalize,
  univ2Types,
  univ3PoolNormalize,
  univ3Types,
} from '@kyber/schema'
import { PI_LEVEL, getPoolPrice, getZapImpact } from '@kyber/utils'
import { useMemo } from 'react'

import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { formatDisplayNumber } from 'utils/numbers'

interface UseAddLiquidityReviewDataProps {
  chainId?: number
  exchange?: string
  poolType?: PoolType
  pool?: Pool | null
  route?: ZapRouteDetail | null
  tokens?: Token[]
  amounts?: string
  prices?: Record<string, number>
  revertPrice?: boolean
  poolPrice?: number | null
  tickLower?: number | null
  tickUpper?: number | null
  minPrice?: string | null
  maxPrice?: string | null
  slippage?: number
}

interface ReviewTokenItem {
  token: Token
  amount: number
  usdValue: number
}

interface ReviewWarningItem {
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
    exchange?: string
    poolType?: PoolType
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

export default function useAddLiquidityReviewData({
  chainId,
  exchange,
  poolType,
  pool,
  route,
  tokens = [],
  amounts = '',
  prices = {},
  revertPrice = false,
  poolPrice = null,
  tickLower = null,
  tickUpper = null,
  minPrice = null,
  maxPrice = null,
  slippage,
}: UseAddLiquidityReviewDataProps) {
  return useMemo<AddLiquidityReviewData>(() => {
    const amountList = amounts.split(',').map(item => parseAmount(item))
    const wrappedNativeAddress = chainId
      ? (NETWORKS_INFO as Record<number, any>)[chainId]?.wrappedToken?.address?.toLowerCase()
      : undefined

    const zapInItems: ReviewTokenItem[] = tokens
      .map((token, index) => {
        const amount = amountList[index] || 0
        const usdValue = amount * getTokenPrice({ token, prices, wrappedNativeAddress })

        return {
          token,
          amount,
          usdValue,
        }
      })
      .filter(item => item.amount > 0)

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
    const protocolName = exchange ? EARN_DEXES[exchange as Exchange]?.name || exchange : poolType || 'Pool'
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
    const remainingItems: ReviewTokenItem[] =
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
    const liquidityUsd = Number(route?.positionDetails.addedAmountUsd || estimatedToken0Usd + estimatedToken1Usd || 0)
    const protocolFeePercent = ((protocolFeeAction?.protocolFee.pcm || 0) / 100_000) * 100
    const partnerFeePercent = ((partnerFeeAction?.partnerFee.pcm || 0) / 100_000) * 100
    const zapImpact = route
      ? getZapImpact(route.zapDetails.priceImpact, route.zapDetails.suggestedSlippage || 100)
      : null
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

    if (estimatedToken0Amount > 0 || estimatedToken1Amount > 0) {
      summarySteps.push({
        text: `Build LP using ${formatDisplayNumber(estimatedToken0Amount, {
          significantDigits: 8,
        })} ${pool.token0.symbol} and ${formatDisplayNumber(estimatedToken1Amount, {
          significantDigits: 8,
        })} ${pool.token1.symbol} on ${protocolName}`,
      })
    }

    const warnings: ReviewWarningItem[] = []

    if (route && slippage && route.zapDetails.suggestedSlippage > 0) {
      if (slippage > 2 * route.zapDetails.suggestedSlippage) {
        warnings.push({
          tone: 'warning',
          message: 'Your slippage is set higher than usual, which may cause unexpected losses.',
        })
      } else if (slippage < route.zapDetails.suggestedSlippage / 2) {
        warnings.push({
          tone: 'warning',
          message: 'Your slippage is set lower than usual, increasing the risk of transaction failure.',
        })
      }
    }

    if (route && totalInputUsd > 0 && route.zapDetails.suggestedSlippage > 0) {
      const remainingRatio = remainingUsd / totalInputUsd
      if (remainingRatio >= route.zapDetails.suggestedSlippage / 10_000) {
        warnings.push({
          tone: 'warning',
          message: `${(remainingRatio * 100).toFixed(
            2,
          )}% remains unused and will be returned to your wallet. Refresh or change your amount to get updated routes.`,
        })
      }
    }

    if (zapImpact && zapImpact.level !== PI_LEVEL.NORMAL) {
      warnings.push({
        tone: zapImpact.level === PI_LEVEL.HIGH ? 'warning' : 'error',
        message: zapImpact.msg,
      })
    }

    const { success: isUniV3Pool, data: normalizedUniV3Pool } = univ3PoolNormalize.safeParse(pool)
    const { success: isUniV2Pool, data: normalizedUniV2Pool } = univ2PoolNormalize.safeParse(pool)

    let estimatedPriceAfterZap: number | null = null

    if (route) {
      if (isUniV3Pool && univ3Types.includes(poolType as any)) {
        const nextPoolDetails = route.poolDetails.uniswapV3 || route.poolDetails.algebraV1
        if (nextPoolDetails) {
          estimatedPriceAfterZap = getPoolPrice({
            pool: {
              ...normalizedUniV3Pool,
              sqrtPriceX96: nextPoolDetails.newSqrtP,
              tick: nextPoolDetails.newTick,
              liquidity: (
                BigInt(normalizedUniV3Pool.liquidity) + BigInt(route.positionDetails.addedLiquidity)
              ).toString(),
            },
            revertPrice,
          })

          if (tickLower !== null && tickUpper !== null) {
            const isOutOfRangeAfterZap = nextPoolDetails.newTick < tickLower || nextPoolDetails.newTick >= tickUpper
            if (isOutOfRangeAfterZap) {
              warnings.push({
                tone: 'info',
                message:
                  'Your liquidity is outside the current market range and will not be used or earn fees until the market price enters your specified range.',
              })
            }
          }
        }
      } else if (isUniV2Pool && univ2Types.includes(poolType as any)) {
        estimatedPriceAfterZap = getPoolPrice({
          pool: {
            ...normalizedUniV2Pool,
            reserves: [route.poolDetails.uniswapV2.newReserve0, route.poolDetails.uniswapV2.newReserve1],
          },
          revertPrice,
        })
      }
    }

    if ('minTick' in pool && 'maxTick' in pool && tickLower === pool.minTick && tickUpper === pool.maxTick) {
      warnings.push({
        tone: 'info',
        message:
          'Your liquidity is active across the full price range. However, this may result in a lower APR than estimated due to less concentration of liquidity.',
      })
    }

    if (isPoolPriceDeviated(poolPrice, estimatedPriceAfterZap)) {
      warnings.push({
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
      hasInput,
      header: {
        exchange,
        poolType,
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
        totalUsd: liquidityUsd,
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
        zapFeePercent: protocolFeePercent + partnerFeePercent,
        protocolFeePercent,
        partnerFeePercent,
        gasUsd: Number(route?.gasUsd || 0),
        zapImpact: zapImpact
          ? {
              level: zapImpact.level,
              display: zapImpact.display,
              message: zapImpact.msg,
            }
          : null,
        summarySteps,
      },
      warnings,
    }
  }, [
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
  ])
}

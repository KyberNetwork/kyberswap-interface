import {
  NATIVE_TOKEN_ADDRESS,
  PoolType,
  RefundAction,
  ZapAction,
  Pool as ZapPool,
  ZapRouteDetail,
  univ2PoolNormalize,
  univ3PoolNormalize,
} from '@kyber/schema'
import { PI_LEVEL, getPoolPrice, getZapImpact } from '@kyber/utils'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useGetHoneypotInfoQuery } from 'services/marketOverview'

import { ZapState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { getSecurityWarnings, isUniV2PoolType, isUniV3PoolType } from 'pages/Earns/PoolDetail/AddLiquidity/utils'
import { formatDisplayNumber } from 'utils/numbers'

type UseFeedbackProps = {
  poolChainId?: number
  pool?: ZapPool | null
  poolType?: PoolType
  state: ZapState
  isDegenMode: boolean
}

type ReviewWarningItem = {
  kind: 'remaining' | 'zap_impact' | 'out_of_range' | 'price_deviation'
  tone: 'info' | 'warning' | 'error'
  message: string
}

type ReviewZapImpact = {
  level: string
  display: string
  message: string
} | null

type ReviewWarningsData = {
  warnings: ReviewWarningItem[]
  zapImpact: ReviewZapImpact
}

const ZAP_IMPACT_BLOCKED_MESSAGE =
  'To protect against very high zap impact, preview is disabled for this route. Turn on Degen Mode in settings if you still want to continue.'

const isPoolPriceDeviated = (price: number | null, newPrice: number | null) =>
  !!price && !!newPrice && Math.abs(price / newPrice - 1) > 0.02

const getRouteAction = <T>(route: ZapRouteDetail | null | undefined, type: ZapAction) =>
  route?.zapDetails.actions.find(action => action.type === type) as T | undefined

const getRemainingUsd = (refundAction?: RefundAction) =>
  refundAction?.refund.tokens.reduce((total, token) => total + Number(token.amountUsd || 0), 0) || 0

const getZapImpactData = (route?: ZapRouteDetail | null): ReviewZapImpact => {
  const zapImpact = route ? getZapImpact(route.zapDetails.priceImpact, route.zapDetails.suggestedSlippage || 100) : null

  return zapImpact
    ? {
        level: zapImpact.level,
        display: zapImpact.display,
        message: zapImpact.msg,
      }
    : null
}

const getEstimatedPriceAfterZap = ({
  pool,
  poolType,
  route,
  revertPrice,
}: {
  pool: ZapPool
  poolType?: PoolType
  route?: ZapRouteDetail | null
  revertPrice: boolean
}) => {
  const normalizedUniV3Pool = univ3PoolNormalize.safeParse(pool)
  const normalizedUniV2Pool = univ2PoolNormalize.safeParse(pool)

  if (!route) return null

  if (normalizedUniV3Pool.success && isUniV3PoolType(poolType)) {
    const nextPoolDetails = route.poolDetails.uniswapV3 || route.poolDetails.algebraV1
    if (!nextPoolDetails) return null

    return getPoolPrice({
      pool: {
        ...normalizedUniV3Pool.data,
        sqrtPriceX96: nextPoolDetails.newSqrtP,
        tick: nextPoolDetails.newTick,
        liquidity: (
          BigInt(normalizedUniV3Pool.data.liquidity) + BigInt(route.positionDetails.addedLiquidity)
        ).toString(),
      },
      revertPrice,
    })
  }

  if (normalizedUniV2Pool.success && isUniV2PoolType(poolType)) {
    const nextPoolDetails = route.poolDetails.uniswapV2
    if (!nextPoolDetails) return null

    return getPoolPrice({
      pool: {
        ...normalizedUniV2Pool.data,
        reserves: [nextPoolDetails.newReserve0, nextPoolDetails.newReserve1],
      },
      revertPrice,
    })
  }

  return null
}

const buildReviewWarnings = ({
  pool,
  poolType,
  route,
  revertPrice,
  poolPrice,
  tickLower,
  tickUpper,
}: {
  pool?: ZapPool | null
  poolType?: PoolType
  route?: ZapRouteDetail | null
  revertPrice: boolean
  poolPrice: number | null
  tickLower: number | null
  tickUpper: number | null
}): ReviewWarningsData => {
  const zapImpact = getZapImpactData(route)

  if (!pool) {
    return {
      warnings: [],
      zapImpact,
    }
  }

  const warnings: ReviewWarningItem[] = []
  const remainingUsd = getRemainingUsd(getRouteAction<RefundAction>(route, ZapAction.REFUND))
  const totalInputUsd = Number(route?.zapDetails.initialAmountUsd || 0)
  const estimatedPriceAfterZap = getEstimatedPriceAfterZap({
    pool,
    poolType,
    route,
    revertPrice,
  })
  const displayToken0 = revertPrice ? pool.token1 : pool.token0
  const displayToken1 = revertPrice ? pool.token0 : pool.token1

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
      message: zapImpact.message,
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

  if (isPoolPriceDeviated(poolPrice, estimatedPriceAfterZap)) {
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
    zapImpact,
  }
}

export const useFeedback = ({ poolChainId, pool, poolType, state, isDegenMode }: UseFeedbackProps) => {
  const tokensToCheck = useMemo(() => {
    if (!pool) return []

    return [pool.token0, pool.token1].filter(
      token => token.address.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase(),
    )
  }, [pool])

  const firstToken = tokensToCheck[0]
  const secondToken = tokensToCheck[1]

  const { data: firstHoneypotInfo } = useGetHoneypotInfoQuery(
    {
      chainId: poolChainId || ChainId.MAINNET,
      address: firstToken?.address || '',
    },
    { skip: !firstToken },
  )

  const { data: secondHoneypotInfo } = useGetHoneypotInfoQuery(
    {
      chainId: poolChainId || ChainId.MAINNET,
      address: secondToken?.address || '',
    },
    { skip: !secondToken },
  )

  const honeypotInfoMap = useMemo(
    () =>
      Object.fromEntries(
        [
          [firstToken?.address.toLowerCase(), firstHoneypotInfo?.data],
          [secondToken?.address.toLowerCase(), secondHoneypotInfo?.data],
        ].filter(([address, info]) => Boolean(address && info)),
      ),
    [firstHoneypotInfo?.data, firstToken?.address, secondHoneypotInfo?.data, secondToken?.address],
  )

  const securityWarnings = useMemo(() => {
    return getSecurityWarnings({ tokens: tokensToCheck, honeypotInfoMap })
  }, [honeypotInfoMap, tokensToCheck])

  const routeWarnings = useMemo(() => {
    if (state.route.error) return [state.route.error]

    if (state.validation.hasPositiveInput && !state.validation.error && !state.route.loading && !state.route.data) {
      return ['No route found']
    }

    return []
  }, [
    state.route.data,
    state.route.error,
    state.route.loading,
    state.validation.error,
    state.validation.hasPositiveInput,
  ])

  const reviewWarnings = useMemo(
    () =>
      buildReviewWarnings({
        pool,
        poolType,
        route: state.route.data,
        revertPrice: state.priceRange.revertPrice,
        poolPrice: state.priceRange.poolPrice,
        tickLower: state.priceRange.tickLower,
        tickUpper: state.priceRange.tickUpper,
      }),
    [
      pool,
      poolType,
      state.priceRange.poolPrice,
      state.priceRange.revertPrice,
      state.priceRange.tickLower,
      state.priceRange.tickUpper,
      state.route.data,
    ],
  )

  const isZapImpactBlocked =
    !isDegenMode &&
    reviewWarnings.zapImpact !== null &&
    ['VERY_HIGH', 'INVALID'].includes(reviewWarnings.zapImpact.level)
  const isHighZapImpact = reviewWarnings.zapImpact?.level === PI_LEVEL.VERY_HIGH

  const blockingWarnings = useMemo(() => {
    const warnings: { tone: 'warning' | 'error'; message: string }[] = []

    if (!state.route.error && isZapImpactBlocked) {
      warnings.push({
        tone: 'error',
        message: ZAP_IMPACT_BLOCKED_MESSAGE,
      })
    }

    return warnings
  }, [isZapImpactBlocked, state.route.error])

  const pageWarnings = useMemo(() => {
    if (state.route.error) return []

    return reviewWarnings.warnings.filter(warning => warning.kind !== 'zap_impact')
  }, [reviewWarnings.warnings, state.route.error])

  return {
    widget: {
      securityWarnings,
      routeWarnings,
      blockingWarnings,
      isZapImpactBlocked,
      isHighZapImpact,
    },
    page: {
      warnings: pageWarnings,
    },
    modal: {
      warnings: reviewWarnings.warnings,
    },
  }
}

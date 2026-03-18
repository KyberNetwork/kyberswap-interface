import { usePositionOwner } from '@kyber/hooks'
import { NATIVE_TOKEN_ADDRESS, PoolType, Pool as ZapPool, univ4Types } from '@kyber/schema'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useGetHoneypotInfoQuery } from 'services/zapInService'

import { AddLiquidityReviewData } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useReviewData'
import { ZapState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { getSecurityWarnings } from 'pages/Earns/PoolDetail/AddLiquidity/utils'

interface UseAddLiquidityFeedbackProps {
  account?: string
  poolChainId?: number
  poolType?: PoolType
  pool?: ZapPool | null
  positionId?: string
  state: ZapState
  review: AddLiquidityReviewData
  isZapImpactBlocked: boolean
}

const ZAP_IMPACT_BLOCKED_MESSAGE =
  'To protect against very high zap impact, preview is disabled for this route. Turn on Degen Mode in settings if you still want to continue.'

export default function useFeedback({
  account,
  poolChainId,
  poolType,
  pool,
  positionId,
  state,
  review,
  isZapImpactBlocked,
}: UseAddLiquidityFeedbackProps) {
  const shouldShowFeedback = Boolean(account)
  const positionOwner = usePositionOwner({
    positionId: positionId || '',
    chainId: poolChainId || ChainId.MAINNET,
    poolType,
  })
  const isNotPositionOwner = Boolean(
    positionId &&
      account &&
      poolType &&
      univ4Types.includes(poolType as any) &&
      positionOwner &&
      positionOwner !== account.toLowerCase(),
  )

  const tokensToCheck = useMemo(() => {
    if (!pool) return []

    return [pool.token0, pool.token1].filter(
      token => token.address.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase(),
    )
  }, [pool])

  const { data: honeypotInfoMap } = useGetHoneypotInfoQuery(
    {
      chainId: poolChainId || ChainId.MAINNET,
      addresses: tokensToCheck.map(token => token.address),
    },
    {
      skip: !tokensToCheck.length,
    },
  )

  const securityWarnings = useMemo(() => {
    if (!shouldShowFeedback) return []

    return getSecurityWarnings({ tokens: tokensToCheck, honeypotInfoMap })
  }, [honeypotInfoMap, shouldShowFeedback, tokensToCheck])

  const validationWarning = shouldShowFeedback ? state.validation.error : ''
  const routeWarning = shouldShowFeedback && !validationWarning ? state.route.error : ''

  const blockingWarnings = useMemo(() => {
    if (!shouldShowFeedback) return []

    const warnings: { tone: 'warning' | 'error'; message: string }[] = []

    if (isNotPositionOwner && positionId) {
      warnings.push({
        tone: 'warning',
        message: `You are not the current owner of the position #${positionId}, please double check before proceeding`,
      })
    }

    if (!state.route.error && isZapImpactBlocked) {
      warnings.push({
        tone: 'error',
        message: ZAP_IMPACT_BLOCKED_MESSAGE,
      })
    }

    return warnings
  }, [isNotPositionOwner, isZapImpactBlocked, positionId, shouldShowFeedback, state.route.error])

  const pageWarnings = useMemo(() => {
    if (!shouldShowFeedback || state.route.error) return []

    return review.warnings.filter(warning => warning.kind !== 'zap_impact')
  }, [review.warnings, shouldShowFeedback, state.route.error])

  return {
    widget: {
      isNotPositionOwner,
      validationWarning,
      securityWarnings,
      routeWarning,
      blockingWarnings,
    },
    page: {
      warnings: pageWarnings,
    },
  }
}

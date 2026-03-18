import { NATIVE_TOKEN_ADDRESS, Pool as ZapPool } from '@kyber/schema'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useGetHoneypotInfoQuery } from 'services/zapInService'

import { AddLiquidityReviewData } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useReviewData'
import { ZapState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { getSecurityWarnings } from 'pages/Earns/PoolDetail/AddLiquidity/utils'

interface UseAddLiquidityFeedbackProps {
  account?: string
  poolChainId?: number
  pool?: ZapPool | null
  state: ZapState
  review: AddLiquidityReviewData
  isZapImpactBlocked: boolean
}

const ZAP_IMPACT_BLOCKED_MESSAGE =
  'To protect against very high zap impact, preview is disabled for this route. Turn on Degen Mode in settings if you still want to continue.'

export default function useFeedback({
  account,
  poolChainId,
  pool,
  state,
  review,
  isZapImpactBlocked,
}: UseAddLiquidityFeedbackProps) {
  const shouldShowFeedback = Boolean(account)

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
    if (!shouldShowFeedback || state.route.error || !isZapImpactBlocked) return []

    return [
      {
        tone: 'error' as const,
        message: ZAP_IMPACT_BLOCKED_MESSAGE,
      },
    ]
  }, [isZapImpactBlocked, shouldShowFeedback, state.route.error])

  const pageWarnings = useMemo(() => {
    if (!shouldShowFeedback || state.route.error) return []

    return review.warnings.filter(warning => warning.kind !== 'zap_impact')
  }, [review.warnings, shouldShowFeedback, state.route.error])

  return {
    widget: {
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

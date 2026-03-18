import { NATIVE_TOKEN_ADDRESS, Pool as ZapPool } from '@kyber/schema'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { useGetHoneypotInfoQuery } from 'services/zapInService'

import { AddLiquidityReviewData } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useReviewData'
import { ZapState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { getSecurityWarnings } from 'pages/Earns/PoolDetail/AddLiquidity/utils'

type UseFeedbackProps = {
  poolChainId?: number
  pool?: ZapPool | null
  state: ZapState
  review: AddLiquidityReviewData
  isZapImpactBlocked: boolean
}

const ZAP_IMPACT_BLOCKED_MESSAGE =
  'To protect against very high zap impact, preview is disabled for this route. Turn on Degen Mode in settings if you still want to continue.'

export const useFeedback = ({ poolChainId, pool, state, review, isZapImpactBlocked }: UseFeedbackProps) => {
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
    return getSecurityWarnings({ tokens: tokensToCheck, honeypotInfoMap })
  }, [honeypotInfoMap, tokensToCheck])

  const routeWarning = state.route.error

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

    return review.warnings.filter(warning => warning.kind !== 'zap_impact')
  }, [review.warnings, state.route.error])

  return {
    widget: {
      securityWarnings,
      routeWarning,
      blockingWarnings,
    },
    page: {
      warnings: pageWarnings,
    },
  }
}

import { ZapRouteDetail } from '@kyber/schema'
import { friendlyError } from '@kyber/utils'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BuildZapInData } from 'services/zapInService'

import { useActiveWeb3React } from 'hooks'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useAddLiquidityRuntimeContext } from 'pages/Earns/PoolDetail/AddLiquidity/context'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'

type UseReviewBuildProps = {
  isOpen: boolean
  route: ZapRouteDetail
  refetchRoute?: () => Promise<unknown>
  onClearTracking?: () => void
}

type ReviewBuildState = {
  routeSnapshot: ZapRouteDetail | null
  buildData: BuildZapInData | null
  buildError: string | null
  isBuilding: boolean
}

const INITIAL_REVIEW_BUILD_STATE: ReviewBuildState = {
  routeSnapshot: null,
  buildData: null,
  buildError: null,
  isBuilding: false,
}

const getBuildErrorMessage = (error: unknown) =>
  friendlyError(error as Error) || (error as Error)?.message || 'Failed to build zap transaction'

const isRouteRefetchResult = (value: unknown): value is { data?: ZapRouteDetail } =>
  typeof value === 'object' && value !== null && 'data' in value

export const useReviewBuild = ({ isOpen, route, refetchRoute, onClearTracking }: UseReviewBuildProps) => {
  const { account } = useActiveWeb3React()
  const deadline = useTransactionDeadline()
  const { poolParams } = usePoolDetailContext()
  const { buildZapInRoute } = useAddLiquidityRuntimeContext()

  const [reviewBuild, setReviewBuild] = useState(INITIAL_REVIEW_BUILD_STATE)
  const buildAttemptIdRef = useRef(0)
  const buildReviewRef = useRef<(refreshRoute?: boolean) => Promise<boolean>>()

  const chainId = poolParams.poolChainId
  const deadlineValue = deadline ? +deadline.toString() : undefined

  const resetReviewBuild = useCallback(() => {
    buildAttemptIdRef.current += 1
    setReviewBuild(INITIAL_REVIEW_BUILD_STATE)
  }, [])

  const buildReview = useCallback(
    async (refreshRoute = false) => {
      const buildAttemptId = buildAttemptIdRef.current + 1
      buildAttemptIdRef.current = buildAttemptId

      onClearTracking?.()

      if (!account || !chainId || !deadlineValue) {
        setReviewBuild(prev => ({
          ...prev,
          buildData: null,
          buildError: 'Build route is unavailable.',
          isBuilding: false,
        }))
        return false
      }

      setReviewBuild(prev => ({
        ...prev,
        buildData: null,
        buildError: null,
        isBuilding: true,
      }))

      const refreshedRouteResult = refreshRoute ? await refetchRoute?.() : undefined

      if (buildAttemptIdRef.current !== buildAttemptId) return false

      const latestRoute = isRouteRefetchResult(refreshedRouteResult) ? refreshedRouteResult.data || route : route

      if (!latestRoute) {
        setReviewBuild(prev => ({
          ...prev,
          routeSnapshot: null,
          buildData: null,
          buildError: 'No route found.',
          isBuilding: false,
        }))
        return false
      }

      setReviewBuild(prev => ({
        ...prev,
        routeSnapshot: latestRoute,
      }))

      try {
        const buildData = await buildZapInRoute({
          chainId,
          sender: account,
          recipient: account,
          route: latestRoute.route,
          deadline: deadlineValue,
          source: 'kyberswap-earn',
        }).unwrap()

        if (buildAttemptIdRef.current !== buildAttemptId) return false

        setReviewBuild(prev => ({
          ...prev,
          buildData,
          buildError: null,
          isBuilding: false,
        }))
        return true
      } catch (error) {
        if (buildAttemptIdRef.current !== buildAttemptId) return false

        setReviewBuild(prev => ({
          ...prev,
          buildData: null,
          buildError: getBuildErrorMessage(error),
          isBuilding: false,
        }))
        return false
      }
    },
    [account, buildZapInRoute, chainId, deadlineValue, onClearTracking, refetchRoute, route],
  )

  buildReviewRef.current = buildReview

  useEffect(() => {
    if (!isOpen) {
      resetReviewBuild()
      return
    }

    void buildReviewRef.current?.(false)
  }, [isOpen, resetReviewBuild])

  return {
    reviewRoute: reviewBuild.routeSnapshot || route,
    buildData: reviewBuild.buildData,
    buildError: reviewBuild.buildError,
    buildLoading: reviewBuild.isBuilding,
    rebuildReview: async () => {
      await buildReview(true)
    },
  }
}

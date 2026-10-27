import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import type { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'

export type SwapReviewState = {
  phase: 'closed' | 'building' | 'review' | 'preparing' | 'signing' | 'submitted' | 'error'
  buildResult?: BuildRouteResult
  error?: string
  txHash?: string
}

export type BuildReview = (signal: AbortSignal) => Promise<BuildRouteResult>
export type SubmitReview = (onRequestSignature: () => void) => Promise<string>

const closedReview: SwapReviewState = { phase: 'closed' }

export const useSwapReviewSession = (identity: string) => {
  const [review, setReview] = useState<SwapReviewState>(closedReview)
  const current = useRef(review)
  const generation = useRef(0)
  const buildController = useRef<AbortController | null>(null)

  const updateReview = useCallback((next: SwapReviewState) => {
    current.current = next
    setReview(next)
  }, [])

  const invalidate = useCallback(() => {
    generation.current += 1
    buildController.current?.abort()
    buildController.current = null
  }, [])

  const dismissReview = useCallback(() => {
    invalidate()
    updateReview(closedReview)
  }, [invalidate, updateReview])

  useLayoutEffect(() => {
    dismissReview()
    return invalidate
  }, [identity, dismissReview, invalidate])

  const buildReview = useCallback(
    async (build: BuildReview, reopen = false) => {
      const phase = current.current.phase
      if (reopen ? phase !== 'closed' : phase !== 'review' && phase !== 'building') return

      invalidate()

      const request = generation.current
      const controller = new AbortController()
      buildController.current = controller
      updateReview({ phase: 'building' })

      try {
        const buildResult = await build(controller.signal)

        if (generation.current === request && !controller.signal.aborted) {
          updateReview({ phase: 'review', buildResult })
        }
      } catch (error) {
        if (generation.current === request && !controller.signal.aborted) {
          updateReview({
            phase: 'review',
            buildResult: { error: error instanceof Error ? error.message : String(error) },
          })
        }
      } finally {
        if (buildController.current === controller) buildController.current = null
      }
    },
    [invalidate, updateReview],
  )

  const openReview = useCallback((build: BuildReview) => buildReview(build, true), [buildReview])
  const rebuildReview = useCallback((build: BuildReview) => buildReview(build), [buildReview])

  const confirmReview = useCallback(
    async (submit: SubmitReview, onError: (message: string) => void) => {
      if (current.current.phase !== 'review' || !current.current.buildResult?.data) return

      const request = generation.current
      const buildResult = current.current.buildResult
      updateReview({ phase: 'preparing', buildResult })

      try {
        // Submission owns transaction persistence even if this review is dismissed while the wallet is open.
        const txHash = await submit(() => {
          if (generation.current === request) updateReview({ phase: 'signing', buildResult })
        })

        if (generation.current === request) updateReview({ phase: 'submitted', buildResult, txHash })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        if (generation.current === request) updateReview({ phase: 'error', buildResult, error: message })

        onError(message)
      }
    },
    [updateReview],
  )

  return { review, openReview, rebuildReview, confirmReview, dismissReview }
}

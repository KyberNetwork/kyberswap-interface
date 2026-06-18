import { useCallback, useEffect, useRef, useState } from 'react'

import { ApprovalState } from 'hooks/useApproveCallback'
import { TransactionFlowState } from 'types/TransactionFlowState'

export type ProcessingOrderStep = 'wrap' | 'approve' | 'create'
export type ProcessingOrderStepStatus = 'idle' | 'active' | 'success' | 'error'

export type ProcessingOrderState = {
  show: boolean
  steps: ProcessingOrderStep[]
  currentStep?: ProcessingOrderStep
  errorStep?: ProcessingOrderStep
  completedSteps: ProcessingOrderStep[]
}

type UseProcessingOrderArgs = {
  approval: ApprovalState
  approveCallback: () => Promise<void>
  steps: ProcessingOrderStep[]
  isWrappingEth: boolean
  onWrap: (() => Promise<string | undefined>) | undefined
  setTxHashWrapped: (hash: string) => void
  onCreateOrder: () => Promise<number | undefined>
  onError: (error: any) => void
  setFlowState: React.Dispatch<React.SetStateAction<TransactionFlowState>>
}

const DEFAULT_PROCESSING_ORDER: ProcessingOrderState = {
  show: false,
  steps: [],
  completedSteps: [],
}

export default function useProcessingOrder({
  approval,
  approveCallback,
  steps,
  isWrappingEth,
  onWrap,
  setTxHashWrapped,
  onCreateOrder,
  onError,
  setFlowState,
}: UseProcessingOrderArgs) {
  const [processingOrder, setProcessingOrder] = useState<ProcessingOrderState>(DEFAULT_PROCESSING_ORDER)
  const processingStepStartedRef = useRef<ProcessingOrderStep>()
  const approvalRef = useRef<ApprovalState>(ApprovalState.UNKNOWN)

  const markProcessingStepSuccess = useCallback((step: ProcessingOrderStep) => {
    processingStepStartedRef.current = undefined
    setProcessingOrder(state => {
      if (!state.show || state.currentStep !== step) return state
      const completedSteps = state.completedSteps.includes(step)
        ? state.completedSteps
        : [...state.completedSteps, step]
      const nextStep = state.steps[state.steps.indexOf(step) + 1]
      return {
        ...state,
        currentStep: nextStep,
        completedSteps,
      }
    })
  }, [])

  const markProcessingStepError = useCallback((step: ProcessingOrderStep) => {
    processingStepStartedRef.current = undefined
    setProcessingOrder(state => {
      if (!state.show || state.currentStep !== step) return state
      return {
        ...state,
        errorStep: step,
      }
    })
  }, [])

  const hideProcessingOrder = useCallback(() => {
    processingStepStartedRef.current = undefined
    setProcessingOrder(DEFAULT_PROCESSING_ORDER)
  }, [])

  const retryProcessingStep = useCallback((step: ProcessingOrderStep) => {
    processingStepStartedRef.current = undefined
    setProcessingOrder(state => {
      if (state.errorStep !== step) return state
      return {
        ...state,
        currentStep: step,
        errorStep: undefined,
      }
    })
  }, [])

  const runProcessingStep = useCallback(
    (step: ProcessingOrderStep) => {
      if (step === 'wrap') {
        if (isWrappingEth || processingStepStartedRef.current === 'wrap') return
        processingStepStartedRef.current = 'wrap'
        ;(async () => {
          try {
            const hash = await onWrap?.()
            if (!hash) {
              markProcessingStepError('wrap')
              return
            }
            setTxHashWrapped(hash)
          } catch (error) {
            onError(error)
            markProcessingStepError('wrap')
          }
        })()
        return
      }

      if (step === 'approve') {
        if (approval === ApprovalState.APPROVED) {
          markProcessingStepSuccess('approve')
          return
        }
        if (approval === ApprovalState.UNKNOWN || approval === ApprovalState.PENDING) return
        if (processingStepStartedRef.current === 'approve') return
        processingStepStartedRef.current = 'approve'
        ;(async () => {
          try {
            await approveCallback()
            setTimeout(() => {
              if (approvalRef.current === ApprovalState.NOT_APPROVED) {
                markProcessingStepError('approve')
              }
            }, 800)
          } catch (error) {
            onError(error)
            markProcessingStepError('approve')
          }
        })()
        return
      }

      if (processingStepStartedRef.current === 'create') return
      processingStepStartedRef.current = 'create'
      ;(async () => {
        try {
          const orderId = await onCreateOrder()
          if (orderId) {
            markProcessingStepSuccess('create')
            return
          }
          markProcessingStepError('create')
        } catch (error) {
          onError(error)
          markProcessingStepError('create')
        }
      })()
    },
    [
      approval,
      approveCallback,
      isWrappingEth,
      markProcessingStepError,
      markProcessingStepSuccess,
      onCreateOrder,
      onError,
      onWrap,
      setTxHashWrapped,
    ],
  )

  const startProcessingOrder = useCallback(() => {
    processingStepStartedRef.current = undefined
    setFlowState(state => ({ ...state, showConfirm: false, errorMessage: undefined }))
    setProcessingOrder({
      show: true,
      steps,
      currentStep: steps[0],
      completedSteps: [],
    })
  }, [setFlowState, steps])

  useEffect(() => {
    approvalRef.current = approval
  }, [approval])

  return {
    hideProcessingOrder,
    processingOrder,
    retryProcessingStep,
    runProcessingStep,
    startProcessingOrder,
  }
}

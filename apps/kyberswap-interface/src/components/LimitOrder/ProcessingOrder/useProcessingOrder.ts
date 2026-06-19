import { waitForTransactionReceipt } from '@wagmi/core'
import { Dispatch, SetStateAction, useCallback } from 'react'

import { wagmiConfig } from 'components/Web3Provider'
import { ApprovalState } from 'hooks/useApproveCallback'

export type ProcessingOrderStep = 'wrap' | 'approve' | 'create'
export type ProcessingOrderStepStatus = 'idle' | 'active' | 'success' | 'error'

export type ProcessingOrderState = {
  show: boolean
  steps: ProcessingOrderStep[]
  currentStep?: ProcessingOrderStep
  errorStep?: ProcessingOrderStep
  completedSteps: ProcessingOrderStep[]
}

export type ProcessingOrderController = {
  state: ProcessingOrderState
  start: () => void
  dismiss: () => void
  retryStep: (step: ProcessingOrderStep) => void
}

type UseProcessingOrderArgs = {
  processingOrder: ProcessingOrderState
  setProcessingOrder: Dispatch<SetStateAction<ProcessingOrderState>>
  chainId: number
  approval: ApprovalState
  approveCallback: () => Promise<void>
  checkApprovalManually: () => Promise<boolean>
  steps: ProcessingOrderStep[]
  onWrap: (() => Promise<string | undefined>) | undefined
  onWrapSuccess?: () => void
  onCreateOrder: () => Promise<number | undefined>
  onError?: (error: unknown) => void
  onStart?: () => void
}

export const DEFAULT_PROCESSING_ORDER: ProcessingOrderState = {
  show: false,
  steps: [],
  completedSteps: [],
}

const APPROVAL_CHECK_RETRY_COUNT = 8
const APPROVAL_CHECK_RETRY_DELAY = 2_000
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const useProcessingOrder = ({
  processingOrder,
  setProcessingOrder,
  chainId,
  approval,
  approveCallback,
  checkApprovalManually,
  steps,
  onWrap,
  onWrapSuccess,
  onCreateOrder,
  onError,
  onStart,
}: UseProcessingOrderArgs) => {
  const markProcessingStepSuccess = useCallback(
    (step: ProcessingOrderStep) => {
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
    },
    [setProcessingOrder],
  )

  const markProcessingStepError = useCallback(
    (step: ProcessingOrderStep) => {
      setProcessingOrder(state => {
        if (!state.show || state.currentStep !== step) return state
        return {
          ...state,
          errorStep: step,
        }
      })
    },
    [setProcessingOrder],
  )

  const hideProcessingOrder = useCallback(() => {
    setProcessingOrder(DEFAULT_PROCESSING_ORDER)
  }, [setProcessingOrder])

  const waitForManualApproval = useCallback(async () => {
    for (let attempt = 0; attempt < APPROVAL_CHECK_RETRY_COUNT; attempt++) {
      const hasEnoughAllowance = await checkApprovalManually()
      if (hasEnoughAllowance) return true
      await sleep(APPROVAL_CHECK_RETRY_DELAY)
    }

    return false
  }, [checkApprovalManually])

  const runWrapStep = useCallback(() => {
    return (async () => {
      try {
        const hash = await onWrap?.()
        if (!hash) {
          markProcessingStepError('wrap')
          return false
        }
        const receipt = await waitForTransactionReceipt(wagmiConfig, {
          chainId: chainId as (typeof wagmiConfig)['chains'][number]['id'],
          hash: hash as `0x${string}`,
        })
        if (receipt.status === 'reverted') {
          markProcessingStepError('wrap')
          return false
        }
        onWrapSuccess?.()
        markProcessingStepSuccess('wrap')
        return true
      } catch (error) {
        onError?.(error)
        markProcessingStepError('wrap')
        return false
      }
    })()
  }, [chainId, markProcessingStepError, markProcessingStepSuccess, onError, onWrap, onWrapSuccess])

  const runApproveStep = useCallback(() => {
    return (async () => {
      try {
        if (await checkApprovalManually()) {
          markProcessingStepSuccess('approve')
          return true
        }

        if (approval !== ApprovalState.PENDING) {
          await approveCallback()
        }

        const hasEnoughAllowance = await waitForManualApproval()
        if (hasEnoughAllowance) {
          markProcessingStepSuccess('approve')
          return true
        }

        markProcessingStepError('approve')
        return false
      } catch (error) {
        onError?.(error)
        markProcessingStepError('approve')
        return false
      }
    })()
  }, [
    approval,
    approveCallback,
    checkApprovalManually,
    markProcessingStepError,
    markProcessingStepSuccess,
    onError,
    waitForManualApproval,
  ])

  const runCreateStep = useCallback(() => {
    return (async () => {
      try {
        const orderId = await onCreateOrder()
        if (orderId) {
          markProcessingStepSuccess('create')
          return true
        }
        markProcessingStepError('create')
        return false
      } catch (error) {
        onError?.(error)
        markProcessingStepError('create')
        return false
      }
    })()
  }, [markProcessingStepError, markProcessingStepSuccess, onCreateOrder, onError])

  const runProcessingStep = useCallback(
    (step: ProcessingOrderStep) => {
      if (step === 'wrap') {
        return runWrapStep()
      }

      if (step === 'approve') {
        return runApproveStep()
      }

      return runCreateStep()
    },
    [runApproveStep, runCreateStep, runWrapStep],
  )

  const runProcessingSequence = useCallback(
    async (firstStep: ProcessingOrderStep, processingSteps: ProcessingOrderStep[]) => {
      const startIndex = processingSteps.indexOf(firstStep)
      if (startIndex < 0) return

      for (const step of processingSteps.slice(startIndex)) {
        setProcessingOrder(state => (state.show ? { ...state, currentStep: step, errorStep: undefined } : state))

        const isStepSuccess = await runProcessingStep(step)
        if (!isStepSuccess) return
      }
    },
    [runProcessingStep, setProcessingOrder],
  )

  const retryProcessingStep = useCallback(
    (step: ProcessingOrderStep) => {
      setProcessingOrder(state => ({
        ...state,
        currentStep: step,
        errorStep: undefined,
      }))
      void runProcessingSequence(step, processingOrder.steps)
    },
    [processingOrder.steps, runProcessingSequence, setProcessingOrder],
  )

  const startProcessingOrder = useCallback(() => {
    const firstStep = steps[0]
    if (!firstStep) return

    onStart?.()
    setProcessingOrder({
      show: true,
      steps,
      currentStep: firstStep,
      completedSteps: [],
    })
    void runProcessingSequence(firstStep, steps)
  }, [onStart, runProcessingSequence, setProcessingOrder, steps])

  return {
    state: processingOrder,
    start: startProcessingOrder,
    dismiss: hideProcessingOrder,
    retryStep: retryProcessingStep,
  }
}

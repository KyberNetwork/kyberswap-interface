import { waitForTransactionReceipt } from '@wagmi/core'
import { Dispatch, SetStateAction } from 'react'

import { wagmiConfig } from 'components/Web3Provider'
import { ApprovalState, ApprovalStatus } from 'hooks/useApproveCallback'

export type ProcessingOrderStep = 'wrap' | 'approve' | 'create' | 'fill'
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
  approveCallback: () => Promise<ApprovalStatus>
  checkApprovalManually: () => Promise<boolean>
  steps: ProcessingOrderStep[]
  onWrap: (() => Promise<string | undefined>) | undefined
  onWrapSuccess?: () => void
  finalStep: Extract<ProcessingOrderStep, 'create' | 'fill'>
  onFinalStep: () => Promise<boolean>
  onError?: (error: unknown, step: ProcessingOrderStep) => void
  onStart?: () => void
}

export const DEFAULT_PROCESSING_ORDER: ProcessingOrderState = {
  show: false,
  steps: [],
  completedSteps: [],
}

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
  finalStep,
  onFinalStep,
  onError,
  onStart,
}: UseProcessingOrderArgs) => {
  const markProcessingStepSuccess = (step: ProcessingOrderStep) => {
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
  }

  const markProcessingStepError = (step: ProcessingOrderStep) => {
    setProcessingOrder(state => {
      if (!state.show || state.currentStep !== step) return state
      return {
        ...state,
        errorStep: step,
      }
    })
  }

  const hideProcessingOrder = () => {
    setProcessingOrder(DEFAULT_PROCESSING_ORDER)
  }

  const waitForManualApproval = async () => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const hasEnoughAllowance = await checkApprovalManually()
      if (hasEnoughAllowance) return true
      await sleep(2000)
    }

    return false
  }

  const runWrapStep = async () => {
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
      onError?.(error, 'wrap')
      markProcessingStepError('wrap')
      return false
    }
  }

  const runApproveStep = async () => {
    try {
      if (await checkApprovalManually()) {
        markProcessingStepSuccess('approve')
        return true
      }

      if (approval !== ApprovalState.PENDING) {
        const approvalStatus = await approveCallback()
        if (approvalStatus === ApprovalStatus.REJECTED || approvalStatus === ApprovalStatus.FAILED) {
          markProcessingStepError('approve')
          return false
        }
      }

      const hasEnoughAllowance = await waitForManualApproval()
      if (hasEnoughAllowance) {
        markProcessingStepSuccess('approve')
        return true
      }

      markProcessingStepError('approve')
      return false
    } catch (error) {
      onError?.(error, 'approve')
      markProcessingStepError('approve')
      return false
    }
  }

  const runFinalStep = async () => {
    try {
      const success = await onFinalStep()
      if (success) {
        markProcessingStepSuccess(finalStep)
        return true
      }
      markProcessingStepError(finalStep)
      return false
    } catch (error) {
      onError?.(error, finalStep)
      markProcessingStepError(finalStep)
      return false
    }
  }

  const runProcessingStep = (step: ProcessingOrderStep) => {
    if (step === 'wrap') {
      return runWrapStep()
    }

    if (step === 'approve') {
      return runApproveStep()
    }

    return runFinalStep()
  }

  const runProcessingSequence = async (firstStep: ProcessingOrderStep, processingSteps: ProcessingOrderStep[]) => {
    const startIndex = processingSteps.indexOf(firstStep)
    if (startIndex < 0) return

    for (const step of processingSteps.slice(startIndex)) {
      setProcessingOrder(state => (state.show ? { ...state, currentStep: step, errorStep: undefined } : state))

      const isStepSuccess = await runProcessingStep(step)
      if (!isStepSuccess) return
    }
  }

  const retryProcessingStep = (step: ProcessingOrderStep) => {
    setProcessingOrder(state => ({
      ...state,
      currentStep: step,
      errorStep: undefined,
    }))
    void runProcessingSequence(step, processingOrder.steps)
  }

  const startProcessingOrder = () => {
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
  }

  return {
    state: processingOrder,
    start: startProcessingOrder,
    dismiss: hideProcessingOrder,
    retryStep: retryProcessingStep,
  }
}

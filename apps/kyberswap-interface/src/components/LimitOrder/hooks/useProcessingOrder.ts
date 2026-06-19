import { useCallback, useEffect, useRef, useState } from 'react'

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
  approval: ApprovalState
  approveCallback: () => Promise<void>
  checkApprovalManually: () => Promise<boolean>
  steps: ProcessingOrderStep[]
  isWrappingEth: boolean
  onWrap: (() => Promise<string | undefined>) | undefined
  setTxHashWrapped?: (hash: string) => void
  onCreateOrder: () => Promise<number | undefined>
  onError?: (error: unknown) => void
  onStart?: () => void
}

const DEFAULT_PROCESSING_ORDER: ProcessingOrderState = {
  show: false,
  steps: [],
  completedSteps: [],
}

const APPROVAL_CHECK_RETRY_COUNT = 8
const APPROVAL_CHECK_RETRY_DELAY = 2_000
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const useProcessingOrder = ({
  approval,
  approveCallback,
  checkApprovalManually,
  steps,
  isWrappingEth,
  onWrap,
  setTxHashWrapped,
  onCreateOrder,
  onError,
  onStart,
}: UseProcessingOrderArgs) => {
  const [processingOrder, setProcessingOrder] = useState<ProcessingOrderState>(DEFAULT_PROCESSING_ORDER)
  const processingStepStartedRef = useRef<ProcessingOrderStep>()
  const processingRunIdRef = useRef(0)
  const wrapTransactionPendingRef = useRef(false)

  const isCurrentProcessingRun = useCallback((processingRunId: number) => {
    return processingRunIdRef.current === processingRunId
  }, [])

  const startProcessingStepRun = useCallback((step: ProcessingOrderStep) => {
    if (processingStepStartedRef.current === step) return
    processingStepStartedRef.current = step
    return processingRunIdRef.current
  }, [])

  const invalidateProcessingRun = useCallback(() => {
    processingRunIdRef.current += 1
    processingStepStartedRef.current = undefined
    wrapTransactionPendingRef.current = false
  }, [])

  const markProcessingStepSuccess = useCallback((step: ProcessingOrderStep) => {
    processingStepStartedRef.current = undefined
    if (step === 'wrap') wrapTransactionPendingRef.current = false
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
    if (step === 'wrap') wrapTransactionPendingRef.current = false
    setProcessingOrder(state => {
      if (!state.show || state.currentStep !== step) return state
      return {
        ...state,
        errorStep: step,
      }
    })
  }, [])

  const hideProcessingOrder = useCallback(() => {
    invalidateProcessingRun()
    setProcessingOrder(DEFAULT_PROCESSING_ORDER)
  }, [invalidateProcessingRun])

  const retryProcessingStep = useCallback(
    (step: ProcessingOrderStep) => {
      invalidateProcessingRun()
      setProcessingOrder(state => {
        if (state.errorStep !== step) return state
        return {
          ...state,
          currentStep: step,
          errorStep: undefined,
        }
      })
    },
    [invalidateProcessingRun],
  )

  const waitForManualApproval = useCallback(
    async (processingRunId: number) => {
      for (let attempt = 0; attempt < APPROVAL_CHECK_RETRY_COUNT; attempt++) {
        if (!isCurrentProcessingRun(processingRunId)) return
        const hasEnoughAllowance = await checkApprovalManually()
        if (!isCurrentProcessingRun(processingRunId)) return
        if (hasEnoughAllowance) return true
        await sleep(APPROVAL_CHECK_RETRY_DELAY)
      }

      return false
    },
    [checkApprovalManually, isCurrentProcessingRun],
  )

  const runWrapStep = useCallback(() => {
    if (isWrappingEth) return
    const processingRunId = startProcessingStepRun('wrap')
    if (processingRunId === undefined) return

    void (async () => {
      try {
        const hash = await onWrap?.()
        if (!isCurrentProcessingRun(processingRunId)) return
        if (!hash) {
          markProcessingStepError('wrap')
          return
        }
        setTxHashWrapped?.(hash)
      } catch (error) {
        if (!isCurrentProcessingRun(processingRunId)) return
        onError?.(error)
        markProcessingStepError('wrap')
      }
    })()
  }, [
    isCurrentProcessingRun,
    isWrappingEth,
    markProcessingStepError,
    onError,
    onWrap,
    setTxHashWrapped,
    startProcessingStepRun,
  ])

  const runApproveStep = useCallback(() => {
    const processingRunId = startProcessingStepRun('approve')
    if (processingRunId === undefined) return

    void (async () => {
      try {
        if (await checkApprovalManually()) {
          if (!isCurrentProcessingRun(processingRunId)) return
          markProcessingStepSuccess('approve')
          return
        }

        if (approval !== ApprovalState.PENDING) {
          await approveCallback()
        }

        const hasEnoughAllowance = await waitForManualApproval(processingRunId)
        if (!isCurrentProcessingRun(processingRunId)) return
        if (hasEnoughAllowance) {
          markProcessingStepSuccess('approve')
          return
        }

        markProcessingStepError('approve')
      } catch (error) {
        if (!isCurrentProcessingRun(processingRunId)) return
        onError?.(error)
        markProcessingStepError('approve')
      }
    })()
  }, [
    approval,
    approveCallback,
    checkApprovalManually,
    isCurrentProcessingRun,
    markProcessingStepError,
    markProcessingStepSuccess,
    onError,
    startProcessingStepRun,
    waitForManualApproval,
  ])

  const runCreateStep = useCallback(() => {
    const processingRunId = startProcessingStepRun('create')
    if (processingRunId === undefined) return

    void (async () => {
      try {
        const orderId = await onCreateOrder()
        if (!isCurrentProcessingRun(processingRunId)) return
        if (orderId) {
          markProcessingStepSuccess('create')
          return
        }
        markProcessingStepError('create')
      } catch (error) {
        if (!isCurrentProcessingRun(processingRunId)) return
        onError?.(error)
        markProcessingStepError('create')
      }
    })()
  }, [
    isCurrentProcessingRun,
    markProcessingStepError,
    markProcessingStepSuccess,
    onCreateOrder,
    onError,
    startProcessingStepRun,
  ])

  const runProcessingStep = useCallback(
    (step: ProcessingOrderStep) => {
      if (step === 'wrap') {
        runWrapStep()
        return
      }

      if (step === 'approve') {
        runApproveStep()
        return
      }

      runCreateStep()
    },
    [runApproveStep, runCreateStep, runWrapStep],
  )

  const startProcessingOrder = useCallback(() => {
    invalidateProcessingRun()
    onStart?.()
    setProcessingOrder({
      show: true,
      steps,
      currentStep: steps[0],
      completedSteps: [],
    })
  }, [invalidateProcessingRun, onStart, steps])

  useEffect(() => {
    if (isWrappingEth) {
      wrapTransactionPendingRef.current = true
      return
    }

    if (wrapTransactionPendingRef.current && processingStepStartedRef.current === 'wrap') {
      markProcessingStepSuccess('wrap')
    }
  }, [isWrappingEth, markProcessingStepSuccess])

  useEffect(() => {
    if (!processingOrder.show || !processingOrder.currentStep || processingOrder.errorStep) return
    runProcessingStep(processingOrder.currentStep)
  }, [processingOrder.currentStep, processingOrder.errorStep, processingOrder.show, runProcessingStep])

  return {
    state: processingOrder,
    start: startProcessingOrder,
    dismiss: hideProcessingOrder,
    retryStep: retryProcessingStep,
  }
}

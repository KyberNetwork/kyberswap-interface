import { waitForTransactionReceipt } from '@wagmi/core'
import { Dispatch, SetStateAction, useCallback, useRef, useState } from 'react'

import { wagmiConfig } from 'components/Web3Provider'
import { ApprovalState, ApprovalStatus } from 'hooks/useApproveCallback'
import { wait } from 'utils/retry'

export type ProcessingStepStatus = 'idle' | 'active' | 'success' | 'error'

export type ProcessingState<Step extends string> = {
  show: boolean
  steps: Step[]
  currentStep?: Step
  errorStep?: Step
  completedSteps: Step[]
  /**
   * False when the failed step may already have landed on chain, so re-running it would send a
   * second transaction. The modal drops its Retry button in that case.
   */
  canRetry: boolean
  /** Hash of the final transaction, once it has one — the modal links it to the explorer. */
  txHash?: string
}

export type ProcessingController<Step extends string> = {
  state: ProcessingState<Step>
  start: () => void
  dismiss: () => void
  retryStep: (step: Step) => void
}

type UseProcessingStepsProps<Step extends string> = {
  state: ProcessingState<Step>
  setState: Dispatch<SetStateAction<ProcessingState<Step>>>
  chainId: number
  steps: Step[]

  approval: ApprovalState
  approveCallback: () => Promise<ApprovalStatus>
  checkApprovalManually: () => Promise<boolean>
  /** Which step id runs the allowance. */
  approveStep: Step
  /** Which step id runs `onFinalStep` — the one the flow exists for. */
  actionStep: Step

  /** Optional wrap step; always waits for its receipt before moving on. */
  wrapStep?: Step
  onWrap?: () => Promise<string | undefined>
  onWrapSuccess?: () => void

  /**
   * Runs the action step. Returns `true` when the step is done on return — a signature, or a
   * transaction the caller does not want waited on — or a transaction hash, which is awaited to a
   * receipt before the step counts as successful. Anything falsy fails the step, as does a reverted
   * receipt.
   */
  onFinalStep: () => Promise<boolean | string | undefined>

  onError?: (error: unknown, step: Step) => void
  onStart?: () => void
  /** Fired once every step has succeeded. */
  onComplete?: () => void
}

/** Budget for an approval to confirm. Mainnet approvals routinely take more than a minute. */
const APPROVAL_WAIT_MS = 180_000
const APPROVAL_POLL_MIN_MS = 1_000
const APPROVAL_POLL_MAX_MS = 5_000

// A fallback RPC can lag the block the transaction landed in, so the receipt is polled rather than
// read once — but only for long enough to cover that lag.
const RECEIPT_POLLING_INTERVAL_MS = 2_000
const RECEIPT_RETRY_COUNT = 3
const RECEIPT_TIMEOUT_MS = 60_000

type ReceiptOutcome = 'mined' | 'reverted' | 'unknown'

const defaultProcessingState = <Step extends string>(): ProcessingState<Step> => ({
  show: false,
  steps: [],
  completedSteps: [],
  canRetry: true,
})

/**
 * Holds the state `useProcessingSteps` drives. It lives outside the controller so a caller can read
 * `show` before building the arguments the controller needs — pausing a quote poll, typically.
 */
export const useProcessingState = <Step extends string>() => {
  const [state, setState] = useState(defaultProcessingState<Step>)
  return { state, setState }
}

/**
 * Runs a short sequence of on-chain steps and reports where it has got to, so a confirmation can
 * stay on screen until the work is done.
 *
 * Steps are named by the caller, which is what lets the same machine run "approve → fill" for a
 * limit order and "approve → deposit" for a vault: each step id is mapped to its kind explicitly.
 */
export const useProcessingSteps = <Step extends string>({
  state,
  setState,
  chainId,
  steps,
  approval,
  approveCallback,
  checkApprovalManually,
  approveStep,
  actionStep,
  wrapStep,
  onWrap,
  onWrapSuccess,
  onFinalStep,
  onError,
  onStart,
  onComplete,
}: UseProcessingStepsProps<Step>): ProcessingController<Step> => {
  // Identifies the run in flight. Dismissing or restarting bumps it, which is how an awaited step
  // learns that the run it belongs to is over and must not advance to the next transaction.
  const runIdRef = useRef(0)
  const isRunningRef = useRef(false)

  const isCurrentRun = (runId: number) => runIdRef.current === runId

  const markStepSuccess = (step: Step) => {
    setState(current => {
      if (!current.show || current.currentStep !== step) return current
      const completedSteps = current.completedSteps.includes(step)
        ? current.completedSteps
        : [...current.completedSteps, step]
      return {
        ...current,
        currentStep: current.steps[current.steps.indexOf(step) + 1],
        completedSteps,
      }
    })
  }

  const markStepError = (step: Step, canRetry = true) => {
    setState(current => {
      if (!current.show || current.currentStep !== step) return current
      return { ...current, errorStep: step, canRetry }
    })
  }

  const dismiss = useCallback(() => {
    runIdRef.current += 1
    isRunningRef.current = false
    setState(defaultProcessingState<Step>())
  }, [setState])

  const waitForReceipt = async (hash: string): Promise<ReceiptOutcome> => {
    try {
      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        chainId: chainId as (typeof wagmiConfig)['chains'][number]['id'],
        hash: hash as `0x${string}`,
        pollingInterval: RECEIPT_POLLING_INTERVAL_MS,
        retryCount: RECEIPT_RETRY_COUNT,
        timeout: RECEIPT_TIMEOUT_MS,
      })
      return receipt.status === 'reverted' ? 'reverted' : 'mined'
    } catch {
      // The transaction is out there; this only means its outcome could not be read.
      return 'unknown'
    }
  }

  const waitForApproval = async (runId: number) => {
    const deadline = Date.now() + APPROVAL_WAIT_MS
    let delay = APPROVAL_POLL_MIN_MS

    while (Date.now() < deadline) {
      await wait(delay)
      if (!isCurrentRun(runId)) return false
      if (await checkApprovalManually()) return true
      delay = Math.min(delay * 2, APPROVAL_POLL_MAX_MS)
    }
    return false
  }

  const runWrapStep = async (step: Step) => {
    try {
      const hash = await onWrap?.()
      if (!hash) {
        markStepError(step)
        return false
      }

      const outcome = await waitForReceipt(hash)
      if (outcome !== 'mined') {
        markStepError(step, outcome === 'reverted')
        return false
      }

      onWrapSuccess?.()
      markStepSuccess(step)
      return true
    } catch (error) {
      onError?.(error, step)
      markStepError(step)
      return false
    }
  }

  const runApproveStep = async (step: Step, runId: number) => {
    try {
      if (await checkApprovalManually()) {
        markStepSuccess(step)
        return true
      }

      // A pending approval is already on its way; asking the wallet again would only duplicate it.
      if (approval !== ApprovalState.PENDING) {
        const status = await approveCallback()
        // SKIPPED means nothing was sent, and the live allowance has just said one is needed.
        if (status !== ApprovalStatus.SUBMITTED) {
          markStepError(step)
          return false
        }
      }

      if (await waitForApproval(runId)) {
        markStepSuccess(step)
        return true
      }

      markStepError(step)
      return false
    } catch (error) {
      onError?.(error, step)
      markStepError(step)
      return false
    }
  }

  const runFinalStep = async (step: Step) => {
    try {
      const result = await onFinalStep()
      if (!result) {
        markStepError(step)
        return false
      }

      if (typeof result === 'string') {
        setState(current => (current.show ? { ...current, txHash: result } : current))
        const outcome = await waitForReceipt(result)
        if (outcome !== 'mined') {
          // An unread receipt is not a failed transaction: retrying would send a second one.
          markStepError(step, outcome === 'reverted')
          return false
        }
      }

      markStepSuccess(step)
      return true
    } catch (error) {
      onError?.(error, step)
      markStepError(step)
      return false
    }
  }

  const runStep = (step: Step, runId: number) => {
    if (wrapStep && step === wrapStep) return runWrapStep(step)
    if (step === approveStep) return runApproveStep(step, runId)
    if (step === actionStep) return runFinalStep(step)

    markStepError(step, false)
    return Promise.resolve(false)
  }

  const runSequence = async (firstStep: Step, sequence: Step[], runId: number) => {
    const startIndex = sequence.indexOf(firstStep)
    if (startIndex < 0) return

    isRunningRef.current = true
    try {
      for (const step of sequence.slice(startIndex)) {
        if (!isCurrentRun(runId)) return
        setState(current => (current.show ? { ...current, currentStep: step, errorStep: undefined } : current))
        if (!(await runStep(step, runId))) return
      }
      if (isCurrentRun(runId)) onComplete?.()
    } finally {
      if (isCurrentRun(runId)) isRunningRef.current = false
    }
  }

  const retryStep = (step: Step) => {
    if (isRunningRef.current || !state.show) return

    const runId = ++runIdRef.current
    setState(current =>
      current.show
        ? { ...current, currentStep: step, errorStep: undefined, canRetry: true, txHash: undefined }
        : current,
    )
    void runSequence(step, state.steps, runId)
  }

  const start = () => {
    const firstStep = steps[0]
    if (!firstStep || isRunningRef.current) return

    const runId = ++runIdRef.current
    onStart?.()
    setState({ show: true, steps, currentStep: firstStep, completedSteps: [], canRetry: true })
    void runSequence(firstStep, steps, runId)
  }

  return { state, start, dismiss, retryStep }
}

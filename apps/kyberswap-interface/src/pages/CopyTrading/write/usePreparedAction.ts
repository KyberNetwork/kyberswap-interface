import { getPublicClient } from '@wagmi/core'
import type { Dispatch, SetStateAction } from 'react'
import type { PreparedAction } from 'services/copyTrading/types'

import { wagmiConfig } from 'components/Web3Provider'
import {
  type PreparedActionExpectation,
  getApiErrorMessage,
  getPreparedReasonMessage,
  getReprepareDelay,
  isRetryableApiError,
  validatePreparedAction,
  validatePreparedActionContinuation,
  wait,
} from 'pages/CopyTrading/write/preparedAction'
import type { Hash, Hex, Address as ViemAddress } from 'utils/viem'
import { getGatedWalletClient } from 'utils/walletClient'

export type PreparedActionPhase =
  | 'idle'
  | 'preparing'
  | 'review'
  | 'awaiting_signature'
  | 'confirming'
  | 'syncing'
  | 'pending'
  | 'unavailable'
  | 'success'
  | 'error'
  | 'sync_error'

export type PreparedActionFlowState = {
  phase: PreparedActionPhase
  action?: PreparedAction
  error?: string
  hash?: Hash
  retryStage?: 'receipt' | 'sync'
}

export const DEFAULT_PREPARED_ACTION_STATE: PreparedActionFlowState = { phase: 'idle' }

export type PreparedActionReceiptOutcome = 'complete' | 'reprepare'

type UsePreparedActionProps = {
  state: PreparedActionFlowState
  setState: Dispatch<SetStateAction<PreparedActionFlowState>>
  expected: PreparedActionExpectation
  prepare: () => Promise<PreparedAction>
  reviewUnavailable?: (action: PreparedAction) => boolean
  afterReceipt?: (
    action: PreparedAction,
    hash: Hash,
  ) => PreparedActionReceiptOutcome | Promise<PreparedActionReceiptOutcome>
  onComplete?: () => Promise<void> | void
}

const CONTINUATION_ATTEMPTS = 6
type PreparedActionStateSetter = Dispatch<SetStateAction<PreparedActionFlowState>>
const preparationRequestVersions = new WeakMap<PreparedActionStateSetter, number>()

const invalidatePreparationRequests = (setState: PreparedActionStateSetter) => {
  const nextVersion = (preparationRequestVersions.get(setState) || 0) + 1
  preparationRequestVersions.set(setState, nextVersion)
  return nextVersion
}

const isCurrentPreparationRequest = (setState: PreparedActionStateSetter, version: number) =>
  preparationRequestVersions.get(setState) === version

export const usePreparedAction = ({
  state,
  setState,
  expected,
  prepare,
  reviewUnavailable,
  afterReceipt,
  onComplete,
}: UsePreparedActionProps) => {
  const finish = (action?: PreparedAction, hash?: Hash, preparationVersion?: number) => {
    if (preparationVersion !== undefined && !isCurrentPreparationRequest(setState, preparationVersion)) {
      return
    }
    setState({ phase: 'success', action, hash })
    void Promise.resolve()
      .then(() => {
        if (preparationVersion !== undefined && !isCurrentPreparationRequest(setState, preparationVersion)) {
          return
        }
        return onComplete?.()
      })
      .catch(() => undefined)
  }

  const requestPreparation = async ({ continuation = false, hash }: { continuation?: boolean; hash?: Hash } = {}) => {
    const preparationVersion = invalidatePreparationRequests(setState)
    const isCurrent = () => isCurrentPreparationRequest(setState, preparationVersion)

    setState(current => ({
      phase: continuation ? 'syncing' : 'preparing',
      action: continuation ? current.action : undefined,
      hash,
    }))

    for (let attempt = 0; attempt < CONTINUATION_ATTEMPTS; attempt++) {
      let action: PreparedAction
      try {
        action = await prepare()
      } catch (error) {
        if (!isCurrent()) return
        if (continuation && attempt < CONTINUATION_ATTEMPTS - 1 && isRetryableApiError(error)) {
          await wait(2_000)
          if (!isCurrent()) return
          continue
        }

        setState(current => ({
          phase: continuation ? 'sync_error' : 'error',
          action: continuation ? current.action : undefined,
          error: getApiErrorMessage(error),
          hash,
          retryStage: continuation ? 'sync' : undefined,
        }))
        return
      }
      if (!isCurrent()) return

      if (action.status === 'PREPARED_ACTION_STATUS_PENDING') {
        const validationError = validatePreparedAction(action, expected, { requireCall: false })
        if (validationError) {
          setState({ phase: 'error', action, error: validationError, hash })
          return
        }
        if (continuation && attempt < CONTINUATION_ATTEMPTS - 1) {
          await wait(getReprepareDelay(action))
          if (!isCurrent()) return
          continue
        }
        setState({ phase: 'pending', action, error: getPreparedReasonMessage(action.reason), hash })
        return
      }

      if (action.status === 'PREPARED_ACTION_STATUS_UNAVAILABLE') {
        if (!continuation && reviewUnavailable?.(action)) {
          const validationError = validatePreparedAction(action, expected, { requireCall: false })
          if (validationError) {
            setState({ phase: 'error', action, error: validationError, hash })
            return
          }
          setState({ phase: 'review', action, hash })
          return
        }
        setState({ phase: 'unavailable', action, error: getPreparedReasonMessage(action.reason), hash })
        return
      }

      if (action.status === 'PREPARED_ACTION_STATUS_COMPLETED') {
        const validationError = validatePreparedAction(action, expected, { requireCall: false })
        if (validationError) {
          setState({ phase: 'error', action, error: validationError, hash })
          return
        }
        finish(action, hash, preparationVersion)
        return
      }

      if (
        action.status !== 'PREPARED_ACTION_STATUS_READY' &&
        action.status !== 'PREPARED_ACTION_STATUS_PARTIALLY_COMPLETED'
      ) {
        setState({ phase: 'error', action, error: 'The API returned an unsupported preparation status.', hash })
        return
      }

      if (continuation) {
        const continuationError = validatePreparedActionContinuation(action)
        setState({
          phase: 'sync_error',
          action,
          error: continuationError || 'The confirmed transaction returned an unsupported continuation state.',
          hash,
          retryStage: 'sync',
        })
        return
      }

      const validationError = validatePreparedAction(action, expected)
      if (validationError) {
        setState({ phase: 'error', action, error: validationError, hash })
        return
      }

      setState({ phase: 'review', action, hash })
      return
    }
  }

  const finishReceipt = async (action: PreparedAction, hash: Hash) => {
    if (!afterReceipt) {
      finish(action, hash)
      return
    }

    try {
      const outcome = await afterReceipt(action, hash)
      if (outcome === 'reprepare') {
        await requestPreparation({ continuation: true, hash })
        return
      }
      finish(action, hash)
    } catch (error) {
      setState({
        phase: 'sync_error',
        action,
        error: getApiErrorMessage(error),
        hash,
        retryStage: 'sync',
      })
    }
  }

  const confirm = async () => {
    invalidatePreparationRequests(setState)
    const action = state.action
    const call = action?.call
    if (!action || !call?.to || !call.data) {
      setState({ phase: 'error', action, error: 'The prepared call is missing. Prepare the action again.' })
      return
    }

    const validationError = validatePreparedAction(action, expected)
    if (validationError) {
      setState({ phase: 'error', action, error: validationError })
      return
    }

    let hash: Hash | undefined
    try {
      setState({ phase: 'awaiting_signature', action })
      const publicClient = getPublicClient(wagmiConfig, { chainId: expected.chainId })
      const walletClient = await getGatedWalletClient({ chainId: expected.chainId })
      if (!publicClient || !walletClient) throw new Error('Wallet client is unavailable for the selected chain.')

      const value = BigInt(call.valueRaw || '0')
      await publicClient.call({
        account: expected.account as ViemAddress,
        to: call.to as ViemAddress,
        data: call.data as Hex,
        value,
      })

      const submittedHash = await walletClient.sendTransaction({
        account: expected.account as ViemAddress,
        chain: undefined,
        to: call.to as ViemAddress,
        data: call.data as Hex,
        value,
      })
      hash = submittedHash

      setState({ phase: 'confirming', action, hash: submittedHash })
      const receipt = await publicClient.waitForTransactionReceipt({ hash: submittedHash })
      if (receipt.status !== 'success') {
        setState({
          phase: 'error',
          action,
          error: 'The transaction reverted on-chain. Prepare a new call before trying again.',
          hash: submittedHash,
        })
        return
      }

      await finishReceipt(action, submittedHash)
    } catch (error) {
      setState({
        phase: hash ? 'sync_error' : 'error',
        action,
        error: hash
          ? `The transaction was submitted, but its receipt could not be confirmed. ${getApiErrorMessage(error)}`
          : getApiErrorMessage(error),
        hash,
        retryStage: hash ? 'receipt' : undefined,
      })
    }
  }

  const retry = async () => {
    if (state.phase === 'sync_error' && state.action && state.hash) {
      if (state.retryStage === 'receipt') {
        setState({ phase: 'confirming', action: state.action, hash: state.hash })
        try {
          const publicClient = getPublicClient(wagmiConfig, { chainId: expected.chainId })
          if (!publicClient) throw new Error('The public client is unavailable for the selected chain.')
          const receipt = await publicClient.waitForTransactionReceipt({ hash: state.hash })
          if (receipt.status !== 'success') {
            setState({
              phase: 'error',
              action: state.action,
              error: 'The transaction reverted on-chain. Prepare a new call before trying again.',
              hash: state.hash,
            })
            return
          }
          await finishReceipt(state.action, state.hash)
        } catch (error) {
          setState({
            phase: 'sync_error',
            action: state.action,
            error: getApiErrorMessage(error),
            hash: state.hash,
            retryStage: 'receipt',
          })
        }
        return
      }

      await finishReceipt(state.action, state.hash)
      return
    }

    if (state.phase === 'pending' && state.action) {
      setState({ phase: 'preparing', action: state.action, hash: state.hash })
      await wait(getReprepareDelay(state.action))
    }

    await requestPreparation({ continuation: !!state.hash, hash: state.hash })
  }

  const reset = () => {
    invalidatePreparationRequests(setState)
    setState(DEFAULT_PREPARED_ACTION_STATE)
  }

  return { confirm, prepare: requestPreparation, reset, retry }
}

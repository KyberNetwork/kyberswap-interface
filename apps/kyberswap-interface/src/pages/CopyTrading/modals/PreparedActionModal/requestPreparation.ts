import type { PreparedAction } from 'services/copyTrading/types/preparedActions'

import { getPreparedReasonMessage } from 'pages/CopyTrading/helpers'
import {
  type PreparedActionExpectation,
  type PreparedActionStateSetter,
  getApiErrorMessage,
  getReprepareDelay,
  invalidatePreparationRequests,
  isCurrentPreparationRequest,
  isPreparationExpiredError,
  validatePreparedAction,
  validatePreparedActionContinuation,
  wait,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import type { Hash } from 'utils/viem'

const CONTINUATION_ATTEMPTS = 6

export type PreparationRequestOptions = {
  continuation?: boolean
  delay?: number
  hash?: Hash
  onReady?: (action: PreparedAction) => Promise<void> | void
  phaseWhilePreparing?: 'review'
}

type RequestPreparationProps = {
  expected: PreparedActionExpectation
  finish: (action?: PreparedAction, hash?: Hash, preparationVersion?: number) => void
  prepare: () => Promise<PreparedAction>
  reviewUnavailable?: (action: PreparedAction) => boolean
  setState: PreparedActionStateSetter
}

export const requestPreparation = async (
  { expected, finish, prepare, reviewUnavailable, setState }: RequestPreparationProps,
  { continuation = false, delay = 0, hash, onReady, phaseWhilePreparing }: PreparationRequestOptions = {},
) => {
  const preparationVersion = invalidatePreparationRequests(setState)
  const isCurrent = () => isCurrentPreparationRequest(setState, preparationVersion)

  setState(current =>
    continuation
      ? { phase: 'syncing', action: current.action, hash, isPreparing: true }
      : phaseWhilePreparing === 'review'
      ? { phase: 'review', isPreparing: true }
      : { ...current, isPreparing: true },
  )

  if (delay > 0) {
    await wait(delay)
    if (!isCurrent()) return
  }

  for (let attempt = 0; attempt < CONTINUATION_ATTEMPTS; attempt++) {
    let action: PreparedAction
    try {
      action = await prepare()
    } catch (error) {
      if (!isCurrent()) return
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
        setState({
          phase: isPreparationExpiredError(validationError) ? 'expired' : 'error',
          action,
          error: validationError,
          hash,
        })
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
          setState({
            phase: isPreparationExpiredError(validationError) ? 'expired' : 'error',
            action,
            error: validationError,
            hash,
          })
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
        setState({
          phase: isPreparationExpiredError(validationError) ? 'expired' : 'error',
          action,
          error: validationError,
          hash,
        })
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
      setState({
        phase: isPreparationExpiredError(validationError) ? 'expired' : 'error',
        action,
        error: validationError,
        hash,
      })
      return
    }

    if (onReady) {
      await onReady(action)
      return
    }

    setState({ phase: 'review', action, hash })
    return
  }
}

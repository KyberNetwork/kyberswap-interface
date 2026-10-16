import type { PreparedAction } from 'services/copyTrading/types/preparedActions'

import { getPreparedReasonMessage } from 'pages/CopyTrading/helpers'
import {
  type PreparedActionExpectation,
  type PreparedActionStateSetter,
  getApiErrorGuidance,
  getApiErrorMessage,
  getPreparationRetryAt,
  isPreparationExpiredError,
  isPreparationFailure,
  validatePreparedAction,
  validatePreparedGeneration,
  wait,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'

export type PreparationRequestOptions = {
  delay?: number
  onReady?: (action: PreparedAction) => Promise<void> | void
  phaseWhilePreparing?: 'review'
}

type RequestPreparationProps = {
  getExpected: () => PreparedActionExpectation
  isCurrent: () => boolean
  finish: (action: PreparedAction) => void
  prepare: () => Promise<PreparedAction>
  reviewUnavailable?: (action: PreparedAction) => boolean
  onPrepared?: (action: PreparedAction) => void
  setState: PreparedActionStateSetter
}

export const requestPreparation = async (
  { getExpected, isCurrent, finish, prepare, reviewUnavailable, onPrepared, setState }: RequestPreparationProps,
  { delay = 0, onReady, phaseWhilePreparing }: PreparationRequestOptions = {},
) => {
  const failValidation = (action: PreparedAction, error?: string) => {
    if (!error) return false

    setState({
      phase: isPreparationExpiredError(error) ? 'expired' : 'error',
      action,
      error,
    })
    return true
  }

  setState(current =>
    phaseWhilePreparing === 'review' ? { phase: 'review', isPreparing: true } : { ...current, isPreparing: true },
  )

  if (delay > 0) {
    await wait(delay)
    if (!isCurrent()) return
  }

  let action: PreparedAction
  try {
    action = await prepare()
  } catch (error) {
    if (!isCurrent()) return
    const guidance = getApiErrorGuidance(error)
    setState({ phase: 'error', error: getApiErrorMessage(error), guidance, retryAt: getPreparationRetryAt(guidance) })
    return
  }
  if (!isCurrent()) return

  const expected = getExpected()
  if (failValidation(action, validatePreparedGeneration(action, expected))) return

  const executable =
    action.status === 'PREPARED_ACTION_STATUS_READY' || action.status === 'PREPARED_ACTION_STATUS_PARTIALLY_COMPLETED'
  const reviewDiagnostic = action.status === 'PREPARED_ACTION_STATUS_UNAVAILABLE' && reviewUnavailable?.(action)
  if (
    !executable &&
    action.status !== 'PREPARED_ACTION_STATUS_PENDING' &&
    action.status !== 'PREPARED_ACTION_STATUS_UNAVAILABLE' &&
    action.status !== 'PREPARED_ACTION_STATUS_COMPLETED'
  ) {
    setState({ phase: 'error', action, error: 'The API returned an unsupported preparation status.' })
    return
  }

  if (action.status !== 'PREPARED_ACTION_STATUS_UNAVAILABLE' || reviewDiagnostic) {
    if (failValidation(action, validatePreparedAction(action, expected, { requireCall: executable }))) return
  }
  try {
    // Failed previews may omit identity fields; keep the current attempt unchanged.
    if (!isPreparationFailure(action)) onPrepared?.(action)
  } catch (error) {
    failValidation(action, getApiErrorMessage(error))
    return
  }

  if (action.status === 'PREPARED_ACTION_STATUS_PENDING') {
    setState({
      phase: 'pending',
      action,
      error: action.failureDetails?.message || action.guidance?.message || getPreparedReasonMessage(action.reason),
      retryAt: getPreparationRetryAt(action.guidance),
    })
    return
  }

  if (action.status === 'PREPARED_ACTION_STATUS_UNAVAILABLE' && !reviewDiagnostic) {
    setState({
      phase: 'unavailable',
      action,
      error: action.failureDetails?.message || action.guidance?.message || getPreparedReasonMessage(action.reason),
      retryAt: getPreparationRetryAt(action.guidance),
    })
    return
  }

  if (action.status === 'PREPARED_ACTION_STATUS_COMPLETED') {
    finish(action)
    return
  }

  if (executable && onReady) {
    await onReady(action)
    return
  }

  setState({ phase: 'review', action })
}

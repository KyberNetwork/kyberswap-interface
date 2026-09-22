import { useRef } from 'react'
import type {
  PrepareStartCopyRequest,
  PrepareStartCopyResponse,
  PreparedAction,
  PreparedCallKind,
} from 'services/copyTrading/types/preparedActions'
import { v4 as uuidv4 } from 'uuid'

import {
  type PreparedActionExpectation,
  validatePreparedAction,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import type { StartCopyTarget } from 'pages/CopyTrading/modals/StartCopyModal/startCopy'

const START_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_START_COPY_CREATE']
const START_FUNDING_MODE = 'START_COPY_FUNDING_MODE_FUNDED' as const

type StartCopyAttempt = {
  agentId?: string
  authorizationApplied: boolean
  chainId?: number
  generationId?: string
  createPermitData?: string
  ownerAddress?: string
  requestId: string
  predictedCopyAccount?: string
  targetCapitalRaw?: string
}

type PrepareStartCopy = (request: PrepareStartCopyRequest) => {
  unwrap: () => Promise<PrepareStartCopyResponse>
}

const createStartCopyAttempt = (): StartCopyAttempt => ({
  authorizationApplied: false,
  requestId: uuidv4(),
})

type StartCopyAuthorizationAction = PreparedAction & {
  reason: 'PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE'
  status: 'PREPARED_ACTION_STATUS_UNAVAILABLE'
}

export const requiresStartCopyAuthorization = (action?: PreparedAction): action is StartCopyAuthorizationAction =>
  action?.status === 'PREPARED_ACTION_STATUS_UNAVAILABLE' &&
  action.reason === 'PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE'

export const useStartCopyAttempt = ({
  account,
  agent,
  prepareStartCopy,
  targetCapitalRaw,
}: {
  account?: string
  agent: StartCopyTarget
  prepareStartCopy: PrepareStartCopy
  targetCapitalRaw?: string
}) => {
  const attemptRef = useRef<StartCopyAttempt>(createStartCopyAttempt())

  const getExpected = (): PreparedActionExpectation => ({
    account: account || '',
    callKinds: START_CALL_KINDS,
    chainId: agent.chainId,
    generationId: attemptRef.current.generationId,
    preview: 'startCopy',
    startCopyCreateAmountRaw: targetCapitalRaw,
    startCopyPredictedAccount: attemptRef.current.predictedCopyAccount,
    startCopyRequestId: attemptRef.current.requestId,
    startCopyTargetRaw: targetCapitalRaw,
  })

  const resetStartAttempt = () => {
    attemptRef.current = {
      ...createStartCopyAttempt(),
      predictedCopyAccount: attemptRef.current.predictedCopyAccount,
    }
  }

  const resetAttemptState = () => {
    attemptRef.current = createStartCopyAttempt()
  }

  const getScopedStartAttempt = (ownerAddress: string, targetRaw: string, generationId: string) => {
    const currentAttempt = attemptRef.current
    const scopeChanged =
      (currentAttempt.ownerAddress && currentAttempt.ownerAddress !== ownerAddress.toLowerCase()) ||
      (currentAttempt.agentId && currentAttempt.agentId !== agent.agentId) ||
      (currentAttempt.chainId && currentAttempt.chainId !== agent.chainId) ||
      (currentAttempt.generationId && currentAttempt.generationId !== generationId) ||
      (currentAttempt.targetCapitalRaw && currentAttempt.targetCapitalRaw !== targetRaw)

    if (scopeChanged) {
      resetAttemptState()
    }

    const scopedAttempt = {
      ...attemptRef.current,
      agentId: agent.agentId,
      chainId: agent.chainId,
      generationId,
      ownerAddress: ownerAddress.toLowerCase(),
      targetCapitalRaw: targetRaw,
    }
    attemptRef.current = scopedAttempt
    return scopedAttempt
  }

  const acceptPreparation = (action: PreparedAction) => {
    if (action.status === 'PREPARED_ACTION_STATUS_UNAVAILABLE') {
      if (attemptRef.current.authorizationApplied) {
        const error = validatePreparedAction(action, getExpected(), { requireCall: false })
        if (error) throw new Error(error)
      }
      return
    }

    const nextPredictedCopyAccount = action.startCopy?.predictedCopyAccount
    const expectedPredictedCopyAccount = attemptRef.current.predictedCopyAccount
    if (
      expectedPredictedCopyAccount &&
      nextPredictedCopyAccount?.toLowerCase() !== expectedPredictedCopyAccount.toLowerCase()
    ) {
      throw new Error('The prepared Start Copy Smart Wallet changed during this attempt.')
    }

    if (!expectedPredictedCopyAccount && nextPredictedCopyAccount) {
      attemptRef.current.predictedCopyAccount = nextPredictedCopyAccount
    }
  }

  const requestStartCopy = (attempt: StartCopyAttempt) => {
    if (
      !attempt.generationId ||
      !attempt.ownerAddress ||
      !attempt.targetCapitalRaw ||
      !attempt.agentId ||
      !attempt.chainId
    ) {
      throw new Error('Start Copy is currently unavailable. Please try again later.')
    }
    return prepareStartCopy({
      ownerAddress: attempt.ownerAddress,
      agentId: attempt.agentId,
      chainId: String(attempt.chainId),
      generationId: attempt.generationId,
      targetCapitalRaw: attempt.targetCapitalRaw,
      startRequestId: attempt.requestId,
      fundingMode: START_FUNDING_MODE,
      ...(attempt.createPermitData ? { createPermitData: attempt.createPermitData } : {}),
    }).unwrap()
  }

  const createAuthorizedAttempt = ({
    createPermitData,
    ownerAddress,
    targetRaw,
  }: {
    createPermitData?: string
    ownerAddress: string
    targetRaw: string
  }) => {
    const authorizedAttempt: StartCopyAttempt = {
      agentId: agent.agentId,
      authorizationApplied: true,
      chainId: agent.chainId,
      generationId: attemptRef.current.generationId,
      createPermitData,
      ownerAddress: ownerAddress.toLowerCase(),
      requestId: uuidv4(),
      targetCapitalRaw: targetRaw,
    }

    attemptRef.current = authorizedAttempt

    return authorizedAttempt
  }

  return {
    getGenerationId: () => attemptRef.current.generationId,
    hasAuthorization: () => attemptRef.current.authorizationApplied,
    acceptPreparation,
    createAuthorizedAttempt,
    getExpected,
    getScopedStartAttempt,
    requestStartCopy,
    resetAttemptState,
    resetStartAttempt,
  }
}

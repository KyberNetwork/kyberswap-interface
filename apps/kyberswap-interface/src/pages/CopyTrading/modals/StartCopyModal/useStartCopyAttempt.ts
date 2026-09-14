import { useRef, useState } from 'react'
import type {
  PrepareStartCopyRequest,
  PrepareStartCopyResponse,
  PreparedAction,
  PreparedCallKind,
} from 'services/copyTrading/types/preparedActions'
import { v4 as uuidv4 } from 'uuid'

import type { PreparedActionExpectation } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import type { StartCopyTarget } from 'pages/CopyTrading/modals/StartCopyModal/startCopy'

const START_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_START_COPY_CREATE']
const START_FUNDING_MODE = 'START_COPY_FUNDING_MODE_FUNDED' as const

type StartCopyAttempt = {
  agentId?: string
  authorizationApplied: boolean
  chainId?: number
  createPermitData?: string
  ownerAddress?: string
  requestId: string
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
  const [predictedCopyAccount, setPredictedCopyAccount] = useState<string>()
  const attemptRef = useRef<StartCopyAttempt>(createStartCopyAttempt())
  const expectedRef = useRef<PreparedActionExpectation>({
    account: account || '',
    callKinds: START_CALL_KINDS,
    chainId: agent.chainId,
    preview: 'startCopy',
  })

  expectedRef.current.account = account || ''
  expectedRef.current.chainId = agent.chainId
  expectedRef.current.startCopyCreateAmountRaw = targetCapitalRaw
  expectedRef.current.startCopyPredictedAccount = predictedCopyAccount
  expectedRef.current.startCopyRequestId = attemptRef.current.requestId
  expectedRef.current.startCopyTargetRaw = targetCapitalRaw

  const resetStartAttempt = () => {
    const nextAttempt = createStartCopyAttempt()
    attemptRef.current = nextAttempt
    expectedRef.current.startCopyRequestId = nextAttempt.requestId
  }

  const resetAttemptState = () => {
    setPredictedCopyAccount(undefined)
    resetStartAttempt()
  }

  const getScopedStartAttempt = (ownerAddress: string, targetRaw: string) => {
    const currentAttempt = attemptRef.current
    const scopeChanged =
      (currentAttempt.ownerAddress && currentAttempt.ownerAddress !== ownerAddress.toLowerCase()) ||
      (currentAttempt.agentId && currentAttempt.agentId !== agent.agentId) ||
      (currentAttempt.chainId && currentAttempt.chainId !== agent.chainId) ||
      (currentAttempt.targetCapitalRaw && currentAttempt.targetCapitalRaw !== targetRaw)

    if (scopeChanged) {
      resetAttemptState()
      expectedRef.current.startCopyPredictedAccount = undefined
    }

    const scopedAttempt = {
      ...attemptRef.current,
      agentId: agent.agentId,
      chainId: agent.chainId,
      ownerAddress: ownerAddress.toLowerCase(),
      targetCapitalRaw: targetRaw,
    }
    attemptRef.current = scopedAttempt
    return scopedAttempt
  }

  const capturePredictedCopyAccount = (nextPredictedCopyAccount?: string) => {
    const expectedPredictedCopyAccount = expectedRef.current.startCopyPredictedAccount
    if (
      expectedPredictedCopyAccount &&
      nextPredictedCopyAccount?.toLowerCase() !== expectedPredictedCopyAccount.toLowerCase()
    ) {
      throw new Error('The prepared Start Copy Smart Wallet changed during this attempt.')
    }

    if (!expectedPredictedCopyAccount && nextPredictedCopyAccount) {
      expectedRef.current.startCopyPredictedAccount = nextPredictedCopyAccount
      setPredictedCopyAccount(nextPredictedCopyAccount)
    }
  }

  const requestStartCopy = (attempt: StartCopyAttempt, ownerAddress: string, targetRaw: string) =>
    prepareStartCopy({
      ownerAddress: ownerAddress.toLowerCase(),
      agentId: agent.agentId,
      chainId: String(agent.chainId),
      targetCapitalRaw: targetRaw,
      startRequestId: attempt.requestId,
      fundingMode: START_FUNDING_MODE,
      ...(attempt.createPermitData ? { createPermitData: attempt.createPermitData } : {}),
    }).unwrap()

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
      createPermitData,
      ownerAddress: ownerAddress.toLowerCase(),
      requestId: uuidv4(),
      targetCapitalRaw: targetRaw,
    }

    setPredictedCopyAccount(undefined)
    expectedRef.current.startCopyPredictedAccount = undefined
    attemptRef.current = authorizedAttempt
    expectedRef.current.startCopyRequestId = authorizedAttempt.requestId

    return authorizedAttempt
  }

  return {
    attemptRef,
    capturePredictedCopyAccount,
    createAuthorizedAttempt,
    expected: expectedRef.current,
    getScopedStartAttempt,
    predictedCopyAccount,
    requestStartCopy,
    resetAttemptState,
    resetStartAttempt,
  }
}

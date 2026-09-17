import { ChainId } from '@kyberswap/ks-sdk-core'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import agentApi from 'services/copyTrading/api/endpoints/agents'
import discoveryApi from 'services/copyTrading/api/endpoints/discovery'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import type { PreparedActionStatus } from 'services/copyTrading/types/preparedActions'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { resolveStartCopyEligibility } from 'pages/CopyTrading/generations'
import { getPreparedReasonMessage } from 'pages/CopyTrading/helpers'
import useRefreshCopyTrading from 'pages/CopyTrading/hooks/useRefreshCopyTrading'
import { type CapitalPercentage } from 'pages/CopyTrading/modals/CapitalAmount/capital'
import { useCapitalAmount } from 'pages/CopyTrading/modals/CapitalAmount/useCapitalAmount'
import { pollSubmittedActionStatus } from 'pages/CopyTrading/modals/PreparedActionModal/postReceipt'
import {
  DEFAULT_PREPARED_ACTION_STATE,
  getApiErrorMessage,
  validatePreparedAction,
  validatePreparedGeneration,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { usePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import { type StartCopyTarget } from 'pages/CopyTrading/modals/StartCopyModal/startCopy'
import { useStartCopyAuthorization } from 'pages/CopyTrading/modals/StartCopyModal/useAuthorization'
import {
  requiresStartCopyAuthorization,
  useStartCopyAttempt,
} from 'pages/CopyTrading/modals/StartCopyModal/useStartCopyAttempt'
import { getWritePrimaryActionLabel, isWritePrimaryActionDisabled } from 'pages/CopyTrading/modals/writeAction'
import { useWalletModalToggle } from 'state/application/hooks'

const getNonReadyPhase = (status?: PreparedActionStatus) => {
  if (status === 'PREPARED_ACTION_STATUS_UNAVAILABLE') return 'unavailable'
  if (status === 'PREPARED_ACTION_STATUS_PENDING') return 'pending'
  return 'error'
}

export const useStartCopyFlow = ({ agent, onDismiss }: { agent: StartCopyTarget; onDismiss: () => void }) => {
  const navigate = useNavigate()
  const { chains } = useCopyTradingContext()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()
  const refreshCopyTrading = useRefreshCopyTrading()
  const [getStatus] = preparedActionApi.useGetSubmittedActionStatusMutation()
  const [prepareStartCopy] = preparedActionApi.usePrepareStartCopyMutation()
  const { authorize: authorizeStartCopy, getAuthorizationKind } = useStartCopyAuthorization()

  const [flowState, setFlowState] = useState(DEFAULT_PREPARED_ACTION_STATE)
  const [agreed, setAgreed] = useState(false)
  const [createdCopyRunId, setCreatedCopyRunId] = useState<string>()
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [getChains] = discoveryApi.useLazyGetChainsQuery()
  const [getAgent] = agentApi.useLazyGetAgentQuery()

  const capital = useCapitalAmount({
    account: account || undefined,
    action: 'startCopy',
    connectedChainId: chainId,
    targetChainId: agent.chainId,
  })
  const attempt = useStartCopyAttempt({
    account: account || undefined,
    agent,
    prepareStartCopy,
    targetCapitalRaw: capital.amountRaw,
  })

  const flow = usePreparedAction({
    state: flowState,
    setState: setFlowState,
    expected: attempt.expected,
    prepare: async () => {
      if (!account || !capital.quoteToken) throw new Error('Connect a supported wallet and network first.')
      if (!capital.amountRaw) throw new Error('Enter an amount greater than zero.')
      if (capital.amountError) throw new Error(capital.amountError)
      const [chains, profile] = await Promise.all([
        getChains(undefined, false).unwrap(),
        getAgent({ agentId: agent.agentId }, false).unwrap(),
      ])
      const eligibility = resolveStartCopyEligibility(
        chains.data.find(chain => chain.chainId === agent.chainId),
        profile.data,
      )
      // Keep an existing attempt pinned even after its generation retires.
      const generationId = attempt.attemptRef.current.generationId || eligibility.generationId
      if (!generationId) throw new Error('Start Copy is currently unavailable. Please try again later.')

      const scopedAttempt = attempt.getScopedStartAttempt(account, capital.amountRaw, generationId)
      const response = await attempt.requestStartCopy(scopedAttempt, account, capital.amountRaw)
      const action = response.data
      const generationValidationError = validatePreparedGeneration(action, attempt.expected)
      if (generationValidationError) throw new Error(generationValidationError)

      if (
        [
          'PREPARED_ACTION_STATUS_READY',
          'PREPARED_ACTION_STATUS_PARTIALLY_COMPLETED',
          'PREPARED_ACTION_STATUS_COMPLETED',
          'PREPARED_ACTION_STATUS_PENDING',
        ].includes(action.status || '') &&
        action.startCopy?.requestedTargetRaw !== capital.amountRaw
      ) {
        throw new Error('The prepared target does not match your requested capital amount.')
      }
      if (!requiresStartCopyAuthorization(action)) {
        attempt.capturePredictedCopyAccount(action.startCopy?.predictedCopyAccount)
      }

      return action
    },
    reviewUnavailable: action =>
      requiresStartCopyAuthorization(action) && !attempt.attemptRef.current.authorizationApplied,
    afterReceipt: async (action, hash) => {
      const status = await pollSubmittedActionStatus({ action, hash, getStatus })
      setAgreed(false)
      setCreatedCopyRunId(status.result?.copyRunId)
      refreshCopyTrading()
    },
    onComplete: refreshCopyTrading,
  })

  const startPreview = flowState.action?.startCopy
  const authorizationKind = requiresStartCopyAuthorization(flowState.action)
    ? getAuthorizationKind(flowState.action)
    : undefined

  const preparedWalletBalanceRaw = startPreview?.walletQuoteBalance?.valueRaw
  const requiredWalletBalanceRaw = startPreview?.remainingTargetDeficit?.valueRaw || capital.amountRaw
  const confirmBalanceError =
    requiredWalletBalanceRaw &&
    preparedWalletBalanceRaw &&
    BigInt(requiredWalletBalanceRaw) > BigInt(preparedWalletBalanceRaw)
      ? 'Insufficient ' + (capital.quoteToken?.symbol || 'quote token') + ' balance.'
      : undefined

  const accountConnected = !!account
  const isPreparing = flowState.isPreparing === true
  const eligibility = resolveStartCopyEligibility(
    chains.find(chain => chain.chainId === agent.chainId),
    agent,
  )
  const availabilityMessage = eligibility.canStart ? undefined : getPreparedReasonMessage(eligibility.reason)
  const primaryActionLabel = getWritePrimaryActionLabel({
    accountConnected,
    onExpectedChain: capital.onExpectedChain,
    readyLabel: 'Review Start Copy',
    unavailable: !!availabilityMessage || !capital.quoteToken,
    unavailableLabel: 'Start Copy Unavailable',
  })
  const primaryActionDisabled = isWritePrimaryActionDisabled({
    accountConnected,
    executionBlocked: !capital.amountIsValid || !!availabilityMessage,
    interactionLocked: isPreparing,
    onExpectedChain: capital.onExpectedChain,
  })

  const resetPreparedState = () => {
    flow.reset()
    setAgreed(false)
    setCreatedCopyRunId(undefined)
    setIsAuthorizing(false)
    attempt.resetAttemptState()
  }

  const dismiss = () => {
    resetPreparedState()
    capital.setAmount('')
    onDismiss()
  }

  const handlePrimaryAction = () => {
    if (!account) {
      toggleWalletModal()
      return
    }
    if (!capital.onExpectedChain) {
      void changeNetwork(agent.chainId as ChainId)
      return
    }
    if (!capital.amountIsValid || availabilityMessage) return

    void flow.prepare()
  }

  const setPercentageAmount = (percentage: CapitalPercentage) => {
    const preset = capital.getPreset(percentage)
    if (flowState.isPreparing || !capital.presetsEnabled || !preset) return

    capital.setAmount(preset.amount)
    setAgreed(false)
  }

  const confirmStartCopy = async () => {
    if (!agreed || confirmBalanceError || isAuthorizing) return

    const diagnosticAction = flowState.action
    if (!requiresStartCopyAuthorization(diagnosticAction)) {
      await flow.confirm()
      return
    }

    if (!account || !capital.quoteToken || !capital.amountRaw) {
      setFlowState({
        phase: 'error',
        action: diagnosticAction,
        error: 'Connect a supported wallet and network first.',
      })
      return
    }

    try {
      setIsAuthorizing(true)
      const validationError = validatePreparedAction(diagnosticAction, attempt.expected, { requireCall: false })
      if (validationError) throw new Error(validationError)
      await flow.validateGenerationPolicy(diagnosticAction)

      const createPermitData = await authorizeStartCopy(diagnosticAction)
      const authorizedAttempt = attempt.createAuthorizedAttempt({
        createPermitData,
        ownerAddress: account,
        targetRaw: capital.amountRaw,
      })
      const response = await attempt.requestStartCopy(authorizedAttempt, account, capital.amountRaw)
      const action = response.data

      if (action.startCopy?.requestedTargetRaw !== capital.amountRaw) {
        throw new Error('The prepared target does not match your requested capital amount.')
      }
      if (action.status !== 'PREPARED_ACTION_STATUS_READY') {
        const nextValidationError = validatePreparedAction(action, attempt.expected, { requireCall: false })
        if (nextValidationError) throw new Error(nextValidationError)

        const phase = getNonReadyPhase(action.status)
        setFlowState({
          phase,
          action,
          error:
            phase === 'error'
              ? 'The authorized Start Copy preparation did not return a ready create call.'
              : getPreparedReasonMessage(action.reason),
        })
        return
      }

      const nextValidationError = validatePreparedAction(action, attempt.expected)
      if (nextValidationError) throw new Error(nextValidationError)
      await flow.validateGenerationPolicy(action)

      attempt.capturePredictedCopyAccount(action.startCopy?.predictedCopyAccount)
      setFlowState({ phase: 'review', action })
    } catch (error) {
      setFlowState({ phase: 'error', action: diagnosticAction, error: getApiErrorMessage(error) })
    } finally {
      setIsAuthorizing(false)
    }
  }

  const retry = () => {
    if (
      flowState.phase === 'unavailable' &&
      (flowState.action?.reason === 'PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE' ||
        flowState.action?.reason === 'PREPARED_ACTION_REASON_SIGNER_POLICY_CHANGED')
    ) {
      attempt.resetStartAttempt()
    }

    setIsAuthorizing(false)
    void flow.retry()
  }

  const viewMyCopies = () => {
    dismiss()
    navigate(APP_PATHS.COPY_TRADING + '/my-copies')
  }

  return {
    agreed,
    authorizationLabel: authorizationKind === 'permit' ? 'Permit' : 'Approve',
    authorizationRequired: !!authorizationKind,
    availabilityMessage,
    capital,
    confirmBalanceError,
    confirmStartCopy,
    createdCopyRunId,
    dismiss,
    editAmount: resetPreparedState,
    flowState,
    handlePrimaryAction,
    isAuthorizing,
    primaryActionLabel,
    primaryActionDisabled,
    retry,
    setAgreed,
    setPercentageAmount,
    startPreview,
    viewMyCopies,
  }
}

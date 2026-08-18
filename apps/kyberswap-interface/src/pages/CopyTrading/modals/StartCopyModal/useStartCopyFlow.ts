import { ChainId } from '@kyberswap/ks-sdk-core'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { getPreparedReasonMessage, isActionAvailable } from 'pages/CopyTrading/helpers'
import useRefreshCopyTrading from 'pages/CopyTrading/hooks/useRefreshCopyTrading'
import { type CapitalPercentage } from 'pages/CopyTrading/modals/CapitalAmount/capital'
import { useCapitalAmount } from 'pages/CopyTrading/modals/CapitalAmount/useCapitalAmount'
import {
  DEFAULT_PREPARED_ACTION_STATE,
  getApiErrorMessage,
  validatePreparedAction,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { usePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import { type StartCopyTarget, pollStartCopyRun } from 'pages/CopyTrading/modals/StartCopyModal/startCopy'
import { useStartCopyAuthorization } from 'pages/CopyTrading/modals/StartCopyModal/useAuthorization'
import {
  requiresStartCopyAuthorization,
  useStartCopyAttempt,
} from 'pages/CopyTrading/modals/StartCopyModal/useStartCopyAttempt'
import { useWalletModalToggle } from 'state/application/hooks'

export const useStartCopyFlow = ({ agent, onDismiss }: { agent: StartCopyTarget; onDismiss: () => void }) => {
  const navigate = useNavigate()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()
  const refreshCopyTrading = useRefreshCopyTrading()
  const [prepareStartCopy] = preparedActionApi.usePrepareStartCopyMutation()
  const [getCopyRuns] = copyRunApi.useLazyGetCopyRunsQuery()
  const { authorize: authorizeStartCopy, getAuthorizationKind } = useStartCopyAuthorization()

  const [flowState, setFlowState] = useState(DEFAULT_PREPARED_ACTION_STATE)
  const [agreed, setAgreed] = useState(false)
  const [createdCopyRun, setCreatedCopyRun] = useState<CopyRunSummary>()
  const [isAuthorizing, setIsAuthorizing] = useState(false)

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

      const scopedAttempt = attempt.getScopedStartAttempt(account, capital.amountRaw)
      const response = await attempt.requestStartCopy(scopedAttempt, account, capital.amountRaw)
      const action = response.data

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
    afterReceipt: async action => {
      setAgreed(false)
      const ownerAddress = action.expectedAccount
      if (!ownerAddress) throw new Error('The confirmed Start Copy action is missing its owner wallet.')

      const copyRun = await pollStartCopyRun({
        agentId: agent.agentId,
        chainId: agent.chainId,
        ownerAddress,
        fetchCopyRuns: () =>
          getCopyRuns({
            ownerAddress,
            view: 'open',
            agentId: agent.agentId,
            chainId: agent.chainId,
            limit: 1,
          }).unwrap(),
      })
      setCreatedCopyRun(copyRun)
    },
    onComplete: refreshCopyTrading,
  })

  const startPreview = flowState.action?.startCopy
  const authorizationKind = requiresStartCopyAuthorization(flowState.action)
    ? getAuthorizationKind(flowState.action)
    : undefined

  const preparedWalletBalanceRaw = startPreview?.walletQuoteBalance?.valueRaw
  const requiredWalletBalanceRaw = startPreview?.remainingTargetDeficit?.valueRaw || capital.amountRaw
  const preparedBalanceIsInsufficient =
    !!requiredWalletBalanceRaw &&
    !!preparedWalletBalanceRaw &&
    BigInt(requiredWalletBalanceRaw) > BigInt(preparedWalletBalanceRaw)
  const confirmBalanceError =
    capital.amountError ||
    (preparedBalanceIsInsufficient
      ? 'Insufficient ' + (capital.quoteToken?.symbol || 'quote token') + ' balance.'
      : undefined)

  const availabilityMessage = !isActionAvailable(agent.startCopyAvailability)
    ? getPreparedReasonMessage(agent.startCopyAvailability?.reason)
    : undefined
  const primaryActionLabel = !account
    ? 'Connect wallet'
    : !capital.onExpectedChain
    ? 'Switch network'
    : availabilityMessage || !capital.quoteToken
    ? 'Start Copy unavailable'
    : 'Next'

  const resetPreparedState = () => {
    flow.reset()
    setAgreed(false)
    setCreatedCopyRun(undefined)
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
    if (!capital.amountIsValid) return

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

        setFlowState({
          phase: action.status === 'PREPARED_ACTION_STATUS_UNAVAILABLE' ? 'unavailable' : 'error',
          action,
          error:
            action.status === 'PREPARED_ACTION_STATUS_UNAVAILABLE'
              ? getPreparedReasonMessage(action.reason)
              : 'The authorized Start Copy preparation did not return a ready create call.',
        })
        return
      }

      const nextValidationError = validatePreparedAction(action, attempt.expected)
      if (nextValidationError) throw new Error(nextValidationError)

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
    accountConnected: !!account,
    agreed,
    authorizationLabel: authorizationKind === 'permit' ? 'Permit' : 'Approve',
    authorizationRequired: !!authorizationKind,
    availabilityMessage,
    capital,
    confirmBalanceError,
    confirmStartCopy,
    createdCopyRun,
    dismiss,
    editAmount: resetPreparedState,
    flowState,
    handlePrimaryAction,
    isAuthorizing,
    primaryActionLabel,
    retry,
    setAgreed,
    setPercentageAmount,
    startPreview,
    viewMyCopies,
  }
}

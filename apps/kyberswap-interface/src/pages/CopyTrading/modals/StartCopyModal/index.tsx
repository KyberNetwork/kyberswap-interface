import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { useMemo, useRef, useState } from 'react'
import { Info } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import copyTradingApi, { usePrepareStartCopyMutation } from 'services/copyTrading'
import type {
  AgentCard,
  AgentProfile,
  CopyRunSummary,
  PreparedAction,
  PreparedCallKind,
} from 'services/copyTrading/types'
import { v4 as uuidv4 } from 'uuid'

import verifiedIcon from 'assets/images/copy-trading/verified.svg'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import Checkbox from 'components/CheckBox'
import CopyHelper from 'components/Copy'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Dots from 'components/Dots'
import InfoHelper from 'components/InfoHelper'
import { Center, HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTokenBalance from 'hooks/useTokenBalance'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { getPreparedReasonMessage, isActionAvailable } from 'pages/CopyTrading/actionAvailability'
import { getAgentInitials } from 'pages/CopyTrading/helpers'
import useRefreshCopyTrading from 'pages/CopyTrading/hooks/useRefreshCopyTrading'
import PreparedActionModal, { ReviewRow, ReviewSection } from 'pages/CopyTrading/modals/PreparedActionModal'
import {
  type PreparedActionExpectation,
  formatPreparedAmount,
  formatWadPercent,
  getApiErrorMessage,
  getInputQuoteToken,
  parsePreparedAmount,
  validatePreparedAction,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import {
  DEFAULT_PREPARED_ACTION_STATE,
  usePreparedAction,
} from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import { pollStartCopyRun } from 'pages/CopyTrading/modals/StartCopyModal/completion'
import { useStartCopyAuthorization } from 'pages/CopyTrading/modals/StartCopyModal/useAuthorization'
import { useWalletModalToggle } from 'state/application/hooks'
import { shortenAddress } from 'utils/address'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

export type StartCopyTarget = AgentCard | AgentProfile

type StartCopyModalProps = {
  isOpen: boolean
  onDismiss: () => void
  agent: StartCopyTarget
}

const START_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_START_COPY_CREATE']
const START_FUNDING_MODE = 'START_COPY_FUNDING_MODE_FUNDED' as const
const CAPITAL_PERCENTAGES = [25, 50, 75, 100] as const

type StartCopyAttempt = {
  agentId?: string
  authorizationApplied: boolean
  chainId?: number
  createPermitData?: string
  ownerAddress?: string
  requestId: string
  targetCapitalRaw?: string
}

const createStartCopyAttempt = (): StartCopyAttempt => ({
  authorizationApplied: false,
  requestId: uuidv4(),
})

type StartCopyAuthorizationAction = PreparedAction & {
  reason: 'PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE'
  status: 'PREPARED_ACTION_STATUS_UNAVAILABLE'
}

const requiresStartCopyAuthorization = (action?: PreparedAction): action is StartCopyAuthorizationAction =>
  action?.status === 'PREPARED_ACTION_STATUS_UNAVAILABLE' &&
  action.reason === 'PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE'

const ReviewLabel = ({ label, tooltip }: { label: string; tooltip: string }) => (
  <span className="inline-flex items-center gap-1">
    {label}
    <InfoHelper text={tooltip} margin={false} placement="top" size={13} />
  </span>
)

const AgentHeader = ({ agent }: { agent: StartCopyTarget }) => (
  <HStack className="min-w-0 flex-1 items-center gap-3">
    <Center className="size-12 shrink-0 rounded-full bg-buttonGray text-base font-medium text-subText">
      {getAgentInitials(agent.displayName)}
    </Center>
    <Stack className="min-w-0 flex-1 gap-0.5">
      <HStack className="min-w-0 items-center gap-1.5">
        <h2 className="truncate text-lg font-medium text-text">{agent.displayName}</h2>
        {agent.isVerified && <img src={verifiedIcon} alt="Verified" className="size-5 shrink-0" />}
      </HStack>
      <HStack className="min-w-0 items-center gap-1.5 text-xs text-subText">
        <span>•</span>
        <span className="truncate">{agent.modelName}</span>
        <span>•</span>
        <span className="shrink-0">{shortenAddress(agent.chainId, agent.leaderAddress)}</span>
        <CopyHelper toCopy={agent.leaderAddress} margin="0" size={12} className="shrink-0 text-subText" />
      </HStack>
    </Stack>
  </HStack>
)

const StartCopyModal = ({ isOpen, onDismiss, agent }: StartCopyModalProps) => {
  const navigate = useNavigate()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()
  const refreshCopyTrading = useRefreshCopyTrading()
  const [prepareStartCopy] = usePrepareStartCopyMutation()
  const [getCopyRuns] = copyTradingApi.useLazyGetCopyRunsQuery()
  const { authorize: authorizeStartCopy, getAuthorizationKind } = useStartCopyAuthorization()
  const [flowState, setFlowState] = useState(DEFAULT_PREPARED_ACTION_STATE)
  const [amount, setAmount] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [createdCopyRun, setCreatedCopyRun] = useState<CopyRunSummary>()
  const [predictedCopyAccount, setPredictedCopyAccount] = useState<string>()
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const startAttemptRef = useRef<StartCopyAttempt>(createStartCopyAttempt())
  const expectedRef = useRef<PreparedActionExpectation>({
    account: account || '',
    callKinds: START_CALL_KINDS,
    chainId: agent.chainId,
    preview: 'startCopy',
  })

  const quoteToken = getInputQuoteToken(agent.chainId)
  const quoteCurrency = useMemo(
    () =>
      quoteToken
        ? new Token(agent.chainId, quoteToken.address, quoteToken.decimals, quoteToken.symbol, quoteToken.symbol)
        : undefined,
    [quoteToken, agent.chainId],
  )
  const walletBalance = useTokenBalance(quoteToken?.address || '', agent.chainId as ChainId)
  const walletBalanceRaw = account && quoteToken ? walletBalance.value.toString() : undefined
  const presetAmounts = useMemo(() => {
    if (!quoteToken || !walletBalanceRaw) return undefined

    return CAPITAL_PERCENTAGES.map(percentage => ({
      percentage,
      amount: formatUnits((BigInt(walletBalanceRaw) * BigInt(percentage)) / 100n, quoteToken.decimals),
    }))
  }, [quoteToken, walletBalanceRaw])
  const targetCapitalRaw = useMemo(() => {
    if (!quoteToken) return undefined
    try {
      return parsePreparedAmount(amount, quoteToken.decimals)
    } catch {
      return undefined
    }
  }, [amount, quoteToken])
  const availability = agent.startCopyAvailability
  const amountBelowMinimum =
    !!targetCapitalRaw && !!quoteToken && BigInt(targetCapitalRaw) < BigInt(quoteToken.minimumStartCopyCapitalRaw)
  const insufficientBalance =
    !!targetCapitalRaw && !!walletBalanceRaw && BigInt(targetCapitalRaw) > BigInt(walletBalanceRaw)
  const amountError =
    !amount || !quoteToken
      ? undefined
      : !targetCapitalRaw || amountBelowMinimum
      ? `Minimum amount is ${formatPreparedAmount(quoteToken.minimumStartCopyCapitalRaw, quoteToken)}.`
      : insufficientBalance
      ? `Insufficient ${quoteToken.symbol} balance.`
      : undefined
  const amountIsValid = !!targetCapitalRaw && !amountBelowMinimum && !insufficientBalance
  const onExpectedChain = chainId === agent.chainId
  const presetsEnabled = !!account && onExpectedChain && !!walletBalanceRaw && BigInt(walletBalanceRaw) > 0n
  const walletBalanceText =
    walletBalanceRaw && quoteToken
      ? formatDisplayNumber(formatUnits(BigInt(walletBalanceRaw), quoteToken.decimals), { significantDigits: 8 })
      : account
      ? '0'
      : 'Connect wallet'
  const startPreview = flowState.action?.startCopy
  const authorizationKind = requiresStartCopyAuthorization(flowState.action)
    ? getAuthorizationKind(flowState.action)
    : undefined
  const authorizationLabel = authorizationKind === 'permit' ? 'Permit' : 'Approve'
  const preparedToken = startPreview?.quoteToken
  const preparedWalletBalanceRaw = startPreview?.walletQuoteBalance?.valueRaw
  const requiredWalletBalanceRaw = startPreview?.remainingTargetDeficit?.valueRaw || targetCapitalRaw
  const preparedBalanceIsInsufficient =
    !!requiredWalletBalanceRaw &&
    !!preparedWalletBalanceRaw &&
    BigInt(requiredWalletBalanceRaw) > BigInt(preparedWalletBalanceRaw)
  const confirmBalanceError =
    amountError ||
    (preparedBalanceIsInsufficient ? `Insufficient ${quoteToken?.symbol || 'quote token'} balance.` : undefined)

  expectedRef.current.account = account || ''
  expectedRef.current.chainId = agent.chainId
  expectedRef.current.startCopyCreateAmountRaw = targetCapitalRaw
  expectedRef.current.startCopyPredictedAccount = predictedCopyAccount
  expectedRef.current.startCopyRequestId = startAttemptRef.current.requestId
  expectedRef.current.startCopyTargetRaw = targetCapitalRaw

  const resetStartAttempt = () => {
    const nextAttempt = createStartCopyAttempt()
    startAttemptRef.current = nextAttempt
    expectedRef.current.startCopyRequestId = nextAttempt.requestId
  }

  const getScopedStartAttempt = (ownerAddress: string, targetRaw: string) => {
    const currentAttempt = startAttemptRef.current
    const scopeChanged =
      (currentAttempt.ownerAddress && currentAttempt.ownerAddress !== ownerAddress.toLowerCase()) ||
      (currentAttempt.agentId && currentAttempt.agentId !== agent.agentId) ||
      (currentAttempt.chainId && currentAttempt.chainId !== agent.chainId) ||
      (currentAttempt.targetCapitalRaw && currentAttempt.targetCapitalRaw !== targetRaw)
    if (scopeChanged) {
      resetStartAttempt()
      expectedRef.current.startCopyPredictedAccount = undefined
      setPredictedCopyAccount(undefined)
    }

    const scopedAttempt = {
      ...startAttemptRef.current,
      agentId: agent.agentId,
      chainId: agent.chainId,
      ownerAddress: ownerAddress.toLowerCase(),
      targetCapitalRaw: targetRaw,
    }
    startAttemptRef.current = scopedAttempt
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

  const flow = usePreparedAction({
    state: flowState,
    setState: setFlowState,
    expected: expectedRef.current,
    prepare: async () => {
      if (!account || !quoteToken) throw new Error('Connect a supported wallet and network first.')

      if (!targetCapitalRaw) throw new Error('Enter an amount greater than zero.')
      if (amountError) throw new Error(amountError)
      const attempt = getScopedStartAttempt(account, targetCapitalRaw)
      const response = await requestStartCopy(attempt, account, targetCapitalRaw)

      if (
        [
          'PREPARED_ACTION_STATUS_READY',
          'PREPARED_ACTION_STATUS_PARTIALLY_COMPLETED',
          'PREPARED_ACTION_STATUS_COMPLETED',
          'PREPARED_ACTION_STATUS_PENDING',
        ].includes(response.data.status || '') &&
        response.data.startCopy?.requestedTargetRaw !== targetCapitalRaw
      ) {
        throw new Error('The prepared target does not match your requested capital amount.')
      }
      if (!requiresStartCopyAuthorization(response.data)) {
        capturePredictedCopyAccount(response.data.startCopy?.predictedCopyAccount)
      }
      return response.data
    },
    reviewUnavailable: action =>
      requiresStartCopyAuthorization(action) && !startAttemptRef.current.authorizationApplied,
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

  const dismiss = () => {
    flow.reset()
    setAmount('')
    setAgreed(false)
    setCreatedCopyRun(undefined)
    setPredictedCopyAccount(undefined)
    setIsAuthorizing(false)
    resetStartAttempt()
    onDismiss()
  }

  const editAmount = () => {
    flow.reset()
    setAgreed(false)
    setCreatedCopyRun(undefined)
    setPredictedCopyAccount(undefined)
    setIsAuthorizing(false)
    resetStartAttempt()
  }

  const handlePrimaryAction = () => {
    if (!account) {
      toggleWalletModal()
      return
    }
    if (!onExpectedChain) {
      void changeNetwork(agent.chainId as ChainId)
      return
    }
    if (!amountIsValid) return
    void flow.prepare()
  }

  const confirmStartCopy = async () => {
    if (!agreed || confirmBalanceError || isAuthorizing) return

    const diagnosticAction = flowState.action
    if (!requiresStartCopyAuthorization(diagnosticAction)) {
      await flow.confirm()
      return
    }

    if (!account || !quoteToken || !targetCapitalRaw) {
      setFlowState({
        phase: 'error',
        action: diagnosticAction,
        error: 'Connect a supported wallet and network first.',
      })
      return
    }

    try {
      setIsAuthorizing(true)
      const validationError = validatePreparedAction(diagnosticAction, expectedRef.current, { requireCall: false })
      if (validationError) throw new Error(validationError)

      const createPermitData = await authorizeStartCopy(diagnosticAction)
      const authorizedAttempt: StartCopyAttempt = {
        agentId: agent.agentId,
        authorizationApplied: true,
        chainId: agent.chainId,
        createPermitData,
        ownerAddress: account.toLowerCase(),
        requestId: uuidv4(),
        targetCapitalRaw,
      }

      // UUID A is diagnostic only; UUID B can legitimately predict a different Smart Wallet.
      setPredictedCopyAccount(undefined)
      expectedRef.current.startCopyPredictedAccount = undefined
      startAttemptRef.current = authorizedAttempt
      expectedRef.current.startCopyRequestId = authorizedAttempt.requestId

      const response = await requestStartCopy(authorizedAttempt, account, targetCapitalRaw)
      const action = response.data
      if (action.startCopy?.requestedTargetRaw !== targetCapitalRaw) {
        throw new Error('The prepared target does not match your requested capital amount.')
      }
      if (action.status !== 'PREPARED_ACTION_STATUS_READY') {
        const nextValidationError = validatePreparedAction(action, expectedRef.current, { requireCall: false })
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

      const nextValidationError = validatePreparedAction(action, expectedRef.current)
      if (nextValidationError) throw new Error(nextValidationError)
      capturePredictedCopyAccount(action.startCopy?.predictedCopyAccount)
      setFlowState({ phase: 'review', action })
    } catch (error) {
      setFlowState({ phase: 'error', action: diagnosticAction, error: getApiErrorMessage(error) })
    } finally {
      setIsAuthorizing(false)
    }
  }

  const setPercentageAmount = (percentage: (typeof CAPITAL_PERCENTAGES)[number]) => {
    const preset = presetAmounts?.find(item => item.percentage === percentage)
    if (flowState.isPreparing || !presetsEnabled || !preset) return

    setAmount(preset.amount)
    setAgreed(false)
  }

  const review = (
    <Stack className="gap-4">
      <ReviewSection title="Review Details">
        <ReviewRow
          label="Allocated Capital"
          value={formatPreparedAmount(
            startPreview?.requestedTargetRaw || targetCapitalRaw,
            preparedToken || quoteToken,
          )}
        />
        <ReviewRow
          label={
            <ReviewLabel
              label="Minimum Capital"
              tooltip="The minimum initial capital currently accepted by the Start Copy preparation."
            />
          }
          value={formatPreparedAmount(
            startPreview?.minimumInitialCapitalRaw || quoteToken?.minimumStartCopyCapitalRaw,
            preparedToken || quoteToken,
          )}
        />
        <ReviewRow
          label={
            <ReviewLabel
              label="Upfront Fee"
              tooltip="The fee policy advertised by the latest preparation. It is checked again before every transaction stage."
            />
          }
          value={
            startPreview ? formatWadPercent(startPreview.feePolicy?.advertisedUpfrontFeeRateRaw) : <Dots>Checking</Dots>
          }
        />
      </ReviewSection>

      <label className="flex cursor-pointer items-start gap-3 text-xs text-subText">
        <Checkbox
          borderStyle
          checked={agreed}
          disabled={isAuthorizing}
          onChange={event => setAgreed(event.target.checked)}
          className="mt-0.5 size-4 shrink-0"
        />
        <span>
          I understand the trading risks, fees, and execution mechanics of AI Copy Trading. Past performance does not
          guarantee future results.
        </span>
      </label>
      {confirmBalanceError && (
        <span role="alert" className="text-xs text-red">
          {confirmBalanceError}
        </span>
      )}
    </Stack>
  )

  const availabilityMessage = !isActionAvailable(availability)
    ? getPreparedReasonMessage(availability?.reason)
    : undefined
  const primaryActionLabel = !account
    ? 'Connect wallet'
    : !onExpectedChain
    ? 'Switch network'
    : availabilityMessage || !quoteToken
    ? 'Start Copy unavailable'
    : 'Next'

  const retry = () => {
    if (
      flowState.phase === 'unavailable' &&
      (flowState.action?.reason === 'PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE' ||
        flowState.action?.reason === 'PREPARED_ACTION_REASON_SIGNER_POLICY_CHANGED')
    ) {
      resetStartAttempt()
    }
    setIsAuthorizing(false)
    void flow.retry()
  }

  const viewCreatedCopy = () => {
    if (!createdCopyRun) return
    const path = `${APP_PATHS.COPY_TRADING}/my-copies/${createdCopyRun.copyRunId}`
    dismiss()
    navigate(path)
  }

  return (
    <PreparedActionModal
      isOpen={isOpen}
      onDismiss={dismiss}
      state={flowState}
      title={<AgentHeader agent={agent} />}
      review={review}
      confirmLabel={authorizationKind ? authorizationLabel : 'Start Copying'}
      confirmLoading={isAuthorizing}
      confirmDisabled={!agreed || !!confirmBalanceError}
      onBack={flowState.hash ? undefined : editAmount}
      onConfirm={() => void confirmStartCopy()}
      onRetry={retry}
      successTitle={`You're now copying ${agent.displayName}`}
      successText="The transaction is confirmed and your new Copy is ready."
      successActions={
        createdCopyRun ? (
          <HStack className="w-full gap-3">
            <ButtonLight type="button" className="flex-1" onClick={dismiss}>
              Close
            </ButtonLight>
            <ButtonPrimary type="button" className="flex-1" onClick={viewCreatedCopy}>
              My Copy
            </ButtonPrimary>
          </HStack>
        ) : undefined
      }
      width={520}
    >
      <Stack className="gap-4">
        <Stack className="gap-2">
          <span className="text-sm font-medium text-text">Allocate Capital</span>
          <CurrencyInputPanel
            value={amount}
            onUserInput={value => {
              setAmount(value)
              setAgreed(false)
            }}
            error={!!amountError}
            currency={quoteCurrency}
            customBalanceText={walletBalanceText}
            customChainId={agent.chainId as ChainId}
            disableCurrencySelect
            disabledInput={flowState.isPreparing}
            id="copy-trading-start-capital"
            dataTestId="copy-trading-start-capital"
            onBalanceClick={() => setPercentageAmount(100)}
            balanceActions={
              <HStack className="items-center gap-1">
                {CAPITAL_PERCENTAGES.map(percentage => {
                  const preset = presetAmounts?.find(item => item.percentage === percentage)
                  const selected = !!preset && amount === preset.amount

                  return (
                    <button
                      key={percentage}
                      type="button"
                      disabled={flowState.isPreparing || !presetsEnabled}
                      onClick={() => setPercentageAmount(percentage)}
                      className={cn(
                        'rounded-full bg-subText-20 px-2 py-0.5 text-xs font-medium text-subText hover:text-text',
                        selected && 'bg-background text-text',
                        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-subText',
                      )}
                    >
                      {percentage}%
                    </button>
                  )
                })}
              </HStack>
            }
            positionMax="top"
          />
          {amountError && (
            <span role="alert" className="px-1 text-xs text-red">
              {amountError}
            </span>
          )}
        </Stack>

        <p className="text-sm leading-5 text-text">
          You will follow new trades from this moment. Your P&amp;L may differ from the agent&apos;s stats until open
          positions close.
        </p>

        <HStack className="items-start gap-2.5 rounded-xl bg-blue/[0.08] p-3 text-blue2">
          <Info size={16} className="mt-0.5 shrink-0" />
          <span className="text-xs italic">
            Earlier subscribers get executed before later ones. Price may vary slightly across executions.
          </span>
        </HStack>

        <ButtonPrimary
          type="button"
          disabled={
            flowState.isPreparing || (!!account && onExpectedChain && (!amountIsValid || !!availabilityMessage))
          }
          title={amountError || availabilityMessage}
          onClick={handlePrimaryAction}
        >
          {flowState.isPreparing ? <Dots>{primaryActionLabel}</Dots> : primaryActionLabel}
        </ButtonPrimary>
      </Stack>
    </PreparedActionModal>
  )
}

export default StartCopyModal

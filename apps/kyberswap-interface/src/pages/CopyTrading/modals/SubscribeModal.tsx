import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { useMemo, useState } from 'react'
import { Info } from 'react-feather'
import copyTradingApi, { usePrepareStartCopyMutation } from 'services/copyTrading'
import type { AgentCard, AgentProfile, PreparedCallKind } from 'services/copyTrading/types'
import { v4 as uuidv4 } from 'uuid'

import verifiedIcon from 'assets/images/copy-trading/verified.svg'
import { ButtonPrimary } from 'components/Button'
import Checkbox from 'components/CheckBox'
import CopyHelper from 'components/Copy'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import InfoHelper from 'components/InfoHelper'
import { Center, HStack, Stack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import useTokenBalance from 'hooks/useTokenBalance'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { getAgentInitials } from 'pages/CopyTrading/helpers'
import PreparedActionModal, { ReviewRow, ReviewSection } from 'pages/CopyTrading/write/PreparedActionModal'
import { useCopyTradeWrite } from 'pages/CopyTrading/write/WriteContext'
import {
  formatPreparedAmount,
  formatWadPercent,
  getInputQuoteToken,
  getPreparedReasonMessage,
  isActionAvailable,
  parsePreparedAmount,
} from 'pages/CopyTrading/write/preparedAction'
import { DEFAULT_PREPARED_ACTION_STATE, usePreparedAction } from 'pages/CopyTrading/write/usePreparedAction'
import { useWalletModalToggle } from 'state/application/hooks'
import { shortenAddress } from 'utils/address'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

export type SubscribeTarget = AgentCard | AgentProfile

type SubscribeModalProps = {
  isOpen: boolean
  onDismiss: () => void
  target: SubscribeTarget
}

const START_CALL_KINDS: PreparedCallKind[] = [
  'PREPARED_CALL_KIND_START_COPY_CREATE',
  'PREPARED_CALL_KIND_START_COPY_FUND',
]
const CAPITAL_PERCENTAGES = [25, 50, 75, 100] as const

const ReviewLabel = ({ label, tooltip }: { label: string; tooltip: string }) => (
  <span className="inline-flex items-center gap-1">
    {label}
    <InfoHelper text={tooltip} margin={false} placement="top" size={13} />
  </span>
)

const AgentHeader = ({ agent }: { agent: SubscribeTarget }) => (
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

const SubscribeModal = ({ isOpen, onDismiss, target }: SubscribeModalProps) => {
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()
  const { refreshCopyTrading } = useCopyTradeWrite()
  const [prepareStartCopy] = usePrepareStartCopyMutation()
  const { data: agentResponse, isFetching: isRefreshingAgent } = copyTradingApi.useGetAgentQuery(
    { agentId: target.agentId },
    { skip: !isOpen },
  )
  const [flowState, setFlowState] = useState(DEFAULT_PREPARED_ACTION_STATE)
  const [amount, setAmount] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [predictedCopyAccount, setPredictedCopyAccount] = useState<string>()
  const [startRequestId, setStartRequestId] = useState(() => uuidv4())

  const quoteToken = getInputQuoteToken(target.chainId)
  const quoteCurrency = useMemo(
    () =>
      quoteToken
        ? new Token(target.chainId, quoteToken.address, quoteToken.decimals, quoteToken.symbol, quoteToken.symbol)
        : undefined,
    [quoteToken, target.chainId],
  )
  const walletBalance = useTokenBalance(quoteToken?.address || '', target.chainId as ChainId)
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
  const availability = agentResponse?.data.startCopyAvailability || target.startCopyAvailability
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
  const onExpectedChain = chainId === target.chainId
  const presetsEnabled = !!account && onExpectedChain && !!walletBalanceRaw && BigInt(walletBalanceRaw) > 0n
  const walletBalanceText =
    walletBalanceRaw && quoteToken
      ? formatDisplayNumber(formatUnits(BigInt(walletBalanceRaw), quoteToken.decimals), { significantDigits: 8 })
      : account
      ? '0'
      : 'Connect wallet'
  const startPreview = flowState.action?.startCopy
  const preparedToken = startPreview?.quoteToken
  const callKind = flowState.action?.call?.kind
  const preparedWalletBalanceRaw = startPreview?.walletQuoteBalance?.valueRaw
  const requiredWalletBalanceRaw = startPreview?.remainingTargetDeficit?.valueRaw || targetCapitalRaw
  const preparedBalanceIsInsufficient =
    !!requiredWalletBalanceRaw &&
    !!preparedWalletBalanceRaw &&
    BigInt(requiredWalletBalanceRaw) > BigInt(preparedWalletBalanceRaw)
  const confirmBalanceError =
    amountError ||
    (preparedBalanceIsInsufficient ? `Insufficient ${quoteToken?.symbol || 'quote token'} balance.` : undefined)

  const flow = usePreparedAction({
    state: flowState,
    setState: setFlowState,
    expected: {
      account: account || '',
      callKinds: START_CALL_KINDS,
      chainId: target.chainId,
      preview: 'startCopy',
      startCopyPredictedAccount: predictedCopyAccount,
      startCopyRequestId: startRequestId,
    },
    prepare: async () => {
      if (!account || !quoteToken) throw new Error('Connect a supported wallet and network first.')

      if (!targetCapitalRaw) throw new Error('Enter an amount greater than zero.')
      if (amountError) throw new Error(amountError)
      const response = await prepareStartCopy({
        ownerAddress: account.toLowerCase(),
        agentId: target.agentId,
        chainId: String(target.chainId),
        targetCapitalRaw,
        startRequestId,
      }).unwrap()
      if (
        [
          'PREPARED_ACTION_STATUS_READY',
          'PREPARED_ACTION_STATUS_PARTIALLY_COMPLETED',
          'PREPARED_ACTION_STATUS_COMPLETED',
        ].includes(response.data.status || '') &&
        response.data.startCopy?.requestedTargetRaw !== targetCapitalRaw
      ) {
        throw new Error('The prepared target does not match your requested capital amount.')
      }
      const nextPredictedCopyAccount = response.data.startCopy?.predictedCopyAccount
      if (predictedCopyAccount && nextPredictedCopyAccount?.toLowerCase() !== predictedCopyAccount.toLowerCase()) {
        throw new Error('The prepared Start Copy Smart Wallet changed during this attempt.')
      }
      if (!predictedCopyAccount && nextPredictedCopyAccount) setPredictedCopyAccount(nextPredictedCopyAccount)
      return response.data
    },
    afterReceipt: action => {
      setAgreed(false)
      return action.call?.kind === 'PREPARED_CALL_KIND_START_COPY_CREATE' ? 'reprepare' : 'complete'
    },
    onComplete: refreshCopyTrading,
  })

  const dismiss = () => {
    flow.reset()
    setAmount('')
    setAgreed(false)
    setPredictedCopyAccount(undefined)
    setStartRequestId(uuidv4())
    onDismiss()
  }

  const editAmount = () => {
    flow.reset()
    setAgreed(false)
    setPredictedCopyAccount(undefined)
    setStartRequestId(uuidv4())
  }

  const handlePrimaryAction = () => {
    if (!account) {
      toggleWalletModal()
      return
    }
    if (!onExpectedChain) {
      void changeNetwork(target.chainId as ChainId)
      return
    }
    if (!amountIsValid) return
    void flow.prepare()
  }

  const setPercentageAmount = (percentage: (typeof CAPITAL_PERCENTAGES)[number]) => {
    const preset = presetAmounts?.find(item => item.percentage === percentage)
    if (!presetsEnabled || !preset) return

    setAmount(preset.amount)
    setAgreed(false)
  }

  const confirmLabel = callKind === 'PREPARED_CALL_KIND_START_COPY_FUND' ? 'Continue Start Copying' : 'Start Copying'

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
          value={startPreview ? formatWadPercent(startPreview.feePolicy?.advertisedUpfrontFeeRateRaw) : 'Checking…'}
        />
      </ReviewSection>

      <label className="flex cursor-pointer items-start gap-3 text-xs text-subText">
        <Checkbox
          borderStyle
          checked={agreed}
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

  const availabilityMessage = isRefreshingAgent
    ? 'Refreshing availability…'
    : !isActionAvailable(availability)
    ? getPreparedReasonMessage(availability?.reason)
    : undefined

  return (
    <PreparedActionModal
      isOpen={isOpen}
      onDismiss={dismiss}
      state={flowState}
      title={<AgentHeader agent={agentResponse?.data || target} />}
      review={review}
      showReviewWhilePreparing
      confirmLabel={confirmLabel}
      confirmDisabled={!agreed || !!confirmBalanceError}
      onBack={flowState.hash ? undefined : editAmount}
      onConfirm={() => {
        if (confirmBalanceError) return
        void flow.confirm()
      }}
      onRetry={() => void flow.retry()}
      pendingText="Checking the latest agent, balance and fee policy…"
      successTitle={`You're now copying ${target.displayName}`}
      successText={
        flowState.hash
          ? 'The transaction is confirmed on-chain. Copy Trading data will refresh in the background.'
          : 'This Start Copy request is already complete.'
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
            customChainId={target.chainId as ChainId}
            disableCurrencySelect
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
                      disabled={!presetsEnabled}
                      onClick={() => setPercentageAmount(percentage)}
                      className={cn(
                        'rounded-full bg-subText-20 px-2 py-0.5 text-xs font-medium text-subText transition-colors',
                        'hover:text-text focus-visible:text-text-60 focus-visible:outline-none',
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
          disabled={!!account && onExpectedChain && (!amountIsValid || !!availabilityMessage)}
          title={amountError || availabilityMessage}
          onClick={handlePrimaryAction}
        >
          {!account
            ? 'Connect wallet'
            : !onExpectedChain
            ? 'Switch network'
            : availabilityMessage || !quoteToken
            ? 'Start Copy unavailable'
            : 'Next →'}
        </ButtonPrimary>
      </Stack>
    </PreparedActionModal>
  )
}

export default SubscribeModal

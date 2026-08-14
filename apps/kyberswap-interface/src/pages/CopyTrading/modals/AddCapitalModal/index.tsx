import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { useMemo, useState } from 'react'
import { usePrepareAddCapitalMutation } from 'services/copyTrading'
import type { CopyRunSummary, PreparedCallKind } from 'services/copyTrading/types'

import { ButtonPrimary } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Dots from 'components/Dots'
import { HStack, Stack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import useTokenBalance from 'hooks/useTokenBalance'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { getPreparedReasonMessage, isActionAvailable } from 'pages/CopyTrading/actionAvailability'
import useRefreshCopyTrading from 'pages/CopyTrading/hooks/useRefreshCopyTrading'
import PreparedActionModal, { ReviewRow, ReviewSection } from 'pages/CopyTrading/modals/PreparedActionModal'
import {
  formatPreparedAmount,
  getInputQuoteToken,
  parsePreparedAmount,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import {
  DEFAULT_PREPARED_ACTION_STATE,
  usePreparedAction,
} from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import { useWalletModalToggle } from 'state/application/hooks'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

type AddCapitalModalProps = {
  isOpen: boolean
  onDismiss: () => void
  copyRun: CopyRunSummary
  agentName?: string
}

const ADD_CAPITAL_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_ADD_CAPITAL']
const CAPITAL_PERCENTAGES = [25, 50, 75, 100] as const

const AddCapitalModal = ({ isOpen, onDismiss, copyRun, agentName }: AddCapitalModalProps) => {
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()
  const refreshCopyTrading = useRefreshCopyTrading()
  const [prepareAddCapital] = usePrepareAddCapitalMutation()

  const [flowState, setFlowState] = useState(DEFAULT_PREPARED_ACTION_STATE)
  const [amount, setAmount] = useState('')

  const quoteToken = getInputQuoteToken(copyRun.chainId)
  const quoteCurrency = useMemo(
    () =>
      quoteToken
        ? new Token(copyRun.chainId, quoteToken.address, quoteToken.decimals, quoteToken.symbol, quoteToken.symbol)
        : undefined,
    [copyRun.chainId, quoteToken],
  )

  const walletBalance = useTokenBalance(quoteToken?.address || '', copyRun.chainId as ChainId)
  const walletBalanceRaw = account && quoteToken ? walletBalance.value.toString() : undefined

  const presetAmounts = useMemo(() => {
    if (!quoteToken || !walletBalanceRaw) return undefined

    return CAPITAL_PERCENTAGES.map(percentage => ({
      percentage,
      amount: formatUnits((BigInt(walletBalanceRaw) * BigInt(percentage)) / 100n, quoteToken.decimals),
    }))
  }, [quoteToken, walletBalanceRaw])

  const amountRaw = useMemo(() => {
    if (!quoteToken) return undefined
    try {
      return parsePreparedAmount(amount, quoteToken.decimals)
    } catch {
      return undefined
    }
  }, [amount, quoteToken])

  const availability = copyRun.addCapitalAvailability
  const onExpectedChain = chainId === copyRun.chainId
  const ownershipMessage =
    account && copyRun.ownerAddress.toLowerCase() !== account.toLowerCase()
      ? 'The selected Copy Run is not owned by the connected wallet.'
      : undefined
  const insufficientBalance = !!amountRaw && !!walletBalanceRaw && BigInt(amountRaw) > BigInt(walletBalanceRaw)
  const amountError =
    amount && insufficientBalance ? `Insufficient ${quoteToken?.symbol || 'quote token'} balance.` : undefined
  const amountIsValid = !!amountRaw && !insufficientBalance
  const presetsEnabled = !!account && onExpectedChain && !!walletBalanceRaw && BigInt(walletBalanceRaw) > 0n
  const walletBalanceText =
    walletBalanceRaw && quoteToken
      ? formatDisplayNumber(formatUnits(BigInt(walletBalanceRaw), quoteToken.decimals), { significantDigits: 8 })
      : account
      ? '0'
      : 'Connect wallet'

  const preview = flowState.action?.addCapital
  const preparedWalletBalanceRaw = preview?.walletQuoteBalance?.valueRaw
  const preparedBalanceIsInsufficient =
    !!preview?.addedCapitalRaw &&
    !!preparedWalletBalanceRaw &&
    BigInt(preview.addedCapitalRaw) > BigInt(preparedWalletBalanceRaw)
  const confirmBalanceError =
    amountError ||
    (preparedBalanceIsInsufficient ? `Insufficient ${quoteToken?.symbol || 'quote token'} balance.` : undefined)

  const flow = usePreparedAction({
    state: flowState,
    setState: setFlowState,
    expected: {
      account: account || '',
      callKinds: ADD_CAPITAL_CALL_KINDS,
      chainId: copyRun.chainId,
      copyAccount: copyRun.copyAccount,
      preview: 'addCapital',
    },
    prepare: async () => {
      if (!account || !quoteToken) throw new Error('Connect a supported wallet and network first.')
      if (copyRun.ownerAddress.toLowerCase() !== account.toLowerCase()) {
        throw new Error('The selected Copy Run is not owned by the connected wallet.')
      }
      if (amountError) throw new Error(amountError)
      const amountRaw = parsePreparedAmount(amount, quoteToken.decimals)
      const response = await prepareAddCapital({
        ownerAddress: account.toLowerCase(),
        copyRunId: copyRun.copyRunId,
        amountRaw,
      }).unwrap()
      if (
        response.data.status === 'PREPARED_ACTION_STATUS_READY' &&
        response.data.addCapital?.addedCapitalRaw !== amountRaw
      ) {
        throw new Error('The prepared amount does not match the requested capital amount.')
      }
      return response.data
    },
    onComplete: refreshCopyTrading,
  })

  const dismiss = () => {
    flow.reset()
    setAmount('')
    onDismiss()
  }

  const handlePrimaryAction = () => {
    if (!account) {
      toggleWalletModal()
      return
    }
    if (!onExpectedChain) {
      void changeNetwork(copyRun.chainId as ChainId)
      return
    }
    if (!amountIsValid) return
    void flow.prepare()
  }

  const setPercentageAmount = (percentage: (typeof CAPITAL_PERCENTAGES)[number]) => {
    const preset = presetAmounts?.find(item => item.percentage === percentage)
    if (flowState.isPreparing || !presetsEnabled || !preset) return

    setAmount(preset.amount)
  }

  const availabilityMessage = ownershipMessage
    ? ownershipMessage
    : !isActionAvailable(availability)
    ? getPreparedReasonMessage(availability?.reason)
    : undefined
  const primaryActionLabel = !account
    ? 'Connect wallet'
    : !onExpectedChain
    ? 'Switch network'
    : availabilityMessage || !quoteToken
    ? 'Add Capital unavailable'
    : 'Review Add Capital'

  const preparedToken = preview?.quoteToken
  const review = (
    <Stack className="gap-2">
      <ReviewSection title="Review capital allocation">
        <ReviewRow label="Agent" value={agentName || copyRun.agentSnapshot?.displayName || 'Copy Run'} />
        <ReviewRow label="Add capital" value={formatPreparedAmount(preview?.addedCapitalRaw, preparedToken)} />
        <ReviewRow label="Minimum" value={formatPreparedAmount(preview?.minimumAddCapitalRaw, preparedToken)} />
        <ReviewRow label="Wallet balance" value={formatPreparedAmount(preview?.walletQuoteBalance, preparedToken)} />
        <ReviewRow
          label="New allocated capital"
          value={formatPreparedAmount(preview?.newAllocatedCapital, preparedToken)}
        />
      </ReviewSection>
      {confirmBalanceError && (
        <span role="alert" className="text-xs text-red">
          {confirmBalanceError}
        </span>
      )}
    </Stack>
  )

  return (
    <PreparedActionModal
      isOpen={isOpen}
      onDismiss={dismiss}
      state={flowState}
      title="Add Capital"
      review={review}
      confirmLabel="Add Capital"
      confirmDisabled={!!confirmBalanceError}
      onBack={flow.reset}
      onConfirm={() => {
        if (confirmBalanceError) return
        void flow.confirm()
      }}
      onRetry={() => void flow.retry()}
      successTitle="Capital added"
      successText="The transaction is confirmed on-chain. Copy Trading data will refresh in the background."
      width={520}
    >
      <Stack className="gap-4">
        <Stack className="gap-2">
          <span className="text-sm font-medium text-text">Add Capital</span>
          <CurrencyInputPanel
            value={amount}
            onUserInput={setAmount}
            error={!!amountError}
            currency={quoteCurrency}
            customBalanceText={walletBalanceText}
            customChainId={copyRun.chainId as ChainId}
            disableCurrencySelect
            disabledInput={flowState.isPreparing}
            id="copy-trading-add-capital"
            dataTestId="copy-trading-add-capital"
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

        <p className="text-sm text-subText">
          Deposit more capital{agentName ? ` for ${agentName}` : ''}. The API fixes the quote token and returns the
          current minimum before your wallet is asked to confirm.
        </p>
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

export default AddCapitalModal

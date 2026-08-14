import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { useMemo, useState } from 'react'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'
import type { PreparedCallKind } from 'services/copyTrading/types/preparedActions'

import { useActiveWeb3React } from 'hooks'
import useTokenBalance from 'hooks/useTokenBalance'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { getPreparedReasonMessage, isActionAvailable } from 'pages/CopyTrading/helpers'
import useRefreshCopyTrading from 'pages/CopyTrading/hooks/useRefreshCopyTrading'
import {
  AddCapitalForm,
  AddCapitalReview,
  CAPITAL_PERCENTAGES,
  type CapitalPercentage,
} from 'pages/CopyTrading/modals/AddCapitalModal/components'
import PreparedActionModal from 'pages/CopyTrading/modals/PreparedActionModal'
import {
  DEFAULT_PREPARED_ACTION_STATE,
  getInputQuoteToken,
  parsePreparedAmount,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { usePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import { useWalletModalToggle } from 'state/application/hooks'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

type AddCapitalModalProps = {
  isOpen: boolean
  onDismiss: () => void
  copyRun: CopyRunSummary
  agentName?: string
}

const ADD_CAPITAL_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_ADD_CAPITAL']

const AddCapitalModal = ({ isOpen, onDismiss, copyRun, agentName }: AddCapitalModalProps) => {
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()
  const refreshCopyTrading = useRefreshCopyTrading()
  const [prepareAddCapital] = preparedActionApi.usePrepareAddCapitalMutation()

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

  const onExpectedChain = chainId === copyRun.chainId
  const ownershipMessage =
    account && copyRun.ownerAddress.toLowerCase() !== account.toLowerCase()
      ? 'The selected Copy Run is not owned by the connected wallet.'
      : undefined
  const insufficientBalance = !!amountRaw && !!walletBalanceRaw && BigInt(amountRaw) > BigInt(walletBalanceRaw)
  const amountError =
    amount && insufficientBalance ? 'Insufficient ' + (quoteToken?.symbol || 'quote token') + ' balance.' : undefined
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
    (preparedBalanceIsInsufficient ? 'Insufficient ' + (quoteToken?.symbol || 'quote token') + ' balance.' : undefined)

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

      const preparedAmountRaw = parsePreparedAmount(amount, quoteToken.decimals)
      const response = await prepareAddCapital({
        ownerAddress: account.toLowerCase(),
        copyRunId: copyRun.copyRunId,
        amountRaw: preparedAmountRaw,
      }).unwrap()
      if (
        response.data.status === 'PREPARED_ACTION_STATUS_READY' &&
        response.data.addCapital?.addedCapitalRaw !== preparedAmountRaw
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

  const setPercentageAmount = (percentage: CapitalPercentage) => {
    const preset = presetAmounts?.find(item => item.percentage === percentage)
    if (flowState.isPreparing || !presetsEnabled || !preset) return

    setAmount(preset.amount)
  }

  const availabilityMessage = ownershipMessage
    ? ownershipMessage
    : !isActionAvailable(copyRun.addCapitalAvailability)
    ? getPreparedReasonMessage(copyRun.addCapitalAvailability?.reason)
    : undefined
  const primaryActionLabel = !account
    ? 'Connect wallet'
    : !onExpectedChain
    ? 'Switch network'
    : availabilityMessage || !quoteToken
    ? 'Add Capital unavailable'
    : 'Review Add Capital'

  return (
    <PreparedActionModal
      isOpen={isOpen}
      onDismiss={dismiss}
      state={flowState}
      title="Add Capital"
      review={
        <AddCapitalReview
          agentName={agentName}
          confirmBalanceError={confirmBalanceError}
          copyRun={copyRun}
          preview={preview}
        />
      }
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
      <AddCapitalForm
        accountConnected={!!account}
        agentName={agentName}
        amount={amount}
        amountError={amountError}
        amountIsValid={amountIsValid}
        availabilityMessage={availabilityMessage}
        isPreparing={flowState.isPreparing === true}
        onAmountChange={setAmount}
        onExpectedChain={onExpectedChain}
        onPercentageChange={setPercentageAmount}
        onPrimaryAction={handlePrimaryAction}
        presetAmounts={presetAmounts}
        presetsEnabled={presetsEnabled}
        primaryActionLabel={primaryActionLabel}
        quoteCurrency={quoteCurrency}
        selectedChainId={copyRun.chainId}
        walletBalanceText={walletBalanceText}
      />
    </PreparedActionModal>
  )
}

export default AddCapitalModal

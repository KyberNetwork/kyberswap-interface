import { ChainId } from '@kyberswap/ks-sdk-core'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'
import type { PreparedCallKind } from 'services/copyTrading/types/preparedActions'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { getPreparedReasonMessage, isActionAvailable } from 'pages/CopyTrading/helpers'
import useRefreshCopyTrading from 'pages/CopyTrading/hooks/useRefreshCopyTrading'
import { AddCapitalForm, AddCapitalReview } from 'pages/CopyTrading/modals/AddCapitalModal/components'
import { type CapitalPercentage } from 'pages/CopyTrading/modals/CapitalAmount/capital'
import { useCapitalAmount } from 'pages/CopyTrading/modals/CapitalAmount/useCapitalAmount'
import PreparedActionModal, { PreparedActionSuccessActions } from 'pages/CopyTrading/modals/PreparedActionModal'
import { DEFAULT_PREPARED_ACTION_STATE } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { usePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import { useWalletModalToggle } from 'state/application/hooks'

type AddCapitalModalProps = {
  isOpen: boolean
  onDismiss: () => void
  copyRun: CopyRunSummary
  agentName?: string
}

const ADD_CAPITAL_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_ADD_CAPITAL']

const AddCapitalModal = ({ isOpen, onDismiss, copyRun, agentName }: AddCapitalModalProps) => {
  const navigate = useNavigate()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()
  const refreshCopyTrading = useRefreshCopyTrading()
  const [prepareAddCapital] = preparedActionApi.usePrepareAddCapitalMutation()

  const [flowState, setFlowState] = useState(DEFAULT_PREPARED_ACTION_STATE)
  const capital = useCapitalAmount({
    account: account || undefined,
    action: 'addCapital',
    connectedChainId: chainId,
    targetChainId: copyRun.chainId,
  })

  const ownershipMessage =
    account && copyRun.ownerAddress.toLowerCase() !== account.toLowerCase()
      ? 'The selected Copy Run is not owned by the connected wallet.'
      : undefined

  const preview = flowState.action?.addCapital

  const preparedWalletBalanceRaw = preview?.walletQuoteBalance?.valueRaw
  const preparedBalanceIsInsufficient =
    !!preview?.addedCapitalRaw &&
    !!preparedWalletBalanceRaw &&
    BigInt(preview.addedCapitalRaw) > BigInt(preparedWalletBalanceRaw)
  const confirmBalanceError =
    capital.amountError ||
    (preparedBalanceIsInsufficient
      ? 'Insufficient ' + (capital.quoteToken?.symbol || 'quote token') + ' balance.'
      : undefined)

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
      if (!account || !capital.quoteToken) throw new Error('Connect a supported wallet and network first.')
      if (copyRun.ownerAddress.toLowerCase() !== account.toLowerCase()) {
        throw new Error('The selected Copy Run is not owned by the connected wallet.')
      }
      if (!capital.amountRaw) throw new Error('Enter an amount greater than zero.')
      if (capital.amountError) throw new Error(capital.amountError)

      const response = await prepareAddCapital({
        ownerAddress: account.toLowerCase(),
        copyRunId: copyRun.copyRunId,
        amountRaw: capital.amountRaw,
      }).unwrap()
      if (
        [
          'PREPARED_ACTION_STATUS_READY',
          'PREPARED_ACTION_STATUS_PARTIALLY_COMPLETED',
          'PREPARED_ACTION_STATUS_COMPLETED',
          'PREPARED_ACTION_STATUS_PENDING',
        ].includes(response.data.status || '') &&
        response.data.addCapital?.addedCapitalRaw !== capital.amountRaw
      ) {
        throw new Error('The prepared amount does not match the requested capital amount.')
      }

      return response.data
    },
    onComplete: refreshCopyTrading,
  })

  const dismiss = () => {
    flow.reset()
    capital.setAmount('')
    onDismiss()
  }

  const handlePrimaryAction = () => {
    if (!account) {
      toggleWalletModal()
      return
    }
    if (!capital.onExpectedChain) {
      void changeNetwork(copyRun.chainId as ChainId)
      return
    }
    if (!capital.amountIsValid) return

    void flow.prepare()
  }

  const setPercentageAmount = (percentage: CapitalPercentage) => {
    const preset = capital.getPreset(percentage)
    if (flowState.isPreparing || !capital.presetsEnabled || !preset) return

    capital.setAmount(preset.amount)
  }

  const viewMyCopies = () => {
    dismiss()
    navigate(APP_PATHS.COPY_TRADING + '/my-copies')
  }

  const availabilityMessage = ownershipMessage
    ? ownershipMessage
    : !isActionAvailable(copyRun.addCapitalAvailability)
    ? getPreparedReasonMessage(copyRun.addCapitalAvailability?.reason)
    : undefined
  const primaryActionLabel = !account
    ? 'Connect wallet'
    : !capital.onExpectedChain
    ? 'Switch network'
    : availabilityMessage || !capital.quoteToken
    ? 'Add Capital unavailable'
    : 'Review Add Capital'

  const reviewPreparing = flowState.phase === 'review' && flowState.isPreparing === true

  const successActions = (
    <PreparedActionSuccessActions onClose={dismiss} onPrimaryAction={viewMyCopies} primaryLabel="My Copies" />
  )

  return (
    <PreparedActionModal
      isOpen={isOpen}
      onDismiss={dismiss}
      state={flowState}
      title="Add Capital"
      review={
        <AddCapitalReview confirmBalanceError={confirmBalanceError} isLoading={reviewPreparing} preview={preview} />
      }
      confirmLabel={reviewPreparing ? 'Preparing' : 'Add Capital'}
      confirmDisabled={!!confirmBalanceError}
      onBack={flow.reset}
      onConfirm={() => {
        if (confirmBalanceError) return
        void flow.confirm()
      }}
      onRetry={() => void flow.retry()}
      successTitle="Capital added"
      successActions={successActions}
      width={520}
    >
      <AddCapitalForm
        accountConnected={!!account}
        agentName={agentName}
        amount={capital.amount}
        amountError={capital.amountError}
        amountIsValid={capital.amountIsValid}
        availabilityMessage={availabilityMessage}
        isPreparing={flowState.isPreparing === true}
        onAmountChange={capital.setAmount}
        onExpectedChain={capital.onExpectedChain}
        onPercentageChange={setPercentageAmount}
        onPrimaryAction={handlePrimaryAction}
        presetAmounts={capital.presetAmounts}
        presetsEnabled={capital.presetsEnabled}
        primaryActionLabel={primaryActionLabel}
        quoteCurrency={capital.quoteCurrency}
        selectedChainId={copyRun.chainId}
        walletBalanceText={capital.walletBalanceText}
      />
    </PreparedActionModal>
  )
}

export default AddCapitalModal

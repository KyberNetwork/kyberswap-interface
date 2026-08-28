import { ChainId } from '@kyberswap/ks-sdk-core'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import type { CopyRunListItem } from 'services/copyTrading/types/copyRuns'
import type { PreparedCallKind } from 'services/copyTrading/types/preparedActions'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { formatTokenAmount, sumUsdValues } from 'pages/CopyTrading/helpers'
import useRefreshCopyTrading from 'pages/CopyTrading/hooks/useRefreshCopyTrading'
import { AddCapitalForm } from 'pages/CopyTrading/modals/AddCapitalModal/components'
import { type CapitalPercentage } from 'pages/CopyTrading/modals/CapitalAmount/capital'
import { useCapitalAmount } from 'pages/CopyTrading/modals/CapitalAmount/useCapitalAmount'
import PreparedActionModal, { PreparedActionSuccessActions } from 'pages/CopyTrading/modals/PreparedActionModal'
import { DEFAULT_PREPARED_ACTION_STATE } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { usePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import {
  getCopyRunOwnershipMessage,
  getWriteAvailabilityMessage,
  getWritePrimaryActionLabel,
  isWritePrimaryActionDisabled,
} from 'pages/CopyTrading/modals/writeAction'
import { useWalletModalToggle } from 'state/application/hooks'

type AddCapitalModalProps = {
  isOpen: boolean
  onDismiss: () => void
  copyRun: CopyRunListItem
}

const ADD_CAPITAL_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_ADD_CAPITAL']

const AddCapitalModal = ({ isOpen, onDismiss, copyRun }: AddCapitalModalProps) => {
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

  const ownershipMessage = getCopyRunOwnershipMessage(copyRun.ownerAddress, account)

  const currentAllocatedCapitalUsd = copyRun.capitalInUsd
  const newAllocatedCapitalUsd =
    currentAllocatedCapitalUsd !== undefined
      ? sumUsdValues(currentAllocatedCapitalUsd, capital.amount || '0')
      : undefined
  const formatCapitalAmount = (value?: string) => {
    const formattedAmount = formatTokenAmount(value)
    return value !== undefined && capital.quoteToken?.symbol
      ? `${formattedAmount} ${capital.quoteToken.symbol}`
      : formattedAmount
  }

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
      if (ownershipMessage) throw new Error(ownershipMessage)
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

    void flow.prepareAndConfirm()
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

  const accountConnected = !!account
  const isPreparing = flowState.isPreparing === true
  const availabilityMessage = getWriteAvailabilityMessage(copyRun.addCapitalAvailability, ownershipMessage)
  const unavailable = !!availabilityMessage || !capital.quoteToken
  const primaryActionLabel = getWritePrimaryActionLabel({
    accountConnected,
    onExpectedChain: capital.onExpectedChain,
    readyLabel: 'Add Capital',
    unavailable,
    unavailableLabel: 'Add Capital Unavailable',
  })
  const primaryActionDisabled = isWritePrimaryActionDisabled({
    accountConnected,
    executionBlocked: !capital.amountIsValid || !!availabilityMessage,
    interactionLocked: isPreparing,
    onExpectedChain: capital.onExpectedChain,
  })

  const successActions = (
    <PreparedActionSuccessActions onClose={dismiss} onPrimaryAction={viewMyCopies} primaryLabel="My Copies" />
  )

  return (
    <PreparedActionModal
      isOpen={isOpen}
      onDismiss={dismiss}
      state={flowState}
      title={`Add Capital - ${copyRun.agentSnapshot?.displayName}`}
      review={null}
      confirmLabel="Add Capital"
      confirmLoading={isPreparing}
      onBack={flow.reset}
      onConfirm={() => void flow.confirm()}
      onRetry={() => void flow.retryAndConfirm()}
      successTitle="Capital added"
      successActions={successActions}
      width={520}
    >
      <AddCapitalForm
        amount={capital.amount}
        amountError={capital.amountError}
        availabilityMessage={availabilityMessage}
        currentAllocatedCapital={formatCapitalAmount(currentAllocatedCapitalUsd)}
        isPreparing={isPreparing}
        newAllocatedCapital={formatCapitalAmount(newAllocatedCapitalUsd)}
        onAmountChange={capital.setAmount}
        onCancel={dismiss}
        onPercentageChange={setPercentageAmount}
        onPrimaryAction={handlePrimaryAction}
        presetsEnabled={capital.presetsEnabled}
        primaryActionDisabled={primaryActionDisabled}
        primaryActionLabel={primaryActionLabel}
        quoteCurrency={capital.quoteCurrency}
        selectedChainId={copyRun.chainId}
        walletBalanceLoading={capital.walletBalanceLoading}
        walletBalanceText={capital.walletBalanceText}
      />
    </PreparedActionModal>
  )
}

export default AddCapitalModal

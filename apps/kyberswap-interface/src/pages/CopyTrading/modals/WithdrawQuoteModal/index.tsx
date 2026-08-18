import { ChainId } from '@kyberswap/ks-sdk-core'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import type { AdvisoryActionAvailability } from 'services/copyTrading/types/actionAvailability'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'
import type { PreparedCallKind } from 'services/copyTrading/types/preparedActions'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { getPreparedReasonMessage, isActionAvailable } from 'pages/CopyTrading/helpers'
import useRefreshCopyTrading from 'pages/CopyTrading/hooks/useRefreshCopyTrading'
import PreparedActionModal, { PreparedActionSuccessActions } from 'pages/CopyTrading/modals/PreparedActionModal'
import { DEFAULT_PREPARED_ACTION_STATE } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { usePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import { WithdrawQuoteForm, WithdrawQuoteReview } from 'pages/CopyTrading/modals/WithdrawQuoteModal/components'
import { useWalletModalToggle } from 'state/application/hooks'

type WithdrawQuoteModalProps = {
  isOpen: boolean
  onDismiss: () => void
  copyRun: CopyRunSummary
  withdrawQuoteAvailability?: AdvisoryActionAvailability
}

const WITHDRAW_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_WITHDRAW_QUOTE']

const WithdrawQuoteModal = ({ isOpen, onDismiss, copyRun, withdrawQuoteAvailability }: WithdrawQuoteModalProps) => {
  const navigate = useNavigate()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()
  const refreshCopyTrading = useRefreshCopyTrading()
  const [prepareWithdrawQuote] = preparedActionApi.usePrepareWithdrawQuoteMutation()

  const [flowState, setFlowState] = useState(DEFAULT_PREPARED_ACTION_STATE)

  const availability = withdrawQuoteAvailability || copyRun.withdrawQuoteAvailability
  const onExpectedChain = chainId === copyRun.chainId

  const flow = usePreparedAction({
    state: flowState,
    setState: setFlowState,
    expected: {
      account: account || '',
      callKinds: WITHDRAW_CALL_KINDS,
      chainId: copyRun.chainId,
      copyAccount: copyRun.copyAccount,
      preview: 'withdrawQuote',
    },
    prepare: async () => {
      if (!account) throw new Error('Connect your wallet first.')
      const response = await prepareWithdrawQuote({
        ownerAddress: account,
        copyRunId: copyRun.copyRunId,
      }).unwrap()
      const recipient = response.data.withdrawQuote?.recipientAddress
      const sweepAmountRaw = response.data.withdrawQuote?.sweepAmountRaw
      if (response.data.status === 'PREPARED_ACTION_STATUS_READY') {
        if (!recipient || recipient.toLowerCase() !== account.toLowerCase()) {
          throw new Error('The prepared withdrawal recipient does not match your wallet.')
        }
        if (!sweepAmountRaw || !/^\d+$/.test(sweepAmountRaw) || BigInt(sweepAmountRaw) <= 0n) {
          throw new Error('The prepared withdrawal is missing its exact sweep amount.')
        }
      }
      return response.data
    },
    onComplete: refreshCopyTrading,
  })

  const dismiss = () => {
    flow.reset()
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
    void flow.prepare()
  }

  const viewHistory = () => {
    dismiss()
    navigate(APP_PATHS.COPY_TRADING + '/history')
  }

  const availabilityMessage = !isActionAvailable(availability)
    ? getPreparedReasonMessage(availability?.reason)
    : undefined
  const primaryActionLabel = !account
    ? 'Connect wallet'
    : !onExpectedChain
    ? 'Switch network'
    : availabilityMessage
    ? 'Withdraw unavailable'
    : 'Review Withdrawal'

  const preview = flowState.action?.withdrawQuote
  const reviewPreparing = flowState.phase === 'review' && flowState.isPreparing === true
  const review = <WithdrawQuoteReview chainId={copyRun.chainId} isLoading={reviewPreparing} preview={preview} />
  const successActions = (
    <PreparedActionSuccessActions onClose={dismiss} onPrimaryAction={viewHistory} primaryLabel="View History" />
  )

  return (
    <PreparedActionModal
      isOpen={isOpen}
      onDismiss={dismiss}
      state={flowState}
      title="Withdraw Quote Balance"
      review={review}
      confirmLabel={reviewPreparing ? 'Preparing' : 'Withdraw'}
      onBack={flow.reset}
      onConfirm={() => void flow.confirm()}
      onRetry={() => void flow.retry()}
      successTitle="Withdrawal completed"
      successActions={successActions}
      width={480}
    >
      <WithdrawQuoteForm
        availabilityMessage={availabilityMessage}
        isPreparing={flowState.isPreparing === true}
        onPrimaryAction={handlePrimaryAction}
        primaryActionDisabled={flowState.isPreparing || (!!account && onExpectedChain && !!availabilityMessage)}
        primaryActionLabel={primaryActionLabel}
      />
    </PreparedActionModal>
  )
}

export default WithdrawQuoteModal

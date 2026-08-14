import { ChainId } from '@kyberswap/ks-sdk-core'
import { useState } from 'react'
import { usePrepareWithdrawQuoteMutation } from 'services/copyTrading'
import type { AdvisoryActionAvailability, CopyRunSummary, PreparedCallKind } from 'services/copyTrading/types'

import { ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import { HStack, Stack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import PreparedActionModal, { ReviewRow, ReviewSection } from 'pages/CopyTrading/write/PreparedActionModal'
import { useCopyTradeWrite } from 'pages/CopyTrading/write/WriteContext'
import {
  formatPreparedAmount,
  getPreparedReasonMessage,
  isActionAvailable,
} from 'pages/CopyTrading/write/preparedAction'
import { DEFAULT_PREPARED_ACTION_STATE, usePreparedAction } from 'pages/CopyTrading/write/usePreparedAction'
import { useWalletModalToggle } from 'state/application/hooks'
import { shortenAddress } from 'utils/address'

type WithdrawQuoteModalProps = {
  isOpen: boolean
  onDismiss: () => void
  copyRun: CopyRunSummary
  withdrawQuoteAvailability?: AdvisoryActionAvailability
}

const WITHDRAW_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_WITHDRAW_QUOTE']

const WithdrawQuoteModal = ({ isOpen, onDismiss, copyRun, withdrawQuoteAvailability }: WithdrawQuoteModalProps) => {
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()
  const { refreshCopyTrading } = useCopyTradeWrite()
  const [prepareWithdrawQuote] = usePrepareWithdrawQuoteMutation()
  const [flowState, setFlowState] = useState(DEFAULT_PREPARED_ACTION_STATE)

  const availability = withdrawQuoteAvailability || copyRun.withdrawQuoteAvailability
  const onExpectedChain = chainId === copyRun.chainId
  const ownershipMessage =
    account && copyRun.ownerAddress.toLowerCase() !== account.toLowerCase()
      ? 'The selected Copy Run is not owned by the connected wallet.'
      : undefined

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
      if (copyRun.ownerAddress.toLowerCase() !== account.toLowerCase()) {
        throw new Error('The selected Copy Run is not owned by the connected wallet.')
      }
      const response = await prepareWithdrawQuote({
        ownerAddress: account.toLowerCase(),
        copyRunId: copyRun.copyRunId,
      }).unwrap()
      const recipient = response.data.withdrawQuote?.recipientAddress
      if (response.data.status === 'PREPARED_ACTION_STATUS_READY') {
        if (!recipient || recipient.toLowerCase() !== account.toLowerCase()) {
          throw new Error('The prepared withdrawal recipient does not match your wallet.')
        }
        if (!/^\d+$/.test(response.data.withdrawQuote?.sweepAmountRaw || '')) {
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

  const preview = flowState.action?.withdrawQuote
  const review = (
    <ReviewSection title="Review withdrawal">
      <ReviewRow label="Available balance" value={formatPreparedAmount(preview?.quoteBalance, preview?.quoteToken)} />
      <ReviewRow label="Sweep amount" value={formatPreparedAmount(preview?.sweepAmountRaw, preview?.quoteToken)} />
      <ReviewRow
        label="Recipient"
        value={preview?.recipientAddress ? shortenAddress(copyRun.chainId, preview.recipientAddress) : '—'}
      />
    </ReviewSection>
  )

  const availabilityMessage = ownershipMessage
    ? ownershipMessage
    : !isActionAvailable(availability)
    ? getPreparedReasonMessage(availability?.reason)
    : undefined
  const primaryActionLabel = !account
    ? 'Connect wallet'
    : !onExpectedChain
    ? 'Switch network'
    : availabilityMessage
    ? 'Withdraw unavailable'
    : 'Review Withdrawal'

  return (
    <PreparedActionModal
      isOpen={isOpen}
      onDismiss={dismiss}
      state={flowState}
      title="Withdraw Quote Balance"
      review={review}
      confirmLabel="Withdraw"
      onBack={flow.reset}
      onConfirm={() => void flow.confirm()}
      onRetry={() => void flow.retry()}
      successTitle="Withdrawal completed"
      successText="The transaction is confirmed on-chain. Copy Trading data will refresh in the background."
    >
      <Stack className="gap-4">
        <p className="text-sm text-subText">
          Withdraw the prepared maximum quote-token balance to the current owner. The amount and recipient are fixed by
          the latest server evidence and cannot be edited.
        </p>
        <HStack className="items-start gap-2 rounded-xl bg-white-04 px-4 py-3 text-sm text-subText">
          Open positions are not sold by this action. Recover positions separately when the API advertises an action.
        </HStack>
        <ButtonPrimary
          type="button"
          disabled={flowState.isPreparing || (!!account && onExpectedChain && !!availabilityMessage)}
          title={availabilityMessage}
          onClick={handlePrimaryAction}
        >
          {flowState.isPreparing ? <Dots>{primaryActionLabel}</Dots> : primaryActionLabel}
        </ButtonPrimary>
      </Stack>
    </PreparedActionModal>
  )
}

export default WithdrawQuoteModal

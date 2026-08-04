import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo, useState } from 'react'
import { Briefcase } from 'react-feather'
import copyTradingApi, { usePrepareAddCapitalMutation } from 'services/copyTrading'
import type { CopyRunSummary, PreparedCallKind } from 'services/copyTrading/types'

import { ButtonPrimary } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import useTokenBalance from 'hooks/useTokenBalance'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import PreparedActionModal, { ReviewRow, ReviewSection } from 'pages/CopyTrading/write/PreparedActionModal'
import { useCopyTradeWrite } from 'pages/CopyTrading/write/WriteContext'
import {
  formatPreparedAmount,
  getInputQuoteToken,
  getPreparedReasonMessage,
  isActionAvailable,
  parsePreparedAmount,
} from 'pages/CopyTrading/write/preparedAction'
import { DEFAULT_PREPARED_ACTION_STATE, usePreparedAction } from 'pages/CopyTrading/write/usePreparedAction'
import { useWalletModalToggle } from 'state/application/hooks'

type AddCapitalModalProps = {
  isOpen: boolean
  onDismiss: () => void
  run: CopyRunSummary
  agentName?: string
}

const ADD_CAPITAL_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_ADD_CAPITAL']

const AddCapitalModal = ({ isOpen, onDismiss, run, agentName }: AddCapitalModalProps) => {
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()
  const { refreshCopyTrading } = useCopyTradeWrite()
  const [prepareAddCapital] = usePrepareAddCapitalMutation()
  const { data: runResponse, isFetching: isRefreshingRun } = copyTradingApi.useGetCopyRunQuery(
    { ownerAddress: run.ownerAddress, copyRunId: run.copyRunId },
    { skip: !isOpen },
  )
  const [flowState, setFlowState] = useState(DEFAULT_PREPARED_ACTION_STATE)
  const [amount, setAmount] = useState('')

  const directRun = runResponse?.data || run
  const quoteToken = getInputQuoteToken(directRun.chainId)
  const availability = directRun.addCapitalAvailability
  const onExpectedChain = chainId === directRun.chainId
  const ownershipMessage =
    account && directRun.ownerAddress.toLowerCase() !== account.toLowerCase()
      ? 'The selected Copy Run is not owned by the connected wallet.'
      : undefined
  const walletBalance = useTokenBalance(quoteToken?.address || '', directRun.chainId as ChainId)
  const walletBalanceRaw = account && quoteToken ? walletBalance.value.toString() : undefined
  const amountRaw = useMemo(() => {
    if (!quoteToken) return undefined
    try {
      return parsePreparedAmount(amount, quoteToken.decimals)
    } catch {
      return undefined
    }
  }, [amount, quoteToken])
  const insufficientBalance = !!amountRaw && !!walletBalanceRaw && BigInt(amountRaw) > BigInt(walletBalanceRaw)
  const amountError =
    amount && insufficientBalance ? `Insufficient ${quoteToken?.symbol || 'quote token'} balance.` : undefined
  const amountIsValid = !!amountRaw && !insufficientBalance
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
      chainId: directRun.chainId,
      copyAccount: directRun.copyAccount,
      preview: 'addCapital',
    },
    prepare: async () => {
      if (!account || !quoteToken) throw new Error('Connect a supported wallet and network first.')
      if (directRun.ownerAddress.toLowerCase() !== account.toLowerCase()) {
        throw new Error('The selected Copy Run is not owned by the connected wallet.')
      }
      if (amountError) throw new Error(amountError)
      const amountRaw = parsePreparedAmount(amount, quoteToken.decimals)
      const response = await prepareAddCapital({
        ownerAddress: account.toLowerCase(),
        copyRunId: directRun.copyRunId,
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
      void changeNetwork(directRun.chainId as ChainId)
      return
    }
    if (!amountIsValid) return
    void flow.prepare()
  }

  const preparedToken = preview?.quoteToken
  const review = (
    <Stack className="gap-2">
      <ReviewSection title="Review capital allocation">
        <ReviewRow label="Agent" value={agentName || directRun.agentSnapshot?.displayName || 'Copy Run'} />
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

  const availabilityMessage = isRefreshingRun
    ? 'Refreshing availability…'
    : ownershipMessage
    ? ownershipMessage
    : !isActionAvailable(availability)
    ? getPreparedReasonMessage(availability?.reason)
    : undefined

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
      pendingText="Checking the latest balance, minimum and allocation…"
      successTitle="Capital added"
      successText="The transaction is confirmed on-chain. Copy Trading data will refresh in the background."
    >
      <Stack className="gap-4">
        <p className="text-sm text-subText">
          Deposit more capital{agentName ? ` for ${agentName}` : ''}. The API fixes the quote token and returns the
          current minimum before your wallet is asked to confirm.
        </p>
        <Stack className="gap-2 rounded-xl bg-white-04 px-4 py-3">
          <HStack className="items-center justify-between gap-3">
            <input
              aria-label="Additional capital amount"
              inputMode="decimal"
              placeholder="0.0"
              value={amount}
              onChange={event => setAmount(event.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
              className="w-full min-w-0 bg-transparent text-2xl font-medium text-text outline-none placeholder:text-subText"
            />
            <HStack className="shrink-0 items-center gap-2 rounded-xl bg-white-04 px-3 py-2 text-base text-text">
              <Briefcase size={15} className="text-subText" />
              {quoteToken?.symbol || 'Unsupported'}
            </HStack>
          </HStack>
        </Stack>
        {amountError && (
          <span role="alert" className="px-1 text-xs text-red">
            {amountError}
          </span>
        )}
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
            ? 'Add Capital unavailable'
            : 'Review Add Capital'}
        </ButtonPrimary>
      </Stack>
    </PreparedActionModal>
  )
}

export default AddCapitalModal

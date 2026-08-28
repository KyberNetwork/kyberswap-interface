import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import copyAccountApi from 'services/copyTrading/api/endpoints/copyAccounts'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import type { AdvisoryActionAvailability } from 'services/copyTrading/types/actionAvailability'
import type { CopyRunListItem } from 'services/copyTrading/types/copyRuns'
import type { PreparedCallKind } from 'services/copyTrading/types/preparedActions'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyV2 } from 'hooks/useTokens'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import useRefreshCopyTrading from 'pages/CopyTrading/hooks/useRefreshCopyTrading'
import { getCapitalInputQuoteToken } from 'pages/CopyTrading/modals/CapitalAmount/capital'
import PreparedActionModal, { PreparedActionSuccessActions } from 'pages/CopyTrading/modals/PreparedActionModal'
import {
  DEFAULT_PREPARED_ACTION_STATE,
  parsePreparedAmount,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { usePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import { WithdrawQuoteForm, WithdrawQuoteReview } from 'pages/CopyTrading/modals/WithdrawQuoteModal/components'
import {
  UINT256_MAX_RAW,
  getWithdrawAmountError,
  getWithdrawPresetAmountRaw,
  getWithdrawRequestAmountRaw,
  validateWithdrawPreview,
} from 'pages/CopyTrading/modals/WithdrawQuoteModal/withdrawQuote'
import {
  getCopyRunOwnershipMessage,
  getWriteAvailabilityMessage,
  getWritePrimaryActionLabel,
  isWritePrimaryActionDisabled,
} from 'pages/CopyTrading/modals/writeAction'
import { useWalletModalToggle } from 'state/application/hooks'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits, parseUnits } from 'utils/viem'

type WithdrawQuoteModalProps = {
  isOpen: boolean
  onDismiss: () => void
  copyRun: CopyRunListItem
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
  const [amount, setAmount] = useState('')
  const [withdrawAll, setWithdrawAll] = useState(false)

  const availability = withdrawQuoteAvailability || copyRun.withdrawQuoteAvailability
  const onExpectedChain = chainId === copyRun.chainId
  const ownershipMessage = getCopyRunOwnershipMessage(copyRun.ownerAddress, account)

  const inventoryQuery = copyAccountApi.endpoints.getCopyAccountWalletInventory.useQueryState(
    { chainId: copyRun.chainId, copyAccount: copyRun.copyAccount },
    { skip: !isOpen },
  )
  const pinnedStableBalance = inventoryQuery.currentData?.pinnedStableBalance
  const quoteToken = getCapitalInputQuoteToken(copyRun.chainId)
  const pinnedQuoteBalance =
    pinnedStableBalance?.status === 'PINNED_STABLE_BALANCE_STATUS_PRESENT' ? pinnedStableBalance.balance : undefined
  const quoteBalance =
    pinnedQuoteBalance?.tokenAddress.toLowerCase() === quoteToken?.address.toLowerCase()
      ? pinnedQuoteBalance
      : undefined
  const tokenServiceCurrency = useCurrencyV2(quoteToken?.address, copyRun.chainId as ChainId)
  const quoteCurrency = useMemo(() => {
    if (tokenServiceCurrency?.isToken) return tokenServiceCurrency
    if (!quoteToken) return undefined
    return new Token(copyRun.chainId, quoteToken.address, quoteToken.decimals, quoteToken.symbol, quoteToken.symbol)
  }, [copyRun.chainId, quoteToken, tokenServiceCurrency])

  const walletBalanceRaw = useMemo(() => {
    if (!quoteBalance?.amountDecimal || !quoteToken) return undefined
    try {
      return parseUnits(quoteBalance.amountDecimal, quoteToken.decimals).toString()
    } catch {
      return undefined
    }
  }, [quoteBalance?.amountDecimal, quoteToken])
  const amountRaw = useMemo(() => {
    if (!quoteToken) return undefined
    try {
      return parsePreparedAmount(amount, quoteToken.decimals)
    } catch {
      return undefined
    }
  }, [amount, quoteToken])
  const amountError = getWithdrawAmountError({
    amount,
    amountRaw,
    hasQuoteCurrency: !!quoteCurrency,
    walletBalanceRaw,
    withdrawAll,
  })
  const amountIsValid =
    !!amountRaw &&
    BigInt(amountRaw) < BigInt(UINT256_MAX_RAW) &&
    !amountError &&
    (!withdrawAll || (!!walletBalanceRaw && BigInt(walletBalanceRaw) > 0n))
  const requestAmountRaw = getWithdrawRequestAmountRaw(amountRaw, withdrawAll)
  const presetsEnabled = !!walletBalanceRaw && BigInt(walletBalanceRaw) > 0n && !!quoteToken
  const walletBalanceText =
    walletBalanceRaw && quoteToken
      ? formatDisplayNumber(formatUnits(BigInt(walletBalanceRaw), quoteToken.decimals), { significantDigits: 8 })
      : '0'

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
      if (ownershipMessage) throw new Error(ownershipMessage)
      if (!requestAmountRaw) throw new Error('Enter a valid withdrawal amount.')
      const response = await prepareWithdrawQuote({
        ownerAddress: account.toLowerCase(),
        copyRunId: copyRun.copyRunId,
        amountRaw: requestAmountRaw,
      }).unwrap()
      if (response.data.status === 'PREPARED_ACTION_STATUS_READY') {
        const validationError = validateWithdrawPreview({
          amountRaw: requestAmountRaw,
          expectedQuoteToken: quoteToken ? { address: quoteToken.address, decimals: quoteToken.decimals } : undefined,
          ownerAddress: account,
          preview: response.data.withdrawQuote,
        })
        if (validationError) throw new Error(validationError)
      }
      return response.data
    },
    onComplete: refreshCopyTrading,
  })

  const dismiss = () => {
    flow.reset()
    setAmount('')
    setWithdrawAll(false)
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

  const setPresetAmount = (percentage: 50 | 100) => {
    if (flowState.isPreparing || !presetsEnabled || !walletBalanceRaw || !quoteToken) return
    const presetAmountRaw = getWithdrawPresetAmountRaw(walletBalanceRaw, percentage)
    setAmount(formatUnits(BigInt(presetAmountRaw), quoteToken.decimals))
    setWithdrawAll(percentage === 100)
  }

  const handleAmountChange = (value: string) => {
    setAmount(value)
    setWithdrawAll(false)
  }

  const viewCopies = () => {
    dismiss()
    const terminal = copyRun.status === 'stopped' || copyRun.status === 'closed'
    navigate(APP_PATHS.COPY_TRADING + (terminal ? '/history' : '/my-copies'))
  }

  const accountConnected = !!account
  const isPreparing = flowState.isPreparing === true
  const availabilityMessage = getWriteAvailabilityMessage(availability, ownershipMessage)
  const primaryActionLabel = getWritePrimaryActionLabel({
    accountConnected,
    onExpectedChain,
    readyLabel: 'Review Withdrawal',
    unavailable: !!availabilityMessage,
    unavailableLabel: 'Withdraw Unavailable',
  })
  const primaryActionDisabled = isWritePrimaryActionDisabled({
    accountConnected,
    executionBlocked: !!availabilityMessage || !amountIsValid,
    interactionLocked: isPreparing,
    onExpectedChain,
  })
  const preview = flowState.action?.withdrawQuote
  const reviewPreparing = flowState.phase === 'review' && isPreparing
  const review = <WithdrawQuoteReview chainId={copyRun.chainId} isLoading={reviewPreparing} preview={preview} />
  const successActions = (
    <PreparedActionSuccessActions
      onClose={dismiss}
      onPrimaryAction={viewCopies}
      primaryLabel={copyRun.status === 'stopped' || copyRun.status === 'closed' ? 'View History' : 'My Copies'}
    />
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
      unavailableShowBackAction
      width={480}
    >
      <WithdrawQuoteForm
        amount={amount}
        amountError={amountError}
        availabilityMessage={availabilityMessage}
        isPreparing={isPreparing}
        onAmountChange={handleAmountChange}
        onCancel={dismiss}
        onHalf={() => setPresetAmount(50)}
        onMax={() => setPresetAmount(100)}
        onPrimaryAction={handlePrimaryAction}
        presetsEnabled={presetsEnabled}
        primaryActionDisabled={primaryActionDisabled}
        primaryActionLabel={primaryActionLabel}
        quoteCurrency={quoteCurrency}
        selectedChainId={copyRun.chainId}
        walletBalanceLoading={inventoryQuery.isFetching && !inventoryQuery.currentData}
        walletBalanceText={walletBalanceText}
      />
    </PreparedActionModal>
  )
}

export default WithdrawQuoteModal

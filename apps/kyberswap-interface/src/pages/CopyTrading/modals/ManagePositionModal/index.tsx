import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import copyAccountApi from 'services/copyTrading/api/endpoints/copyAccounts'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import type { PendingSellObligation } from 'services/copyTrading/types/copyRuns'
import type { PositionSummary } from 'services/copyTrading/types/positions'

import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import useRefreshCopyTrading from 'pages/CopyTrading/hooks/useRefreshCopyTrading'
import {
  ManagePositionForm,
  ManagePositionReview,
  ManagePositionTitle,
} from 'pages/CopyTrading/modals/ManagePositionModal/components'
import {
  isFullWadRatio,
  isValidWadRatio,
  loadPendingSellObligations,
} from 'pages/CopyTrading/modals/ManagePositionModal/positionData'
import {
  type ManagePositionFlow,
  POSITION_SELL_FLOW_CONFIG,
  POSITION_SELL_PREPARATION_CONFIG,
} from 'pages/CopyTrading/modals/ManagePositionModal/positionSellFlow'
import PreparedActionModal, { PreparedActionSuccessActions } from 'pages/CopyTrading/modals/PreparedActionModal'
import { DEFAULT_PREPARED_ACTION_SLIPPAGE } from 'pages/CopyTrading/modals/PreparedActionModal/SlippageControl'
import {
  DEFAULT_PREPARED_ACTION_STATE,
  getApiErrorMessage,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { usePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import { getWritePrimaryActionLabel, isWritePrimaryActionDisabled } from 'pages/CopyTrading/modals/writeAction'
import { useWalletModalToggle } from 'state/application/hooks'

type ManagePositionModalProps = {
  isOpen: boolean
  onDismiss: () => void
  position: PositionSummary
  flow: ManagePositionFlow
}

const MISSING_IDENTITY_MESSAGE = 'The selected position is missing write-flow identity fields.'
const NO_PENDING_OBLIGATION_MESSAGE = 'There is no current pending sell obligation for this position.'

const ManagePositionModal = ({ isOpen, onDismiss, position, flow: positionFlow }: ManagePositionModalProps) => {
  const navigate = useNavigate()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()
  const refreshCopyTrading = useRefreshCopyTrading()
  const [prepareManualSell] = preparedActionApi.usePrepareManualSellMutation()
  const [prepareClosePosition] = preparedActionApi.usePrepareClosePositionMutation()
  const [getObligations] = copyAccountApi.useLazyGetPendingSellObligationsQuery()

  const [flowState, setFlowState] = useState(DEFAULT_PREPARED_ACTION_STATE)
  const [obligations, setObligations] = useState<PendingSellObligation[]>()
  const [obligationsError, setObligationsError] = useState<string>()
  const [slippage, setSlippage] = useState(DEFAULT_PREPARED_ACTION_SLIPPAGE)
  const obligationsRequestId = useRef(0)

  const flowConfig = POSITION_SELL_FLOW_CONFIG[positionFlow]
  const preparationConfig = POSITION_SELL_PREPARATION_CONFIG[flowConfig.preparation]
  const expectsLeftover = flowConfig.positionContext === 'leftover'
  const requiresObligations = !expectsLeftover
  const usesClosePreparation = flowConfig.preparation === 'closePosition'
  const userPositionId = position.userPositionId
  const copyRunId = position.copyRunId
  const copyAccount = position.copyAccount
  const onExpectedChain = chainId === position.chainId

  const loadObligations = useCallback(async () => {
    const requestId = ++obligationsRequestId.current
    setObligations(undefined)
    setObligationsError(undefined)

    try {
      if (!copyAccount || !userPositionId) throw new Error('This position is missing its Smart Wallet identity.')

      const currentObligations = await loadPendingSellObligations(getObligations, {
        chainId: position.chainId,
        copyAccount,
        userPositionId,
      })
      if (obligationsRequestId.current === requestId) setObligations(currentObligations)
    } catch (error) {
      if (obligationsRequestId.current === requestId) setObligationsError(getApiErrorMessage(error))
    }
  }, [copyAccount, getObligations, position.chainId, userPositionId])

  useEffect(() => {
    if (isOpen && requiresObligations) void loadObligations()

    return () => {
      obligationsRequestId.current += 1
    }
  }, [isOpen, loadObligations, requiresObligations])

  const prepareClose = async (account: string, copyRunId: string, userPositionId: string, slippageBps: number) => {
    const response = await prepareClosePosition({
      ownerAddress: account,
      copyRunId,
      userPositionId,
      slippageBps,
    }).unwrap()
    const preview = response.data.closePosition

    if (response.data.status === 'PREPARED_ACTION_STATUS_READY') {
      if (preview?.userPositionId !== userPositionId) {
        throw new Error('The prepared position does not match your selection.')
      }
      if (flowConfig.requireFullSell && !isFullWadRatio(preview.sellRatioRaw)) {
        throw new Error('The prepared full-position recovery portion is not 100%.')
      }
    }

    return response.data
  }

  const prepareManual = async (account: string, copyRunId: string, userPositionId: string, slippageBps: number) => {
    if (!copyAccount || !obligations) throw new Error('Skipped sell actions are unavailable.')
    const currentObligation = obligations[0]
    const response = await prepareManualSell({
      ownerAddress: account,
      copyRunId,
      userPositionId,
      slippageBps,
      expectedUnresolvedSkipCount: obligations.length,
      expectedSellRatioRaw: currentObligation.currentRatioRaw,
    }).unwrap()
    const preview = response.data.manualSell

    if (response.data.status === 'PREPARED_ACTION_STATUS_READY') {
      if (preview?.userPositionId !== userPositionId) {
        throw new Error('The prepared position does not match your selection.')
      }
      if (preview.sellRatioRaw !== currentObligation.currentRatioRaw) {
        throw new Error('The prepared sell ratio does not match the current FIFO obligation.')
      }
      if (preview.unresolvedSkipCount !== obligations.length) {
        throw new Error('The prepared obligation count does not match the current FIFO.')
      }
    }

    return response.data
  }

  const preparePositionSell = async () => {
    if (!account || !copyRunId || !userPositionId) throw new Error(MISSING_IDENTITY_MESSAGE)
    if (requiresObligations && (!copyAccount || !obligations)) {
      throw new Error('Wait for skipped sell actions to finish loading.')
    }
    if (requiresObligations && !isValidWadRatio(obligations?.[0]?.currentRatioRaw)) {
      throw new Error(NO_PENDING_OBLIGATION_MESSAGE)
    }

    const args = [account, copyRunId, userPositionId, Math.round(slippage * 100)] as const
    return usesClosePreparation ? prepareClose(...args) : prepareManual(...args)
  }

  const flow = usePreparedAction({
    state: flowState,
    setState: setFlowState,
    expected: {
      account: account || '',
      callKinds: preparationConfig.callKinds,
      chainId: position.chainId,
      copyAccount,
      positionSellContext: flowConfig.sellContext,
      preview: preparationConfig.preview,
    },
    prepare: preparePositionSell,
    onComplete: refreshCopyTrading,
  })

  const dismiss = () => {
    flow.reset()
    setSlippage(DEFAULT_PREPARED_ACTION_SLIPPAGE)
    onDismiss()
  }

  const handlePrimaryAction = () => {
    if (!account) {
      toggleWalletModal()
      return
    }
    if (!onExpectedChain) {
      void changeNetwork(position.chainId as ChainId)
      return
    }

    void flow.prepare()
  }

  const viewDestination = () => {
    dismiss()
    navigate(flowConfig.destination)
  }

  const accountConnected = !!account
  const isPreparing = flowState.isPreparing === true
  const identityMissing = !copyRunId || !userPositionId || (requiresObligations && !copyAccount)
  const obligationsLoading = requiresObligations && obligations === undefined && !obligationsError
  const obligationsUnavailable =
    requiresObligations && obligations !== undefined && !isValidWadRatio(obligations[0]?.currentRatioRaw)
  const unavailableMessage =
    (identityMissing ? MISSING_IDENTITY_MESSAGE : undefined) ||
    obligationsError ||
    (obligationsUnavailable ? NO_PENDING_OBLIGATION_MESSAGE : undefined)
  const primaryActionLabel = getWritePrimaryActionLabel({
    accountConnected,
    loading: obligationsLoading,
    loadingLabel: 'Loading Sell Actions',
    onExpectedChain,
    readyLabel: 'Review ' + flowConfig.actionLabel,
    unavailable: Boolean(unavailableMessage),
    unavailableLabel: flowConfig.actionLabel + ' Unavailable',
  })
  const preview = flowState.action?.[preparationConfig.preview]
  const reviewPreparing = flowState.phase === 'review' && isPreparing
  const primaryActionLoading = isPreparing || (accountConnected && onExpectedChain && obligationsLoading)
  const primaryActionDisabled = isWritePrimaryActionDisabled({
    accountConnected,
    executionBlocked: obligationsLoading || !!unavailableMessage,
    interactionLocked: isPreparing,
    onExpectedChain,
  })
  const modalTitle = (
    <ManagePositionTitle
      actionLabel={flowConfig.actionLabel}
      isReview={flowState.phase === 'review'}
      showSkippedActions={flowState.phase === 'idle' && !expectsLeftover}
    />
  )

  const review = <ManagePositionReview isLoading={reviewPreparing} position={position} preview={preview} />

  const successActions = (
    <PreparedActionSuccessActions
      onClose={dismiss}
      onPrimaryAction={viewDestination}
      primaryLabel={flowConfig.destinationLabel}
    />
  )

  return (
    <PreparedActionModal
      isOpen={isOpen}
      onDismiss={dismiss}
      state={flowState}
      title={modalTitle}
      review={review}
      confirmLabel={reviewPreparing ? 'Preparing' : 'Confirm'}
      onBack={flow.reset}
      onConfirm={() => void flow.confirm()}
      onRetry={() => void flow.retry()}
      successTitle={flowConfig.successTitle}
      successActions={successActions}
      width={480}
    >
      <ManagePositionForm
        isPreparing={isPreparing}
        onCancel={dismiss}
        onPrimaryAction={handlePrimaryAction}
        onSlippageChange={setSlippage}
        position={position}
        primaryActionDisabled={primaryActionDisabled}
        primaryActionLabel={primaryActionLabel}
        primaryActionLoading={primaryActionLoading}
        pendingSellObligations={requiresObligations ? obligations : undefined}
        pendingSellObligationsError={requiresObligations ? obligationsError : undefined}
        pendingSellObligationsLoading={obligationsLoading}
        slippage={slippage}
        positionContext={flowConfig.positionContext}
        unavailableMessage={unavailableMessage}
      />
    </PreparedActionModal>
  )
}

export default ManagePositionModal

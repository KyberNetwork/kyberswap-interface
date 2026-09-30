import { ChainId } from '@kyberswap/ks-sdk-core'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import copyAccountApi from 'services/copyTrading/api/endpoints/copyAccounts'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import type { PendingSellObligation } from 'services/copyTrading/types/copyRuns'
import type { PositionSummary } from 'services/copyTrading/types/positions'

import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { getPreparedReasonMessage } from 'pages/CopyTrading/helpers'
import { useCopyTradingRoutes } from 'pages/CopyTrading/hooks/useCopyTradingRoutes'
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
  retryPositionSell,
} from 'pages/CopyTrading/modals/ManagePositionModal/positionSellFlow'
import PreparedActionModal, { PreparedActionSuccessActions } from 'pages/CopyTrading/modals/PreparedActionModal'
import { DEFAULT_PREPARED_ACTION_SLIPPAGE } from 'pages/CopyTrading/modals/PreparedActionModal/SlippageControl'
import { getApiErrorMessage, validatePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { usePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import { getWritePrimaryActionLabel, isWritePrimaryActionDisabled } from 'pages/CopyTrading/modals/writeAction'
import { useWalletModalToggle } from 'state/application/hooks'

type ManagePositionModalProps = {
  generationId?: string
  isOpen: boolean
  onDismiss: () => void
  position: PositionSummary
  flow: ManagePositionFlow
}

const MISSING_IDENTITY_MESSAGE = 'The selected position is missing write-flow identity fields.'
const NO_PENDING_OBLIGATION_MESSAGE = 'There is no current pending sell obligation for this position.'

const ManagePositionModal = ({
  generationId,
  isOpen,
  onDismiss,
  position,
  flow: positionFlow,
}: ManagePositionModalProps) => {
  const navigate = useNavigate()
  const copyTradingPath = useCopyTradingRoutes()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const modalInstanceId = useId()
  const toggleWalletModal = useWalletModalToggle()

  const [prepareManualSell] = preparedActionApi.usePrepareManualSellMutation()
  const [prepareClosePosition] = preparedActionApi.usePrepareClosePositionMutation()
  const [getObligations] = copyAccountApi.useLazyGetPendingSellObligationsQuery()

  const [obligations, setObligations] = useState<PendingSellObligation[]>()
  const [obligationsError, setObligationsError] = useState<string>()
  const [slippage, setSlippage] = useState(DEFAULT_PREPARED_ACTION_SLIPPAGE)
  const debouncedSlippage = useDebounce(slippage, 300)
  const slippageDebouncing = slippage !== debouncedSlippage
  const obligationsRequestId = useRef(0)

  const flowConfig = POSITION_SELL_FLOW_CONFIG[positionFlow]
  const preparationConfig = POSITION_SELL_PREPARATION_CONFIG[flowConfig.preparation]
  const usesStopCopyContext = flowConfig.sellContext === 'POSITION_SELL_CONTEXT_STOP_COPY'
  const requiresObligations = !usesStopCopyContext
  const usesClosePreparation = flowConfig.preparation === 'closePosition'

  const userPositionId = position.userPositionId
  const positionId = position.positionId
  const copyRunId = position.copyRunId
  const copyAccount = position.copyAccount

  const accountConnected = !!account
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

  const identityMissing = !copyRunId || !positionId || !userPositionId || (requiresObligations && !copyAccount)
  const obligationsLoading = requiresObligations && obligations === undefined && !obligationsError
  const obligationsUnavailable =
    requiresObligations && obligations !== undefined && !isValidWadRatio(obligations[0]?.currentRatioRaw)
  const unavailableMessage =
    (identityMissing ? MISSING_IDENTITY_MESSAGE : undefined) ||
    obligationsError ||
    (obligationsUnavailable ? NO_PENDING_OBLIGATION_MESSAGE : undefined)

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

  const preparePositionSell = async (sellSlippage = slippage) => {
    if (!account || !copyRunId || !userPositionId) throw new Error(MISSING_IDENTITY_MESSAGE)
    if (requiresObligations && (!copyAccount || !obligations)) {
      throw new Error('Wait for skipped sell actions to finish loading.')
    }
    if (requiresObligations && !isValidWadRatio(obligations?.[0]?.currentRatioRaw)) {
      throw new Error(NO_PENDING_OBLIGATION_MESSAGE)
    }

    const args = [account, copyRunId, userPositionId, Math.round(sellSlippage * 100)] as const
    return usesClosePreparation ? prepareClose(...args) : prepareManual(...args)
  }

  const getExpected = () => ({
    account: account?.toLowerCase() || '',
    callKinds: preparationConfig.callKinds,
    chainId: position.chainId,
    copyAccount,
    generationId,
    positionSellContext: flowConfig.sellContext,
    preview: preparationConfig.preview,
  })

  const flow = usePreparedAction({
    getExpected,
    prepare: preparePositionSell,
  })
  const { state: flowState } = flow
  const isPreparing = flowState.isPreparing === true

  const previewEnabled = isOpen && flowState.phase === 'idle' && !!account && !obligationsLoading && !unavailableMessage

  // Display-only preparation; Review still prepares a fresh executable quote.
  const previewQuery = useQuery({
    queryKey: ['position-sell-preview', modalInstanceId, userPositionId, positionFlow, debouncedSlippage],
    enabled: previewEnabled && !slippageDebouncing,
    queryFn: async () => {
      const action = await preparePositionSell(debouncedSlippage)
      if (action.status !== 'PREPARED_ACTION_STATUS_READY') {
        throw new Error(
          action.failureDetails?.message || action.guidance?.message || getPreparedReasonMessage(action.reason),
        )
      }

      const error = validatePreparedAction(action, getExpected())
      if (error) throw new Error(error)

      return action[preparationConfig.preview]
    },
    // Refetch when returning to the form or finishing an obligations reload.
    staleTime: 0,
    gcTime: 0,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
  })
  const previewLoading = obligationsLoading || (previewEnabled && (slippageDebouncing || previewQuery.isFetching))

  const primaryActionLabel = getWritePrimaryActionLabel({
    accountConnected,
    loading: obligationsLoading,
    loadingLabel: 'Loading Sell Actions',
    onExpectedChain,
    readyLabel: 'Review ' + flowConfig.actionLabel,
    unavailable: Boolean(unavailableMessage),
    unavailableLabel: flowConfig.actionLabel + ' Unavailable',
  })
  const primaryActionLoading = isPreparing || (accountConnected && onExpectedChain && previewLoading)
  const primaryActionDisabled = isWritePrimaryActionDisabled({
    accountConnected,
    executionBlocked: previewLoading || !!unavailableMessage,
    interactionLocked: isPreparing,
    onExpectedChain,
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
    navigate(copyTradingPath(flowConfig.destination, position.chainId))
  }

  const preview = flowState.action?.[preparationConfig.preview]
  const reviewPreparing = flowState.phase === 'review' && isPreparing

  const modalTitle = (
    <ManagePositionTitle
      actionLabel={flowConfig.actionLabel}
      isReview={flowState.phase === 'review'}
      showSkippedActions={flowState.phase === 'idle' && requiresObligations}
    />
  )

  const review = (
    <ManagePositionReview
      isLoading={reviewPreparing}
      onRefresh={() => void flow.prepare()}
      position={position}
      preview={preview}
    />
  )

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
      onRetry={() =>
        void retryPositionSell({
          state: flowState,
          reset: flow.reset,
          reloadObligations: loadObligations,
          retry: flow.retry,
        })
      }
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
        preview={previewEnabled && !previewQuery.error ? previewQuery.data : undefined}
        previewError={
          previewEnabled && !previewLoading && previewQuery.error ? getApiErrorMessage(previewQuery.error) : undefined
        }
        previewLoading={previewLoading}
        primaryActionDisabled={primaryActionDisabled}
        primaryActionLabel={primaryActionLabel}
        primaryActionLoading={primaryActionLoading}
        showClosePositionSummary={usesStopCopyContext}
        pendingSellObligations={requiresObligations ? obligations : undefined}
        pendingSellObligationsError={requiresObligations ? obligationsError : undefined}
        pendingSellObligationsLoading={obligationsLoading}
        slippage={slippage}
        unavailableMessage={unavailableMessage}
      />
    </PreparedActionModal>
  )
}

export default ManagePositionModal

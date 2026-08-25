import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import copyAccountApi from 'services/copyTrading/api/endpoints/copyAccounts'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import type { PositionActionKind, PositionSummary } from 'services/copyTrading/types/positions'
import type { PreparedCallKind } from 'services/copyTrading/types/preparedActions'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import useRefreshCopyTrading from 'pages/CopyTrading/hooks/useRefreshCopyTrading'
import { ManagePositionForm, ManagePositionReview } from 'pages/CopyTrading/modals/ManagePositionModal/components'
import {
  getPositionRecoveryAction,
  hasPositionAction,
  isFullWadRatio,
  isValidWadRatio,
  loadCurrentCopyAccountPosition,
  loadPendingSellObligations,
} from 'pages/CopyTrading/modals/ManagePositionModal/positionData'
import PreparedActionModal, { PreparedActionSuccessActions } from 'pages/CopyTrading/modals/PreparedActionModal'
import { DEFAULT_PREPARED_ACTION_SLIPPAGE } from 'pages/CopyTrading/modals/PreparedActionModal/SlippageControl'
import { DEFAULT_PREPARED_ACTION_STATE } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { usePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import { isWritePrimaryActionDisabled } from 'pages/CopyTrading/modals/writeAction'
import { useWalletModalToggle } from 'state/application/hooks'

export type ManagePositionFlow = 'manualSell' | 'closePosition'

type ManagePositionModalProps = {
  isOpen: boolean
  onDismiss: () => void
  position: PositionSummary
  flow: ManagePositionFlow
}

const MANUAL_SELL_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_MANUAL_SELL']
const CLOSE_POSITION_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_CLOSE_POSITION']

const POSITION_SELL_FLOW_CONFIG = {
  manualSell: {
    actionLabel: 'Manual Sell',
    description:
      "The Agent's sell action could not be copied for this position. Complete the sell manually to realign it.",
    destination: APP_PATHS.COPY_TRADING + '/my-copies',
    destinationLabel: 'My Copies',
    positionStatus: 'open',
    sellContext: 'POSITION_SELL_CONTEXT_ALIGN_SKIP',
    successTitle: 'Manual sell completed',
  },
  closePosition: {
    actionLabel: 'Close Position',
    description:
      'Copying has stopped, but this position remains open in your Smart Wallet. Close it manually to receive the quote token.',
    destination: APP_PATHS.COPY_TRADING + '/history',
    destinationLabel: 'View History',
    positionStatus: 'leftover',
    sellContext: 'POSITION_SELL_CONTEXT_STOP_COPY',
    successTitle: 'Position closed',
  },
} as const

const ManagePositionModal = ({ isOpen, onDismiss, position, flow: positionFlow }: ManagePositionModalProps) => {
  const navigate = useNavigate()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()
  const refreshCopyTrading = useRefreshCopyTrading()
  const [prepareManualSell] = preparedActionApi.usePrepareManualSellMutation()
  const [prepareClosePosition] = preparedActionApi.usePrepareClosePositionMutation()
  const [getCopyAccountPositions] = copyAccountApi.useLazyGetCopyAccountPositionsQuery()
  const [getObligations] = copyAccountApi.useLazyGetPendingSellObligationsQuery()

  const [flowState, setFlowState] = useState(DEFAULT_PREPARED_ACTION_STATE)
  const [slippage, setSlippage] = useState(DEFAULT_PREPARED_ACTION_SLIPPAGE)

  const flowConfig = POSITION_SELL_FLOW_CONFIG[positionFlow]
  const isStoppedClose = positionFlow === 'closePosition'
  const preparationAction: PositionActionKind | undefined = isStoppedClose
    ? 'POSITION_ACTION_KIND_CLOSE_POSITION'
    : getPositionRecoveryAction(position, 'active')
  const usesClosePreparation = preparationAction === 'POSITION_ACTION_KIND_CLOSE_POSITION'
  const userPositionId = position.userPositionId
  const copyRunId = position.copyRunId
  const copyAccount = position.copyAccount
  const onExpectedChain = chainId === position.chainId
  const actionAdvertised = !!preparationAction && hasPositionAction(position, preparationAction)

  const fetchObligations = useCallback(async () => {
    if (!copyAccount || !userPositionId) throw new Error('This position is missing its Smart Wallet identity.')

    return loadPendingSellObligations(getObligations, {
      chainId: position.chainId,
      copyAccount,
      userPositionId,
    })
  }, [copyAccount, getObligations, position.chainId, userPositionId])

  const fetchCurrentPosition = useCallback(async () => {
    if (!copyAccount || !userPositionId) throw new Error('This position is missing its Smart Wallet identity.')

    return loadCurrentCopyAccountPosition(getCopyAccountPositions, {
      chainId: position.chainId,
      copyAccount,
      status: flowConfig.positionStatus,
      userPositionId,
    })
  }, [copyAccount, flowConfig.positionStatus, getCopyAccountPositions, position.chainId, userPositionId])

  const flow = usePreparedAction({
    state: flowState,
    setState: setFlowState,
    expected: {
      account: account || '',
      callKinds: usesClosePreparation ? CLOSE_POSITION_CALL_KINDS : MANUAL_SELL_CALL_KINDS,
      chainId: position.chainId,
      copyAccount,
      positionSellContext: flowConfig.sellContext,
      preview: usesClosePreparation ? 'closePosition' : 'manualSell',
    },
    prepare: async () => {
      if (!account || !copyRunId || !copyAccount || !userPositionId) {
        throw new Error('The selected position is missing write-flow identity fields.')
      }

      const [currentPosition, currentObligations] = await Promise.all([
        fetchCurrentPosition(),
        usesClosePreparation ? Promise.resolve([]) : fetchObligations(),
      ])
      if (currentPosition.copyRunId !== copyRunId || currentPosition.copyAccount !== copyAccount) {
        throw new Error('The refreshed position does not match the selected Copy Run.')
      }
      if (isStoppedClose ? !currentPosition.isLeftover : currentPosition.isLeftover) {
        throw new Error(
          isStoppedClose
            ? 'The refreshed position is no longer a stopped Copy leftover.'
            : 'This position is no longer part of an active Copy recovery flow.',
        )
      }
      if (!preparationAction || !hasPositionAction(currentPosition, preparationAction)) {
        throw new Error('The refreshed position no longer supports ' + flowConfig.actionLabel + '.')
      }

      const slippageBps = Math.round(slippage * 100)
      if (usesClosePreparation) {
        const response = await prepareClosePosition({
          ownerAddress: account,
          copyRunId,
          userPositionId,
          slippageBps,
        }).unwrap()
        if (
          response.data.status === 'PREPARED_ACTION_STATUS_READY' &&
          response.data.closePosition?.userPositionId !== userPositionId
        ) {
          throw new Error('The prepared position does not match your selection.')
        }
        if (
          !isStoppedClose &&
          response.data.status === 'PREPARED_ACTION_STATUS_READY' &&
          !isFullWadRatio(response.data.closePosition?.sellRatioRaw)
        ) {
          throw new Error('The prepared full-position Manual Sell portion is not 100%.')
        }

        return response.data
      }

      const currentObligation = currentObligations[0]
      if (!isValidWadRatio(currentObligation?.currentRatioRaw) || !currentObligations.length) {
        throw new Error('There is no current pending sell obligation for this position.')
      }

      const response = await prepareManualSell({
        ownerAddress: account,
        copyRunId,
        userPositionId,
        slippageBps,
        expectedUnresolvedSkipCount: currentObligations.length,
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
        if (preview.unresolvedSkipCount !== currentObligations.length) {
          throw new Error('The prepared obligation count does not match the current FIFO.')
        }
      }

      return response.data
    },
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

  const identityMessage =
    !copyRunId || !copyAccount || !userPositionId
      ? 'The selected position is missing write-flow identity fields.'
      : undefined
  const unavailableMessage = identityMessage
    ? identityMessage
    : !actionAdvertised
    ? 'The selected position does not advertise ' + flowConfig.actionLabel + '.'
    : undefined
  const primaryActionLabel = !account
    ? 'Connect wallet'
    : !onExpectedChain
    ? 'Switch network'
    : unavailableMessage
    ? flowConfig.actionLabel + ' unavailable'
    : 'Review ' + flowConfig.actionLabel
  const preview = usesClosePreparation ? flowState.action?.closePosition : flowState.action?.manualSell
  const reviewPreparing = flowState.phase === 'review' && flowState.isPreparing === true

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
      title={flowConfig.actionLabel}
      review={review}
      confirmLabel={reviewPreparing ? 'Preparing' : flowConfig.actionLabel}
      onBack={flow.reset}
      onConfirm={() => void flow.confirm()}
      onRetry={() => void flow.retry()}
      successTitle={flowConfig.successTitle}
      successActions={successActions}
      width={520}
    >
      <ManagePositionForm
        description={flowConfig.description}
        isPreparing={flowState.isPreparing === true}
        onPrimaryAction={handlePrimaryAction}
        onSlippageChange={setSlippage}
        position={position}
        primaryActionDisabled={isWritePrimaryActionDisabled({
          accountConnected: !!account,
          executionBlocked: !!unavailableMessage,
          interactionLocked: flowState.isPreparing === true,
          onExpectedChain,
        })}
        primaryActionLabel={primaryActionLabel}
        slippage={slippage}
        unavailableMessage={unavailableMessage}
      />
    </PreparedActionModal>
  )
}

export default ManagePositionModal

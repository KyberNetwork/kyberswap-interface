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
  hasPositionAction,
  isValidWadRatio,
  loadCurrentCopyAccountPosition,
  loadPendingSellObligations,
} from 'pages/CopyTrading/modals/ManagePositionModal/positionData'
import PreparedActionModal, { PreparedActionSuccessActions } from 'pages/CopyTrading/modals/PreparedActionModal'
import { DEFAULT_PREPARED_ACTION_SLIPPAGE } from 'pages/CopyTrading/modals/PreparedActionModal/SlippageControl'
import { DEFAULT_PREPARED_ACTION_STATE } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { usePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import { useWalletModalToggle } from 'state/application/hooks'

export type ManagePositionMode = 'sell' | 'close'

type ManagePositionModalProps = {
  isOpen: boolean
  onDismiss: () => void
  position: PositionSummary
  mode: ManagePositionMode
}

const MANUAL_SELL_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_MANUAL_SELL']
const CLOSE_POSITION_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_CLOSE_POSITION']

const ManagePositionModal = ({ isOpen, onDismiss, position, mode }: ManagePositionModalProps) => {
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

  const isClose = mode === 'close'
  const actionLabel = isClose ? 'Close Position' : 'Manual Sell'
  const requiredAction: PositionActionKind = isClose
    ? 'POSITION_ACTION_KIND_CLOSE_POSITION'
    : 'POSITION_ACTION_KIND_MANUAL_SELL'
  const userPositionId = position.userPositionId
  const copyRunId = position.copyRunId
  const copyAccount = position.copyAccount
  const onExpectedChain = chainId === position.chainId
  const actionAdvertised = hasPositionAction(position, requiredAction)

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
      userPositionId,
    })
  }, [copyAccount, getCopyAccountPositions, position.chainId, userPositionId])

  const flow = usePreparedAction({
    state: flowState,
    setState: setFlowState,
    expected: {
      account: account || '',
      callKinds: isClose ? CLOSE_POSITION_CALL_KINDS : MANUAL_SELL_CALL_KINDS,
      chainId: position.chainId,
      copyAccount,
      preview: isClose ? 'closePosition' : 'manualSell',
    },
    prepare: async () => {
      if (!account || !copyRunId || !copyAccount || !userPositionId) {
        throw new Error('The selected position is missing write-flow identity fields.')
      }

      const [currentPosition, currentObligations] = await Promise.all([
        fetchCurrentPosition(),
        isClose ? Promise.resolve([]) : fetchObligations(),
      ])
      if (currentPosition.copyRunId !== copyRunId || currentPosition.copyAccount !== copyAccount) {
        throw new Error('The refreshed position does not match the selected Copy Run.')
      }
      if (!hasPositionAction(currentPosition, requiredAction)) {
        throw new Error('The refreshed position no longer supports ' + actionLabel + '.')
      }

      const slippageBps = Math.round(slippage * 100)
      if (isClose) {
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

  const viewMyCopies = () => {
    dismiss()
    navigate(APP_PATHS.COPY_TRADING + '/my-copies')
  }

  const unavailableMessage = !actionAdvertised
    ? 'The selected position does not advertise ' + actionLabel + '.'
    : undefined
  const primaryActionLabel = !account
    ? 'Connect wallet'
    : !onExpectedChain
    ? 'Switch network'
    : unavailableMessage
    ? actionLabel + ' unavailable'
    : 'Review ' + actionLabel
  const preview = isClose ? flowState.action?.closePosition : flowState.action?.manualSell
  const reviewPreparing = flowState.phase === 'review' && flowState.isPreparing === true

  const review = (
    <ManagePositionReview isClose={isClose} isLoading={reviewPreparing} position={position} preview={preview} />
  )

  const successActions = (
    <PreparedActionSuccessActions onClose={dismiss} onPrimaryAction={viewMyCopies} primaryLabel="My Copies" />
  )

  return (
    <PreparedActionModal
      isOpen={isOpen}
      onDismiss={dismiss}
      state={flowState}
      title={actionLabel}
      review={review}
      confirmLabel={reviewPreparing ? 'Preparing' : actionLabel}
      confirmVariant={isClose ? 'error' : 'warning'}
      onBack={flow.reset}
      onConfirm={() => void flow.confirm()}
      onRetry={() => void flow.retry()}
      successTitle={isClose ? 'Position closed' : 'Manual sell completed'}
      successActions={successActions}
      width={520}
    >
      <ManagePositionForm
        actionColor={isClose ? 'var(--ks-red)' : 'var(--ks-warning)'}
        isPreparing={flowState.isPreparing === true}
        onPrimaryAction={handlePrimaryAction}
        onSlippageChange={setSlippage}
        position={position}
        primaryActionDisabled={flowState.isPreparing || (!!account && onExpectedChain && !!unavailableMessage)}
        primaryActionLabel={primaryActionLabel}
        slippage={slippage}
        unavailableMessage={unavailableMessage}
      />
    </PreparedActionModal>
  )
}

export default ManagePositionModal

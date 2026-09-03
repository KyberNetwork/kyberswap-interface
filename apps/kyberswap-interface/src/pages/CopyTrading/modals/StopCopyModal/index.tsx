import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import type { CopyRunListItem } from 'services/copyTrading/types/copyRuns'
import type { PositionSummary } from 'services/copyTrading/types/positions'
import type { PreparedCallKind } from 'services/copyTrading/types/preparedActions'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { sumUsdValues } from 'pages/CopyTrading/helpers'
import useRefreshCopyTrading from 'pages/CopyTrading/hooks/useRefreshCopyTrading'
import PreparedActionModal, { PreparedActionSuccessActions } from 'pages/CopyTrading/modals/PreparedActionModal'
import { DEFAULT_PREPARED_ACTION_SLIPPAGE } from 'pages/CopyTrading/modals/PreparedActionModal/SlippageControl'
import {
  hasCopyTradingChainCoveredBlock,
  pollCopyTradingProjection,
} from 'pages/CopyTrading/modals/PreparedActionModal/postReceipt'
import {
  DEFAULT_PREPARED_ACTION_STATE,
  getApiErrorMessage,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { usePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import { StopCopyForm, StopCopyReview } from 'pages/CopyTrading/modals/StopCopyModal/components'
import {
  MAX_STOP_POSITIONS,
  type SelectableStopCopyPosition,
  getSelectedStopCopyPositionIds,
  hasUserPositionId,
  loadAllOpenCopyRunPositions,
} from 'pages/CopyTrading/modals/StopCopyModal/positions'
import {
  getCopyRunOwnershipMessage,
  getWriteAvailabilityMessage,
  getWritePrimaryActionLabel,
  isWritePrimaryActionDisabled,
} from 'pages/CopyTrading/modals/writeAction'
import { useWalletModalToggle } from 'state/application/hooks'

type StopCopyModalProps = {
  isOpen: boolean
  onDismiss: () => void
  copyRun: CopyRunListItem
}

const STOP_COPY_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_STOP_COPY']

const StopCopyModal = ({ isOpen, onDismiss, copyRun }: StopCopyModalProps) => {
  const navigate = useNavigate()
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()
  const refreshCopyTrading = useRefreshCopyTrading()
  const [prepareStopCopy] = preparedActionApi.usePrepareStopCopyMutation()
  const [getCopyRunPositions] = copyRunApi.useLazyGetCopyRunPositionsQuery()
  const [getCopyRun] = copyRunApi.useLazyGetCopyRunQuery()

  const [flowState, setFlowState] = useState(DEFAULT_PREPARED_ACTION_STATE)
  const [positions, setPositions] = useState<PositionSummary[] | undefined>(
    Number(copyRun.openPositionCount) === 0 ? [] : undefined,
  )
  const [positionsError, setPositionsError] = useState<string>()
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [slippage, setSlippage] = useState(DEFAULT_PREPARED_ACTION_SLIPPAGE)
  const [completedCopyRun, setCompletedCopyRun] = useState<CopyRunListItem>()
  const positionsRequestId = useRef(0)

  const onExpectedChain = chainId === copyRun.chainId
  const ownershipMessage = getCopyRunOwnershipMessage(copyRun.ownerAddress, account)

  const loadPositions = useCallback(async () => {
    const requestId = ++positionsRequestId.current

    setPositionsError(undefined)
    setSelected({})

    try {
      const allPositions = await loadAllOpenCopyRunPositions(getCopyRunPositions, {
        ownerAddress: copyRun.ownerAddress,
        copyRunId: copyRun.copyRunId,
      })

      if (positionsRequestId.current === requestId) setPositions(allPositions)
    } catch (error) {
      if (positionsRequestId.current === requestId) setPositionsError(getApiErrorMessage(error))
    }
  }, [copyRun.copyRunId, copyRun.ownerAddress, getCopyRunPositions])

  useEffect(() => {
    if (isOpen) void loadPositions()

    return () => {
      positionsRequestId.current += 1
    }
  }, [isOpen, loadPositions])

  const selectablePositions = useMemo(() => (positions || []).filter(hasUserPositionId), [positions])
  const isSelected = (position: SelectableStopCopyPosition, index: number) =>
    selected[position.userPositionId] ?? index < MAX_STOP_POSITIONS

  const selectedPositions = selectablePositions.filter(isSelected)
  const selectedPositionValueUsd = sumUsdValues(...selectedPositions.map(position => position.valueUsd))

  const flow = usePreparedAction({
    state: flowState,
    setState: setFlowState,
    expected: {
      account: account || '',
      callKinds: STOP_COPY_CALL_KINDS,
      chainId: copyRun.chainId,
      copyAccount: copyRun.copyAccount,
      preview: 'stopCopy',
    },
    prepare: async () => {
      if (!account) throw new Error('Connect your wallet first.')
      if (positions === undefined) throw new Error('Wait for all open positions to finish loading.')
      if (ownershipMessage) throw new Error(ownershipMessage)

      const currentPositionIds = getSelectedStopCopyPositionIds(selectablePositions, isSelected)
      const response = await prepareStopCopy({
        ownerAddress: account.toLowerCase(),
        copyRunId: copyRun.copyRunId,
        userPositionIds: currentPositionIds,
        slippageBps: Math.round(slippage * 100),
      }).unwrap()
      const preparedPositionIds = (response.data.stopCopy?.positions || [])
        .map(position => position.userPositionId)
        .filter((positionId): positionId is string => !!positionId)

      if (preparedPositionIds.some(positionId => !currentPositionIds.includes(positionId))) {
        throw new Error('The prepared position set does not match your current selection.')
      }

      return response.data
    },
    afterReceipt: async (_action, _hash, receiptBlockNumber) => {
      const response = await pollCopyTradingProjection({
        errorMessage:
          'Your transaction is confirmed, but the latest Copy status is not available yet. Refresh status to try again.',
        fetch: () => getCopyRun({ ownerAddress: copyRun.ownerAddress, copyRunId: copyRun.copyRunId }).unwrap(),
        isConverged: result =>
          hasCopyTradingChainCoveredBlock(result.meta, copyRun.chainId, receiptBlockNumber) &&
          result.data.status !== 'active' &&
          result.data.status !== 'unknown',
      })
      setCompletedCopyRun(response.data)
      refreshCopyTrading()
    },
    onComplete: refreshCopyTrading,
  })

  const togglePosition = (position: SelectableStopCopyPosition, index: number) => {
    const positionId = position.userPositionId
    const checked = isSelected(position, index)
    if (!checked && selectedPositions.length >= MAX_STOP_POSITIONS) return

    setSelected(current => ({ ...current, [positionId]: !checked }))
  }

  const dismiss = () => {
    flow.reset()
    setSelected({})
    setSlippage(DEFAULT_PREPARED_ACTION_SLIPPAGE)
    setCompletedCopyRun(undefined)
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

  const viewCopies = () => {
    dismiss()
    const terminal = completedCopyRun?.status === 'stopped' || completedCopyRun?.status === 'closed'
    navigate(APP_PATHS.COPY_TRADING + (terminal ? '/history' : '/my-copies'))
  }

  const accountConnected = !!account
  const isPreparing = flowState.isPreparing === true
  const positionsLoading = positions === undefined && !positionsError
  const positionsUnavailable = positions === undefined && !!positionsError
  const availabilityMessage = getWriteAvailabilityMessage(copyRun.stopCopyAvailability, ownershipMessage)
  const primaryActionLabel = getWritePrimaryActionLabel({
    accountConnected,
    loading: positionsLoading,
    loadingLabel: 'Loading Positions',
    onExpectedChain,
    readyLabel: 'Review Stop Copy',
    unavailable: positionsUnavailable || !!availabilityMessage,
    unavailableLabel: positionsUnavailable ? 'Positions Unavailable' : 'Stop Copy Unavailable',
  })
  const primaryActionLoading = isPreparing || (accountConnected && onExpectedChain && positionsLoading)
  const primaryActionDisabled = isWritePrimaryActionDisabled({
    accountConnected,
    executionBlocked: positions === undefined || !!positionsError || !!availabilityMessage,
    interactionLocked: isPreparing,
    onExpectedChain,
  })
  const reviewPreparing = flowState.phase === 'review' && isPreparing
  const expectedPositionCount = Number(copyRun.openPositionCount)

  const review = <StopCopyReview isLoading={reviewPreparing} preview={flowState.action?.stopCopy} />

  const successActions = (
    <PreparedActionSuccessActions
      onClose={dismiss}
      onPrimaryAction={viewCopies}
      primaryLabel={
        completedCopyRun?.status === 'stopped' || completedCopyRun?.status === 'closed' ? 'View History' : 'My Copies'
      }
    />
  )

  return (
    <PreparedActionModal
      isOpen={isOpen}
      onDismiss={dismiss}
      state={flowState}
      title={`Stop Copying - ${copyRun.agentSnapshot?.displayName}`}
      review={review}
      confirmLabel={reviewPreparing ? 'Preparing' : 'Stop Copying'}
      onBack={flow.reset}
      onConfirm={() => void flow.confirm()}
      onRetry={() => void flow.retry()}
      successTitle="Copy stopped"
      successActions={successActions}
      width={480}
    >
      <StopCopyForm
        availabilityMessage={availabilityMessage}
        expectedPositionCount={expectedPositionCount}
        isPreparing={isPreparing}
        isSelected={isSelected}
        onCancel={dismiss}
        onPrimaryAction={handlePrimaryAction}
        onSlippageChange={setSlippage}
        onTogglePosition={togglePosition}
        positions={positions === undefined ? undefined : selectablePositions}
        positionsError={positionsError}
        primaryActionDisabled={primaryActionDisabled}
        primaryActionLabel={primaryActionLabel}
        primaryActionLoading={primaryActionLoading}
        selectedPositionCount={selectedPositions.length}
        selectedPositionValueUsd={selectedPositionValueUsd}
        slippage={slippage}
      />
    </PreparedActionModal>
  )
}

export default StopCopyModal

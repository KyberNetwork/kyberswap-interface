import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'
import type { PositionSummary } from 'services/copyTrading/types/positions'
import type { PreparedCallKind } from 'services/copyTrading/types/preparedActions'

import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { canAttemptPreparation, getPreparedReasonMessage, sumUsdValues } from 'pages/CopyTrading/helpers'
import useRefreshCopyTrading from 'pages/CopyTrading/hooks/useRefreshCopyTrading'
import PreparedActionModal, { PreparedActionSuccessActions } from 'pages/CopyTrading/modals/PreparedActionModal'
import { DEFAULT_PREPARED_ACTION_SLIPPAGE } from 'pages/CopyTrading/modals/PreparedActionModal/SlippageControl'
import {
  DEFAULT_PREPARED_ACTION_STATE,
  getApiErrorMessage,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { usePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'
import { StopCopyForm, StopCopyReview } from 'pages/CopyTrading/modals/StopCopyModal/components'
import {
  MAX_STOP_POSITIONS,
  getSelectedStopCopyPositionIds,
  getUserPositionId,
  loadAllOpenCopyRunPositions,
} from 'pages/CopyTrading/modals/StopCopyModal/positions'
import { isWritePrimaryActionDisabled } from 'pages/CopyTrading/modals/writeAction'
import { useWalletModalToggle } from 'state/application/hooks'

type StopCopyModalProps = {
  isOpen: boolean
  onDismiss: () => void
  copyRun: CopyRunSummary
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

  const [flowState, setFlowState] = useState(DEFAULT_PREPARED_ACTION_STATE)
  const [positions, setPositions] = useState<PositionSummary[] | undefined>(
    Number(copyRun.openPositionCount) === 0 ? [] : undefined,
  )
  const [positionsError, setPositionsError] = useState<string>()
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [slippage, setSlippage] = useState(DEFAULT_PREPARED_ACTION_SLIPPAGE)
  const positionsRequestId = useRef(0)

  const onExpectedChain = chainId === copyRun.chainId
  const ownershipMessage =
    account && copyRun.ownerAddress.toLowerCase() !== account.toLowerCase()
      ? 'The selected Copy Run is not owned by the connected wallet.'
      : undefined

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

  const selectablePositions = useMemo(
    () => (positions || []).filter(position => getUserPositionId(position)),
    [positions],
  )
  const isSelected = (position: PositionSummary, index: number) => {
    const positionId = getUserPositionId(position)
    return positionId ? selected[positionId] ?? index < MAX_STOP_POSITIONS : false
  }

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
      if (copyRun.ownerAddress.toLowerCase() !== account.toLowerCase()) {
        throw new Error('The selected Copy Run is not owned by the connected wallet.')
      }

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
    onComplete: refreshCopyTrading,
  })

  const togglePosition = (position: PositionSummary, index: number) => {
    const positionId = getUserPositionId(position)
    if (!positionId) return

    const checked = isSelected(position, index)
    if (!checked && selectedPositions.length >= MAX_STOP_POSITIONS) return

    setSelected(current => ({ ...current, [positionId]: !checked }))
  }

  const dismiss = () => {
    flow.reset()
    setSelected({})
    setSlippage(DEFAULT_PREPARED_ACTION_SLIPPAGE)
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

  const availabilityMessage = ownershipMessage
    ? ownershipMessage
    : !canAttemptPreparation(copyRun.stopCopyAvailability)
    ? getPreparedReasonMessage(copyRun.stopCopyAvailability?.reason)
    : undefined
  const primaryActionLabel = !account
    ? 'Connect wallet'
    : !onExpectedChain
    ? 'Switch network'
    : positions === undefined
    ? positionsError
      ? 'Positions unavailable'
      : 'Loading positions'
    : availabilityMessage
    ? 'Stop Copy unavailable'
    : 'Review Stop Copy'

  const primaryActionLoading =
    flowState.isPreparing || (!!account && onExpectedChain && positions === undefined && !positionsError)
  const reviewPreparing = flowState.phase === 'review' && flowState.isPreparing === true
  const expectedPositionCount = Number(copyRun.openPositionCount)

  const review = <StopCopyReview isLoading={reviewPreparing} preview={flowState.action?.stopCopy} />

  const successActions = (
    <PreparedActionSuccessActions onClose={dismiss} onPrimaryAction={viewHistory} primaryLabel="View History" />
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
        isPreparing={flowState.isPreparing === true}
        isSelected={isSelected}
        onCancel={dismiss}
        onPrimaryAction={handlePrimaryAction}
        onSlippageChange={setSlippage}
        onTogglePosition={togglePosition}
        positions={positions === undefined ? undefined : selectablePositions}
        positionsError={positionsError}
        primaryActionDisabled={isWritePrimaryActionDisabled({
          accountConnected: !!account,
          executionBlocked: positions === undefined || !!positionsError || !!availabilityMessage,
          interactionLocked: flowState.isPreparing === true,
          onExpectedChain,
        })}
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

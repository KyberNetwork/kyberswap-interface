import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useState } from 'react'
import copyAccountApi from 'services/copyTrading/api/endpoints/copyAccounts'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import type { PositionActionKind, PositionSummary } from 'services/copyTrading/types/positions'
import type { PreparedCallKind } from 'services/copyTrading/types/preparedActions'

import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { ShortenedId } from 'pages/CopyTrading/components/common/layout'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import useRefreshCopyTrading from 'pages/CopyTrading/hooks/useRefreshCopyTrading'
import { ManagePositionForm, ManagePositionReview } from 'pages/CopyTrading/modals/ManagePositionModal/components'
import {
  hasPositionAction,
  isValidWadRatio,
  loadCurrentCopyAccountPosition,
  loadPendingSellObligations,
} from 'pages/CopyTrading/modals/ManagePositionModal/positionData'
import PreparedActionModal from 'pages/CopyTrading/modals/PreparedActionModal'
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
  const { account, chainId } = useActiveWeb3React()
  const { ownerAddress } = useCopyTradingContext()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()
  const refreshCopyTrading = useRefreshCopyTrading()
  const [prepareManualSell] = preparedActionApi.usePrepareManualSellMutation()
  const [prepareClosePosition] = preparedActionApi.usePrepareClosePositionMutation()
  const [getCopyAccountPositions] = copyAccountApi.useLazyGetCopyAccountPositionsQuery()
  const [getObligations] = copyAccountApi.useLazyGetPendingSellObligationsQuery()

  const [flowState, setFlowState] = useState(DEFAULT_PREPARED_ACTION_STATE)
  const [slippage, setSlippage] = useState(0.5)

  const isClose = mode === 'close'
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
      if (!account || !ownerAddress || !copyRunId || !copyAccount || !userPositionId) {
        throw new Error('The selected position is missing write-flow identity fields.')
      }
      if (ownerAddress.toLowerCase() !== account.toLowerCase()) {
        throw new Error('The selected position is not owned by the connected wallet.')
      }

      const [currentPosition, currentObligations] = await Promise.all([
        fetchCurrentPosition(),
        isClose ? Promise.resolve([]) : fetchObligations(),
      ])
      if (
        currentPosition.copyRunId !== copyRunId ||
        currentPosition.copyAccount?.toLowerCase() !== copyAccount.toLowerCase()
      ) {
        throw new Error('The refreshed position does not match the selected Copy Run.')
      }

      const slippageBps = Math.round(slippage * 100)
      if (isClose) {
        const response = await prepareClosePosition({
          ownerAddress,
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
        ownerAddress,
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
    setSlippage(0.5)
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

  const actionLabel = isClose ? 'Close Position' : 'Manual Sell'
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

  return (
    <PreparedActionModal
      isOpen={isOpen}
      onDismiss={dismiss}
      state={flowState}
      title={actionLabel}
      review={<ManagePositionReview isClose={isClose} position={position} preview={preview} />}
      confirmLabel={isClose ? 'Close Position' : 'Execute Manual Sell'}
      confirmVariant={isClose ? 'error' : 'warning'}
      onBack={flow.reset}
      onConfirm={() => void flow.confirm()}
      onRetry={() => void flow.retry()}
      successTitle={isClose ? 'Position closed' : 'Manual sell submitted'}
      successText={
        <>
          {position.token.symbol || 'Token'} · Trade <ShortenedId value={position.tradeId} />
        </>
      }
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

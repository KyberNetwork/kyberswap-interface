import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo, useState } from 'react'
import { usePrepareStopCopyMutation } from 'services/copyTrading'
import type { CopyRunSummary, PositionSummary, PreparedCallKind } from 'services/copyTrading/types'

import { ButtonWarning } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { ShortenedId } from 'pages/CopyTrading/components/common'
import { formatUsd, signedUsd } from 'pages/CopyTrading/helpers'
import PreparedActionModal, { ReviewRow, ReviewSection } from 'pages/CopyTrading/write/PreparedActionModal'
import { useCopyTradeWrite } from 'pages/CopyTrading/write/WriteContext'
import {
  formatPreparedAmount,
  formatSlippage,
  getPreparedReasonMessage,
  isActionAvailable,
} from 'pages/CopyTrading/write/preparedAction'
import { DEFAULT_PREPARED_ACTION_STATE, usePreparedAction } from 'pages/CopyTrading/write/usePreparedAction'
import { useWalletModalToggle } from 'state/application/hooks'
import { cn } from 'utils/cn'

type StopCopyModalProps = {
  isOpen: boolean
  onDismiss: () => void
  copyRun: CopyRunSummary
  positions: PositionSummary[]
  agentName?: string
}

const STOP_COPY_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_STOP_COPY']
const SLIPPAGE_OPTIONS = [0.5, 1, 2]
const MAX_STOP_POSITIONS = 32

const getUserPositionId = (position: PositionSummary) => position.userPositionId

const StopCopyModal = ({ isOpen, onDismiss, copyRun, positions, agentName }: StopCopyModalProps) => {
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()
  const { refreshCopyTrading } = useCopyTradeWrite()
  const [prepareStopCopy] = usePrepareStopCopyMutation()
  const [flowState, setFlowState] = useState(DEFAULT_PREPARED_ACTION_STATE)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [slippage, setSlippage] = useState(0.5)

  const availability = copyRun.stopCopyAvailability
  const onExpectedChain = chainId === copyRun.chainId
  const ownershipMessage =
    account && copyRun.ownerAddress.toLowerCase() !== account.toLowerCase()
      ? 'The selected Copy Run is not owned by the connected wallet.'
      : undefined

  const selectablePositions = useMemo(() => positions.filter(position => getUserPositionId(position)), [positions])
  const isSelected = (position: PositionSummary, index: number) => {
    const positionId = getUserPositionId(position)
    return positionId ? selected[positionId] ?? index < MAX_STOP_POSITIONS : false
  }
  const selectedPositions = selectablePositions.filter(isSelected)

  const togglePosition = (position: PositionSummary, index: number) => {
    const positionId = getUserPositionId(position)
    if (!positionId) return

    const checked = isSelected(position, index)
    if (!checked && selectedPositions.length >= MAX_STOP_POSITIONS) return
    setSelected(current => ({ ...current, [positionId]: !checked }))
  }

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
      if (copyRun.ownerAddress.toLowerCase() !== account.toLowerCase()) {
        throw new Error('The selected Copy Run is not owned by the connected wallet.')
      }

      const currentPositionIds = selectablePositions
        .filter(isSelected)
        .slice(0, MAX_STOP_POSITIONS)
        .map(position => getUserPositionId(position) as string)

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

  const dismiss = () => {
    flow.reset()
    setSelected({})
    setSlippage(0.5)
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

  const preview = flowState.action?.stopCopy
  const review = (
    <Stack className="gap-4">
      <ReviewSection title="Review Stop Copy">
        <ReviewRow label="Agent" value={agentName || copyRun.agentSnapshot?.displayName || 'Copy Run'} />
        <ReviewRow label="Positions to sell" value={preview?.positions?.length || 0} />
        <ReviewRow label="Current value" value={formatUsd(preview?.totalCurrentValueUsd?.value)} />
        <ReviewRow
          label="Estimated cashback"
          value={formatPreparedAmount(preview?.totalCashback, preview?.quoteToken)}
        />
        <ReviewRow
          label="Minimum received"
          value={formatPreparedAmount(preview?.totalSwapQuote?.minimumQuote, preview?.quoteToken)}
        />
      </ReviewSection>
      {!!preview?.positions?.length && (
        <ReviewSection title="Prepared positions">
          {preview.positions.map(position => (
            <ReviewRow
              key={position.userPositionId || position.tradeId}
              label={position.baseToken?.symbol || <ShortenedId value={position.tradeId} />}
              value={formatPreparedAmount(position.swapQuote?.minimumQuote, preview.quoteToken)}
            />
          ))}
        </ReviewSection>
      )}
    </Stack>
  )

  const availabilityMessage = ownershipMessage
    ? ownershipMessage
    : !isActionAvailable(availability)
    ? getPreparedReasonMessage(availability?.reason)
    : undefined

  return (
    <PreparedActionModal
      isOpen={isOpen}
      onDismiss={dismiss}
      state={flowState}
      title={`Stop Copying${agentName ? ` ${agentName}` : ''}`}
      review={review}
      confirmLabel="Stop Copying"
      confirmVariant="warning"
      onBack={flow.reset}
      onConfirm={() => void flow.confirm()}
      onRetry={() => void flow.retry()}
      pendingText="Preparing Stop Copy…"
      successTitle="Copy stopped"
      successText="The transaction is confirmed on-chain. Copy Trading data will refresh in the background."
      width={480}
    >
      <Stack className="gap-4">
        <span className="text-sm text-subText">
          Select positions to sell while stopping. Leaving every position unchecked is valid and stops future copying
          without requesting an exit.
        </span>

        <Stack className="gap-1">
          {selectablePositions.length ? (
            selectablePositions.map((position, index) => {
              const userPositionId = getUserPositionId(position) as string
              const negative = Number(position.unrealizedPnlUsd || 0) < 0
              const checked = isSelected(position, index)
              const selectionLimitReached = !checked && selectedPositions.length >= MAX_STOP_POSITIONS
              return (
                <label
                  key={userPositionId}
                  className={cn(
                    'flex items-center gap-3 rounded-lg bg-white-04 px-3 py-2',
                    selectionLimitReached ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={selectionLimitReached}
                    onChange={() => togglePosition(position, index)}
                    className="size-4 shrink-0 accent-warning"
                  />
                  <HStack className="min-w-0 flex-1 items-center justify-between gap-2">
                    <Stack className="min-w-0 flex-1 gap-0.5">
                      <span className="truncate text-sm font-medium text-text">{position.token.symbol}</span>
                      <span className="text-xs text-subText">
                        <ShortenedId value={position.tradeId} />
                      </span>
                    </Stack>
                    <span className={cn('shrink-0 text-sm font-medium', negative ? 'text-red' : 'text-primary')}>
                      {signedUsd(position.unrealizedPnlUsd)}
                    </span>
                  </HStack>
                </label>
              )
            })
          ) : (
            <span className="text-center text-sm text-subText">No open positions. You can still stop copying.</span>
          )}
        </Stack>

        {selectablePositions.length > MAX_STOP_POSITIONS && (
          <span className="text-xs text-warning">
            Select up to {MAX_STOP_POSITIONS} positions to sell in this Stop Copy request.
          </span>
        )}

        <HStack className="items-center justify-between gap-3">
          <span className="text-sm text-subText">Slippage tolerance</span>
          <HStack className="gap-2">
            {SLIPPAGE_OPTIONS.map(value => (
              <button
                key={value}
                type="button"
                onClick={() => setSlippage(value)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                  slippage === value
                    ? 'border-primary bg-primary-12 text-primary'
                    : 'border-darkBorder text-subText hover:text-text',
                )}
              >
                {formatSlippage(value * 100)}
              </button>
            ))}
          </HStack>
        </HStack>

        <ButtonWarning
          type="button"
          disabled={!!account && onExpectedChain && !!availabilityMessage}
          title={availabilityMessage}
          onClick={handlePrimaryAction}
        >
          {!account
            ? 'Connect wallet'
            : !onExpectedChain
            ? 'Switch network'
            : availabilityMessage
            ? 'Stop Copy unavailable'
            : selectedPositions.length
            ? `Review Stop & Sell ${selectedPositions.length}`
            : 'Review Stop Copy'}
        </ButtonWarning>
      </Stack>
    </PreparedActionModal>
  )
}

export default StopCopyModal

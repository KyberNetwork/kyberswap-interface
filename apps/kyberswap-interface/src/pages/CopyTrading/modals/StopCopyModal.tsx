import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import copyTradingApi, { usePrepareStopCopyMutation } from 'services/copyTrading'
import type { CopyRunSummary, PositionSummary, PreparedCallKind } from 'services/copyTrading/types'

import { ButtonWarning } from 'components/Button'
import Loader from 'components/Loader'
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
  getApiErrorMessage,
  getPreparedReasonMessage,
  isActionAvailable,
} from 'pages/CopyTrading/write/preparedAction'
import { DEFAULT_PREPARED_ACTION_STATE, usePreparedAction } from 'pages/CopyTrading/write/usePreparedAction'
import { useWalletModalToggle } from 'state/application/hooks'
import { cn } from 'utils/cn'

type StopCopyModalProps = {
  isOpen: boolean
  onDismiss: () => void
  run: CopyRunSummary
  agentName?: string
}

const STOP_COPY_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_STOP_COPY']
const SLIPPAGE_OPTIONS = [0.5, 1, 2]
const MAX_STOP_POSITIONS = 32

const getUserPositionId = (position: PositionSummary) => position.userPositionId

const StopCopyModal = ({ isOpen, onDismiss, run, agentName }: StopCopyModalProps) => {
  const { account, chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()
  const { refreshCopyTrading } = useCopyTradeWrite()
  const [prepareStopCopy] = usePrepareStopCopyMutation()
  const [getPositions] = copyTradingApi.useLazyGetCopyRunPositionsQuery()
  const { data: runResponse, isFetching: isRefreshingRun } = copyTradingApi.useGetCopyRunQuery(
    { ownerAddress: run.ownerAddress, copyRunId: run.copyRunId },
    { skip: !isOpen },
  )
  const [flowState, setFlowState] = useState(DEFAULT_PREPARED_ACTION_STATE)
  const [positions, setPositions] = useState<PositionSummary[]>([])
  const [positionsLoading, setPositionsLoading] = useState(false)
  const [positionsError, setPositionsError] = useState<string>()
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [slippage, setSlippage] = useState(0.5)

  const directRun = runResponse?.data || run
  const availability = directRun.stopCopyAvailability
  const onExpectedChain = chainId === directRun.chainId
  const ownershipMessage =
    account && directRun.ownerAddress.toLowerCase() !== account.toLowerCase()
      ? 'The selected Copy Run is not owned by the connected wallet.'
      : undefined

  const fetchAllPositions = useCallback(async () => {
    const rows: PositionSummary[] = []
    let cursor: string | undefined

    while (true) {
      const response = await getPositions({
        ownerAddress: directRun.ownerAddress,
        copyRunId: directRun.copyRunId,
        status: 'open',
        cursor,
        limit: 100,
      }).unwrap()
      rows.push(...response.data)

      if (!response.pagination.hasMore) return rows
      const nextCursor = response.pagination.nextCursor
      if (!nextCursor || nextCursor === cursor) {
        throw new Error('The positions response returned an invalid pagination cursor.')
      }
      cursor = nextCursor
    }
  }, [directRun.copyRunId, directRun.ownerAddress, getPositions])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    const loadPositions = async () => {
      setPositionsLoading(true)
      setPositionsError(undefined)
      try {
        const rows = await fetchAllPositions()
        if (!cancelled) setPositions(rows)
      } catch (error) {
        if (!cancelled) setPositionsError(getApiErrorMessage(error))
      } finally {
        if (!cancelled) setPositionsLoading(false)
      }
    }

    void loadPositions()
    return () => {
      cancelled = true
    }
  }, [fetchAllPositions, isOpen])

  const selectablePositions = useMemo(
    () => positions.filter(position => getUserPositionId(position)).slice(0, MAX_STOP_POSITIONS),
    [positions],
  )
  const isSelected = (position: PositionSummary) => {
    const positionId = getUserPositionId(position)
    return positionId ? selected[positionId] ?? true : false
  }
  const selectedPositions = selectablePositions.filter(isSelected)

  const flow = usePreparedAction({
    state: flowState,
    setState: setFlowState,
    expected: {
      account: account || '',
      callKinds: STOP_COPY_CALL_KINDS,
      chainId: directRun.chainId,
      copyAccount: directRun.copyAccount,
      preview: 'stopCopy',
    },
    prepare: async () => {
      if (!account) throw new Error('Connect your wallet first.')
      if (directRun.ownerAddress.toLowerCase() !== account.toLowerCase()) {
        throw new Error('The selected Copy Run is not owned by the connected wallet.')
      }

      const currentPositions = await fetchAllPositions()
      setPositions(currentPositions)
      setPositionsError(undefined)
      const currentPositionIds = currentPositions
        .filter(position => getUserPositionId(position))
        .slice(0, MAX_STOP_POSITIONS)
        .filter(position => {
          const positionId = getUserPositionId(position) as string
          return selected[positionId] ?? true
        })
        .map(position => getUserPositionId(position) as string)

      const response = await prepareStopCopy({
        ownerAddress: account.toLowerCase(),
        copyRunId: directRun.copyRunId,
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
      void changeNetwork(directRun.chainId as ChainId)
      return
    }
    void flow.prepare()
  }

  const preview = flowState.action?.stopCopy
  const review = (
    <Stack className="gap-4">
      <ReviewSection title="Review Stop Copy">
        <ReviewRow label="Agent" value={agentName || directRun.agentSnapshot?.displayName || 'Copy Run'} />
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
      title={`Stop Copying${agentName ? ` ${agentName}` : ''}`}
      review={review}
      confirmLabel="Stop Copying"
      onBack={flow.reset}
      onConfirm={() => void flow.confirm()}
      onRetry={() => void flow.retry()}
      pendingText="Refreshing the Copy Run and selected positions…"
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
          {positionsLoading ? (
            <HStack className="items-center justify-center gap-2 text-sm text-subText">
              <Loader size="18px" /> Loading all positions…
            </HStack>
          ) : positionsError ? (
            <span className="text-center text-sm text-red">{positionsError}</span>
          ) : selectablePositions.length ? (
            selectablePositions.map(position => {
              const userPositionId = getUserPositionId(position) as string
              const negative = Number(position.unrealizedPnlUsd || 0) < 0
              return (
                <label
                  key={userPositionId}
                  className="flex cursor-pointer items-center gap-3 rounded-lg bg-white-04 px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={isSelected(position)}
                    onChange={() => setSelected(current => ({ ...current, [userPositionId]: !isSelected(position) }))}
                    className="size-4 shrink-0 accent-primary"
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

        {positions.length > MAX_STOP_POSITIONS && (
          <span className="text-xs text-warning">
            Only the first {MAX_STOP_POSITIONS} eligible positions can be prepared.
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
          disabled={!!account && onExpectedChain && (positionsLoading || !!positionsError || !!availabilityMessage)}
          title={availabilityMessage || positionsError}
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

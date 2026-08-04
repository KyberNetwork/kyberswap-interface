import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useState } from 'react'
import copyTradingApi, { usePrepareClosePositionMutation, usePrepareManualSellMutation } from 'services/copyTrading'
import type {
  PendingSellObligation,
  PositionActionKind,
  PositionSummary,
  PreparedCallKind,
} from 'services/copyTrading/types'

import { ButtonLight } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { ShortenedId } from 'pages/CopyTrading/components/common'
import { useCopyTradingContext } from 'pages/CopyTrading/context'
import { formatUsd } from 'pages/CopyTrading/helpers'
import PreparedActionModal, { ReviewRow, ReviewSection } from 'pages/CopyTrading/write/PreparedActionModal'
import { useCopyTradeWrite } from 'pages/CopyTrading/write/WriteContext'
import { formatPreparedAmount, formatSlippage, formatWadPercent } from 'pages/CopyTrading/write/preparedAction'
import { DEFAULT_PREPARED_ACTION_STATE, usePreparedAction } from 'pages/CopyTrading/write/usePreparedAction'
import { useWalletModalToggle } from 'state/application/hooks'
import { cn } from 'utils/cn'

export type ManagePositionMode = 'sell' | 'close'

type ManagePositionModalProps = {
  isOpen: boolean
  onDismiss: () => void
  position: PositionSummary
  mode: ManagePositionMode
}

const SLIPPAGE_OPTIONS = [0.5, 1, 2]
const MANUAL_SELL_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_MANUAL_SELL']
const CLOSE_POSITION_CALL_KINDS: PreparedCallKind[] = ['PREPARED_CALL_KIND_CLOSE_POSITION']

const PositionValue = ({ symbol, tradeId }: { symbol?: string; tradeId: string }) => (
  <>
    {symbol || 'Token'} · <ShortenedId value={tradeId} />
  </>
)

const hasPositionAction = (position: PositionSummary, action: PositionActionKind) =>
  position.actionKind === action || position.availableActionKinds.includes(action)

const isValidWadRatio = (value?: string) => {
  if (!value || !/^\d+$/.test(value)) return false
  const ratio = BigInt(value)
  return ratio > 0n && ratio <= 10n ** 18n
}

const ManagePositionModal = ({ isOpen, onDismiss, position, mode }: ManagePositionModalProps) => {
  const { account, chainId } = useActiveWeb3React()
  const { ownerAddress } = useCopyTradingContext()
  const { changeNetwork } = useChangeNetwork()
  const toggleWalletModal = useWalletModalToggle()
  const { refreshCopyTrading, withWalletSession } = useCopyTradeWrite()
  const [prepareManualSell] = usePrepareManualSellMutation()
  const [prepareClosePosition] = usePrepareClosePositionMutation()
  const [getObligations] = copyTradingApi.useLazyGetPendingSellObligationsQuery()
  const [flowState, setFlowState] = useState(DEFAULT_PREPARED_ACTION_STATE)
  const [slippage, setSlippage] = useState(0.5)

  const isClose = mode === 'close'
  const actionColor = isClose ? 'var(--ks-red)' : 'var(--ks-warning)'
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

    const fifo: PendingSellObligation[] = []
    let obligationCursor: string | undefined
    while (true) {
      const response = await getObligations({
        chainId: position.chainId,
        copyAccount,
        userPositionId,
        cursor: obligationCursor,
        limit: 200,
      }).unwrap()
      fifo.push(...response.data)
      if (!response.pagination.hasMore) break
      const nextCursor = response.pagination.nextCursor
      if (!nextCursor || nextCursor === obligationCursor) {
        throw new Error('The pending obligations response returned an invalid pagination cursor.')
      }
      obligationCursor = nextCursor
    }
    return fifo
  }, [copyAccount, getObligations, position.chainId, userPositionId])

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

      if (!hasPositionAction(position, requiredAction)) {
        throw new Error('The selected position does not advertise this recovery action.')
      }

      const currentObligations = isClose ? [] : await fetchObligations()

      return withWalletSession(ownerAddress, position.chainId, async accessToken => {
        const slippageBps = Math.round(slippage * 100)
        if (isClose) {
          const response = await prepareClosePosition({
            ownerAddress,
            copyRunId,
            userPositionId,
            accessToken,
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
          accessToken,
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
      })
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

  const preview = isClose ? flowState.action?.closePosition : flowState.action?.manualSell
  const review = (
    <Stack className="gap-4">
      <ReviewSection title={isClose ? 'Review full recovery' : 'Review pending sell recovery'}>
        <ReviewRow
          label="Position"
          value={
            <PositionValue symbol={preview?.baseToken?.symbol || position.token.symbol} tradeId={position.tradeId} />
          }
        />
        {!isClose && <ReviewRow label="Required sell ratio" value={formatWadPercent(preview?.sellRatioRaw)} />}
        {!isClose && <ReviewRow label="Pending obligations" value={preview?.unresolvedSkipCount} />}
        <ReviewRow label="Sell amount" value={formatPreparedAmount(preview?.sellBase, preview?.baseToken)} />
        <ReviewRow
          label="Minimum received"
          value={formatPreparedAmount(preview?.swapQuote?.minimumQuote, preview?.quoteToken)}
        />
        <ReviewRow label="Estimated cashback" value={formatPreparedAmount(preview?.cashback, preview?.baseToken)} />
        <ReviewRow label="Effective slippage" value={formatSlippage(preview?.swapQuote?.effectiveSlippageBps)} />
      </ReviewSection>
    </Stack>
  )

  const unavailableMessage = !actionAdvertised
    ? `The selected position does not advertise ${isClose ? 'Close Position' : 'Manual Sell'}.`
    : undefined

  return (
    <PreparedActionModal
      isOpen={isOpen}
      onDismiss={dismiss}
      state={flowState}
      title={isClose ? 'Close Position' : 'Manual Sell'}
      review={review}
      confirmLabel={isClose ? 'Close Position' : 'Execute Manual Sell'}
      confirmVariant={isClose ? 'error' : 'warning'}
      onBack={flow.reset}
      onConfirm={() => void flow.confirm()}
      onRetry={() => void flow.retry()}
      pendingText="Preparing this recovery action…"
      successTitle={isClose ? 'Position closed' : 'Manual sell submitted'}
      successText={
        <>
          {position.token.symbol || 'Token'} · Trade <ShortenedId value={position.tradeId} />
        </>
      }
    >
      <Stack className="gap-4">
        <ReviewSection>
          <ReviewRow
            label="Position"
            value={<PositionValue symbol={position.token.symbol} tradeId={position.tradeId} />}
          />
          <ReviewRow label="Current value" value={formatUsd(position.valueUsd)} />
        </ReviewSection>

        <Stack className="gap-2">
          <span className="text-sm text-subText">Slippage tolerance</span>
          <HStack className="gap-2">
            {SLIPPAGE_OPTIONS.map(value => (
              <button
                key={value}
                type="button"
                onClick={() => setSlippage(value)}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  slippage === value
                    ? 'border-primary bg-primary-12 text-primary'
                    : 'border-darkBorder text-subText hover:text-text',
                )}
              >
                {formatSlippage(value * 100)}
              </button>
            ))}
          </HStack>
        </Stack>

        <ButtonLight
          type="button"
          color={actionColor}
          disabled={!!account && onExpectedChain && !!unavailableMessage}
          title={unavailableMessage}
          onClick={handlePrimaryAction}
        >
          {!account
            ? 'Connect wallet'
            : !onExpectedChain
            ? 'Switch network'
            : unavailableMessage
            ? `${isClose ? 'Close Position' : 'Manual Sell'} unavailable`
            : `Review ${isClose ? 'Close Position' : 'Manual Sell'}`}
        </ButtonLight>
      </Stack>
    </PreparedActionModal>
  )
}

export default ManagePositionModal

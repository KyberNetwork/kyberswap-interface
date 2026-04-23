import { NETWORKS_INFO, Pool, ZapRouteDetail } from '@kyber/schema'
import { Button, StatusDialog, StatusDialogType, translateZapMessage } from '@kyber/ui'
import { useEffect, useRef } from 'react'
import { Text } from 'rebass'
import { BuildZapInData } from 'services/zap'
import styled from 'styled-components'

import { ButtonErrorStyle, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import type { ZapState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { getStatusErrorMessage } from 'pages/Earns/PoolDetail/AddLiquidity/utils'
import PoolHeader from 'pages/Earns/PoolDetail/components/PoolHeader'
import { NoteCard } from 'pages/Earns/PoolDetail/styled'
import { TransactionHistory } from 'state/transactions/type'
import { CloseIcon } from 'theme/components'

import EstimateInfo from './EstimateInfo'
import PriceInfo from './PriceInfo'
import ZapInfo from './ZapInfo'
import { ReviewTransactionStatusPhase, useReviewTransaction } from './useReviewTransaction'

type ReviewWarningItem = {
  kind: 'remaining' | 'zap_impact' | 'out_of_range' | 'price_deviation'
  tone: 'info' | 'warning' | 'error'
  message: string
}

const ModalContent = styled(Stack)`
  align-self: flex-start;
  font-size: 14px;
  padding: 24px;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
  `}
`

type AddLiquidityReviewModalProps = {
  pool: Pool
  buildData: BuildZapInData
  chainId: number
  error?: string | null
  priceRange: ZapState['priceRange']
  route: ZapRouteDetail
  slippage?: number
  tokenInput: ZapState['tokenInput']
  warnings: ReviewWarningItem[]
  onDismiss?: () => void
  onTrackEvent?: (eventName: string, data?: Record<string, unknown>) => void
  onAddTrackedTxHash?: (hash: string) => void
  onAddTransactionWithType?: (transaction: TransactionHistory) => void
}

const getStatusDialogType = (statusPhase: ReviewTransactionStatusPhase) => {
  switch (statusPhase) {
    case 'success':
      return StatusDialogType.SUCCESS
    case 'cancelled':
      return StatusDialogType.CANCELLED
    case 'failed':
      return StatusDialogType.ERROR
    case 'processing':
      return StatusDialogType.PROCESSING
    case 'waiting_wallet':
    default:
      return StatusDialogType.WAITING
  }
}

const StatusContent = ({
  statusPhase,
  txError,
  transactionExplorerUrl,
  onDismiss,
  onViewPosition,
}: {
  statusPhase: ReviewTransactionStatusPhase
  txError?: string | null
  transactionExplorerUrl?: string
  onDismiss?: () => void
  onViewPosition?: () => void
}) => {
  const translatedErrorMessage = getStatusErrorMessage(txError)
  const canDismiss = statusPhase !== 'waiting_wallet'
  const canViewPosition = statusPhase === 'success' && Boolean(onViewPosition)

  const statusAction =
    canDismiss || canViewPosition ? (
      <>
        {canDismiss && (
          <Button className="flex-1 h-10 border-subText" variant="outline" onClick={onDismiss}>
            Close
          </Button>
        )}
        {canViewPosition && (
          <Button className="flex-1 h-10" variant="default" onClick={onViewPosition}>
            View Position
          </Button>
        )}
      </>
    ) : undefined

  return (
    <StatusDialog
      action={statusAction}
      type={getStatusDialogType(statusPhase)}
      description={statusPhase === 'waiting_wallet' ? 'Confirm this transaction in your wallet' : undefined}
      errorMessage={translatedErrorMessage}
      transactionExplorerUrl={transactionExplorerUrl}
      onClose={canDismiss ? onDismiss || (() => {}) : () => {}}
    />
  )
}

const AddLiquidityReviewModal = ({
  pool,
  buildData,
  chainId,
  error,
  priceRange,
  route,
  slippage,
  tokenInput,
  warnings,
  onDismiss,
  onTrackEvent,
  onAddTrackedTxHash,
  onAddTransactionWithType,
}: AddLiquidityReviewModalProps) => {
  const theme = useTheme()
  const hasTrackedSummaryView = useRef(false)
  const hasSubmitAttemptRef = useRef(false)

  const transaction = useReviewTransaction({
    isOpen: true,
    buildData,
    pool,
    route,
    tokenInput,
    onAddTrackedTxHash,
    onAddTransactionWithType,
    onDismiss,
    onTrackEvent,
  })

  const isSuccessful = transaction.statusPhase === 'success'
  const showStatusDialog = transaction.statusPhase !== 'idle'
  const isHighZapImpact = warnings.some(warning => warning.kind === 'zap_impact' && warning.tone === 'error')
  const ConfirmButton = isHighZapImpact ? ButtonErrorStyle : ButtonPrimary

  useEffect(() => {
    if (hasTrackedSummaryView.current) return

    onTrackEvent?.('LIQ_ZAP_SUMMARY_VIEWED', {
      pool_pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
      chain: NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]?.name,
    })
    hasTrackedSummaryView.current = true
  }, [chainId, onTrackEvent, pool])

  useEffect(() => {
    if (transaction.statusPhase !== 'idle') {
      hasSubmitAttemptRef.current = true
    }
  }, [transaction.statusPhase])

  const handleDismiss = () => {
    if (!hasSubmitAttemptRef.current) {
      onTrackEvent?.('LIQ_ADD_CANCELLED', {
        pool_pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
        pool_fee_tier: `${pool.fee}%`,
        chain: NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]?.name,
      })
    }
    onDismiss?.()
  }

  const handleStatusClose = () => {
    if (transaction.statusPhase === 'waiting_wallet') {
      return
    }

    const shouldDismiss = transaction.statusPhase === 'processing' || transaction.statusPhase === 'success'

    transaction.resetTransactionState()

    if (shouldDismiss) {
      onDismiss?.()
    }
  }

  if (showStatusDialog) {
    return (
      <StatusContent
        statusPhase={transaction.statusPhase}
        txError={transaction.submitError}
        transactionExplorerUrl={transaction.transactionExplorerUrl}
        onDismiss={handleStatusClose}
        onViewPosition={isSuccessful ? transaction.handleViewPosition : undefined}
      />
    )
  }

  return (
    <Modal isOpen borderRadius="20px" maxWidth={480} mobileFullWidth onDismiss={handleDismiss}>
      <ModalContent gap={16}>
        <HStack align="center" justify="space-between" width="100%">
          <Text fontSize={24} fontWeight={500}>
            Add Liquidity via Zap
          </Text>
          <CloseIcon color={theme.subText} onClick={handleDismiss} size={28} />
        </HStack>

        <PoolHeader isReview />

        <ZapInfo chainId={chainId} route={route} tokenInput={tokenInput} />

        <PriceInfo pool={pool} priceRange={priceRange} />

        <EstimateInfo pool={pool} route={route} slippage={slippage} />

        {error ? <NoteCard $tone="error">{translateZapMessage(error)}</NoteCard> : null}

        {warnings.length ? (
          <Stack gap={12}>
            {warnings.map((warning, index) => (
              <NoteCard key={`${warning.tone}-${index}`} $tone={warning.tone}>
                {translateZapMessage(warning.message)}
              </NoteCard>
            ))}
          </Stack>
        ) : null}

        <Text color={theme.subText} fontSize={14} fontStyle="italic">
          The information is intended solely for your reference at the time you are viewing. It is your responsibility
          to verify all information before making decisions.
        </Text>

        <ConfirmButton
          altDisabledStyle
          color={theme.buttonBlack}
          disabled={transaction.confirmDisabled || Boolean(error)}
          onClick={() => void transaction.handleSubmit()}
          type="button"
        >
          {transaction.confirmLoading ? 'Adding Liquidity...' : isHighZapImpact ? 'Zap Anyway' : 'Add Liquidity'}
        </ConfirmButton>
      </ModalContent>
    </Modal>
  )
}

export default AddLiquidityReviewModal

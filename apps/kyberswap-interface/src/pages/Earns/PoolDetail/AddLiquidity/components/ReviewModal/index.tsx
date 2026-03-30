import { Pool, ZapRouteDetail } from '@kyber/schema'
import { StatusDialog, StatusDialogType, translateZapMessage } from '@kyber/ui'
import { Text } from 'rebass'
import { BuildZapInData } from 'services/zap'
import styled from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
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
  kind: 'remaining' | 'zap_impact' | 'out_of_range' | 'full_range' | 'price_deviation'
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
  isRefreshing?: boolean
  priceRange: ZapState['priceRange']
  route: ZapRouteDetail
  slippage?: number
  tokenInput: ZapState['tokenInput']
  warnings: ReviewWarningItem[]
  onDismiss?: () => void
  onUseSuggestedSlippage?: (suggestedSlippage?: number) => void
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
        {canDismiss ? (
          <ButtonOutlined flex="1" height="36px" onClick={onDismiss}>
            Close
          </ButtonOutlined>
        ) : null}
        {canViewPosition ? (
          <ButtonPrimary flex="1" height="36px" onClick={onViewPosition}>
            View position
          </ButtonPrimary>
        ) : null}
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
  isRefreshing,
  priceRange,
  route,
  slippage,
  tokenInput,
  warnings,
  onDismiss,
  onUseSuggestedSlippage,
  onAddTrackedTxHash,
  onAddTransactionWithType,
}: AddLiquidityReviewModalProps) => {
  const theme = useTheme()

  const transaction = useReviewTransaction({
    isOpen: true,
    buildData,
    pool,
    tokenInput,
    onAddTrackedTxHash,
    onAddTransactionWithType,
    onDismiss,
  })

  const isSuccessful = transaction.statusPhase === 'success'
  const showStatusDialog = transaction.statusPhase !== 'idle'

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
    <Modal isOpen borderRadius="20px" maxWidth={480} mobileFullWidth onDismiss={onDismiss}>
      <ModalContent gap={16}>
        <HStack align="center" justify="space-between" width="100%">
          <Text fontSize={24} fontWeight={500}>
            Add Liquidity via Zap
          </Text>
          <CloseIcon color={theme.subText} onClick={onDismiss} size={28} />
        </HStack>

        <PoolHeader isReview />

        <ZapInfo chainId={chainId} route={route} tokenInput={tokenInput} />

        <PriceInfo pool={pool} priceRange={priceRange} />

        <EstimateInfo onUseSuggestedSlippage={onUseSuggestedSlippage} pool={pool} route={route} slippage={slippage} />

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

        <ButtonPrimary
          altDisabledStyle
          borderRadius="20px"
          color={theme.buttonBlack}
          disabled={transaction.confirmDisabled || isRefreshing || Boolean(error)}
          height="48px"
          onClick={() => void transaction.handleSubmit()}
          type="button"
        >
          {transaction.confirmLoading ? 'Adding Liquidity...' : isRefreshing ? 'Refreshing Route...' : 'Add Liquidity'}
        </ButtonPrimary>
      </ModalContent>
    </Modal>
  )
}

export default AddLiquidityReviewModal

import { Pool, ZapRouteDetail } from '@kyber/schema'
import { StatusDialog, StatusDialogType, translateFriendlyErrorMessage, translateZapMessage } from '@kyber/ui'
import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { Text } from 'rebass'
import styled from 'styled-components'

import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import type { ZapState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import PoolHeader from 'pages/Earns/PoolDetail/components/PoolHeader'
import { CloseIcon } from 'theme/components'

import EstimateInfo from './EstimateInfo'
import PriceInfo from './PriceInfo'
import ZapInfo from './ZapInfo'
import { useReviewBuild } from './useReviewBuild'
import { ReviewTransactionStatusPhase, useReviewTransaction } from './useReviewTransaction'

type ReviewWarningItem = {
  kind: 'remaining' | 'zap_impact' | 'out_of_range' | 'full_range' | 'price_deviation'
  tone: 'info' | 'warning' | 'error'
  message: string
}

const ModalContent = styled(Stack)`
  width: 100%;
  padding: 24px;
  font-size: 14px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
  `}
`

const TitleText = styled(Text)`
  font-size: 24px;
  font-weight: 500;
`

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;

  :hover {
    background: ${({ theme }) => theme.tabActive};
  }
`

const DisclaimerText = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  font-style: italic;
`

const ConfirmButton = styled.button`
  width: 100%;
  height: 48px;
  padding: 0 20px;
  border: 0;
  border-radius: 20px;
  background: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.buttonBlack};
  font-weight: 500;
  cursor: pointer;

  :disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  :hover {
    filter: brightness(1.12);
  }
`

const WarningCard = styled(Stack)<{ $tone: 'info' | 'warning' | 'error' }>`
  padding: 12px 14px;
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === 'error'
        ? rgba(theme.red, 0.24)
        : $tone === 'warning'
        ? rgba(theme.warning, 0.24)
        : rgba(theme.primary, 0.24)};
  border-radius: 12px;
  background: ${({ theme, $tone }) =>
    $tone === 'error'
      ? rgba(theme.red, 0.12)
      : $tone === 'warning'
      ? rgba(theme.warning, 0.12)
      : rgba(theme.primary, 0.12)};
  color: ${({ theme }) => theme.text};
  font-size: 14px;
`

type AddLiquidityReviewModalProps = {
  isOpen: boolean
  pool: Pool
  warnings: ReviewWarningItem[]
  route: ZapRouteDetail
  routeLoading: boolean
  refetchRoute?: () => Promise<unknown>
  chainId: number
  tokenInput: ZapState['tokenInput']
  slippage?: number
  priceRange: ZapState['priceRange']
  confirmText: string
  onClearTracking?: () => void
  onAddTrackedTxHash?: (hash: string) => void
  onAddTransactionWithType?: (transaction: any) => void
  onDismiss?: () => void
  onUseSuggestedSlippage?: (suggestedSlippage?: number) => void
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
  slippage,
  suggestedSlippage,
  txError,
  transactionExplorerUrl,
  onDismiss,
  onUseSuggestedSlippage,
  onViewPosition,
}: {
  statusPhase: ReviewTransactionStatusPhase
  slippage?: number
  suggestedSlippage?: number
  txError?: string | null
  transactionExplorerUrl?: string
  onDismiss?: () => void
  onUseSuggestedSlippage?: () => void
  onViewPosition?: () => void
}) => {
  const translatedErrorMessage = txError ? translateFriendlyErrorMessage(txError) : undefined
  const errorMessage = txError?.toLowerCase() || ''

  const isSlippageError = errorMessage.includes('slippage')
  const canViewPosition = statusPhase === 'success' && Boolean(onViewPosition)

  const statusAction = (
    <>
      <button className="ks-outline-btn flex-1" onClick={onDismiss}>
        Close
      </button>
      {canViewPosition ? (
        <button className="ks-primary-btn flex-1" onClick={onViewPosition}>
          View position
        </button>
      ) : isSlippageError ? (
        <button className="ks-primary-btn flex-1" onClick={onUseSuggestedSlippage || onDismiss}>
          {slippage !== suggestedSlippage ? t`Use Suggested Slippage` : t`Set Custom Slippage`}
        </button>
      ) : null}
    </>
  )

  return (
    <StatusDialog
      type={getStatusDialogType(statusPhase)}
      description={statusPhase === 'waiting_wallet' ? 'Confirm this transaction in your wallet' : undefined}
      errorMessage={translatedErrorMessage}
      transactionExplorerUrl={transactionExplorerUrl}
      action={statusAction}
      onClose={onDismiss || (() => {})}
    />
  )
}

const AddLiquidityReviewModal = ({
  isOpen,
  pool,
  warnings,
  route,
  routeLoading,
  refetchRoute,
  chainId,
  tokenInput,
  slippage,
  priceRange,
  confirmText,
  onClearTracking,
  onAddTrackedTxHash,
  onAddTransactionWithType,
  onDismiss,
  onUseSuggestedSlippage,
}: AddLiquidityReviewModalProps) => {
  const { buildData, buildError, buildLoading, rebuildReview } = useReviewBuild({
    isOpen,
    route,
    refetchRoute,
    onClearTracking,
  })

  const transaction = useReviewTransaction({
    isOpen,
    buildData,
    pool,
    tokenInput,
    onAddTrackedTxHash,
    onAddTransactionWithType,
    onDismiss,
  })

  const isWaitingForWallet = transaction.statusPhase === 'waiting_wallet'
  const isProcessing = transaction.statusPhase === 'processing'
  const isSuccessful = transaction.statusPhase === 'success'
  const showStatusDialog = transaction.statusPhase !== 'idle'

  const handleStatusClose = async () => {
    if (isWaitingForWallet) {
      transaction.resetTransactionState()
      return
    }

    if (isSuccessful || isProcessing) {
      onDismiss?.()
      return
    }

    transaction.resetTransactionState()
    await rebuildReview()
  }

  const handleUseSuggestedSlippage = () => {
    onUseSuggestedSlippage?.(route.zapDetails.suggestedSlippage)
    transaction.resetTransactionState()
  }

  if (!isOpen) return null

  if (showStatusDialog) {
    return (
      <StatusContent
        statusPhase={transaction.statusPhase}
        slippage={slippage}
        suggestedSlippage={route.zapDetails.suggestedSlippage}
        txError={transaction.submitError}
        transactionExplorerUrl={transaction.transactionExplorerUrl}
        onDismiss={() => {
          void handleStatusClose()
        }}
        onUseSuggestedSlippage={() => {
          handleUseSuggestedSlippage()
        }}
        onViewPosition={isSuccessful ? transaction.handleViewPosition : undefined}
      />
    )
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth={480} borderRadius="20px" mobileFullWidth>
      <ModalContent gap={16}>
        <HStack width="100%" align="center" justify="space-between">
          <TitleText>Add Liquidity via Zap</TitleText>
          <CloseButton aria-label="Close review" onClick={onDismiss} type="button">
            <CloseIcon size={28} />
          </CloseButton>
        </HStack>

        <PoolHeader isReview />

        <ZapInfo chainId={chainId} route={route} tokenInput={tokenInput} />

        <PriceInfo pool={pool} priceRange={priceRange} />

        <EstimateInfo pool={pool} route={route} slippage={slippage} />

        {buildError ? (
          <WarningCard $tone="error">{translateFriendlyErrorMessage(buildError) || buildError}</WarningCard>
        ) : null}

        {warnings.length ? (
          <Stack gap={12}>
            {warnings.map((warning, index) => (
              <WarningCard key={`${warning.tone}-${index}`} $tone={warning.tone}>
                {translateZapMessage(warning.message)}
              </WarningCard>
            ))}
          </Stack>
        ) : null}

        <DisclaimerText>
          The information is intended solely for your reference at the time you are viewing. It is your responsibility
          to verify all information before making decisions
        </DisclaimerText>

        <ConfirmButton
          disabled={transaction.confirmDisabled || routeLoading || buildLoading || Boolean(buildError)}
          onClick={() => void transaction.handleSubmit()}
          type="button"
        >
          {transaction.confirmLoading
            ? 'Adding Liquidity...'
            : routeLoading || buildLoading
            ? 'Refreshing Route...'
            : confirmText}
        </ConfirmButton>
      </ModalContent>
    </Modal>
  )
}

export default AddLiquidityReviewModal

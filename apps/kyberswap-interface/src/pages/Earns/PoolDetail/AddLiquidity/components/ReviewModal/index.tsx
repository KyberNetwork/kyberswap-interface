import { Pool, PoolType, ZapRouteDetail } from '@kyber/schema'
import { StatusDialog, StatusDialogType, translateFriendlyErrorMessage, translateZapMessage } from '@kyber/ui'
import { t } from '@lingui/macro'
import { rgba } from 'polished'
import styled from 'styled-components'

import Modal from 'components/Modal'
import { Stack } from 'components/Stack'
import { type ReviewStateSource, useReviewData } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useReviewData'

import { ReviewHeader, ZapInSection } from './HeaderAndZapIn'
import { EstimateSection, PriceInfoSection } from './PriceAndEstimate'
import { useReviewBuild } from './useReviewBuild'
import { useReviewTransaction } from './useReviewTransaction'

type ReviewTokenIn = {
  symbol: string
  logoUrl?: string
  amount: string
}

const ModalContent = styled(Stack)`
  width: 100%;
  padding: 24px;
  font-size: 14px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
  `}
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
  route: ZapRouteDetail
  refetchRoute?: () => Promise<unknown>
  chainId: number
  poolType: PoolType
  state: ReviewStateSource
  tokensIn: ReviewTokenIn[]
  confirmText: string
  onClearTracking?: () => void
  onAddTrackedTxHash?: (hash: string) => void
  onAddTransactionWithType?: (transaction: any) => void
  onDismiss?: () => void
  onUseSuggestedSlippage?: () => void
  onRevertPriceToggle?: () => void
}

const StatusContent = ({
  slippage,
  suggestedSlippage,
  txHash,
  txStatus = '',
  txError,
  transactionExplorerUrl,
  onDismiss,
  onUseSuggestedSlippage,
  onViewPosition,
}: {
  slippage?: number
  suggestedSlippage?: number
  txHash?: string
  txStatus?: 'success' | 'failed' | 'cancelled' | ''
  txError?: string | null
  transactionExplorerUrl?: string
  onDismiss?: () => void
  onUseSuggestedSlippage?: () => void
  onViewPosition?: () => void
}) => {
  const translatedErrorMessage = txError ? translateFriendlyErrorMessage(txError) : undefined
  const errorMessage = txError?.toLowerCase() || ''

  const isSlippageError = errorMessage.includes('slippage')
  const canViewPosition = txStatus === 'success' && Boolean(onViewPosition)
  const statusType =
    txStatus === 'success'
      ? StatusDialogType.SUCCESS
      : txStatus === 'cancelled'
      ? StatusDialogType.CANCELLED
      : txStatus === 'failed' || txError
      ? StatusDialogType.ERROR
      : txHash
      ? StatusDialogType.PROCESSING
      : StatusDialogType.WAITING

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
      type={statusType}
      description={
        !txHash && !txError && txStatus !== 'success' ? 'Confirm this transaction in your wallet' : undefined
      }
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
  route,
  refetchRoute,
  chainId,
  poolType,
  state,
  tokensIn,
  confirmText,
  onClearTracking,
  onAddTrackedTxHash,
  onAddTransactionWithType,
  onDismiss,
  onUseSuggestedSlippage,
  onRevertPriceToggle,
}: AddLiquidityReviewModalProps) => {
  const { reviewRoute, buildData, buildError, buildLoading, rebuildReview } = useReviewBuild({
    isOpen,
    route,
    refetchRoute,
    onClearTracking,
  })
  const review = useReviewData({
    pool,
    route: reviewRoute,
    chainId,
    poolType,
    state,
  })

  const transaction = useReviewTransaction({
    isOpen,
    buildData,
    pool,
    review,
    tokensIn,
    onAddTrackedTxHash,
    onAddTransactionWithType,
    onDismiss,
  })

  const warnings = review.warnings
  const isWaitingForWallet =
    transaction.confirmLoading && !transaction.txHash && !transaction.txStatus && !transaction.submitError
  const isProcessing = Boolean(transaction.txHash) && !transaction.txStatus && !transaction.submitError
  const isSuccessful = transaction.txStatus === 'success'
  const showStatusDialog =
    transaction.confirmLoading ||
    Boolean(transaction.txHash) ||
    Boolean(transaction.submitError) ||
    Boolean(transaction.txStatus)

  const handleStatusClose = async () => {
    if (isSuccessful || isProcessing || isWaitingForWallet) {
      onDismiss?.()
      return
    }

    transaction.resetTransactionState()
    await rebuildReview()
  }

  const handleUseSuggestedSlippage = () => {
    onUseSuggestedSlippage?.()
  }

  if (!isOpen) return null

  if (showStatusDialog) {
    return (
      <StatusContent
        slippage={review.estimate.slippage}
        suggestedSlippage={review.estimate.suggestedSlippage}
        txHash={transaction.txHash}
        txStatus={transaction.txStatus}
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
        <ReviewHeader header={review.header} address={pool.address} onDismiss={onDismiss} />

        <ZapInSection items={review.zapInItems} totalInputUsd={review.totalInputUsd} />

        <PriceInfoSection priceInfo={review.priceInfo} onRevertPriceToggle={onRevertPriceToggle} />

        <EstimateSection estimate={review.estimate} />

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
          disabled={transaction.confirmDisabled || buildLoading || Boolean(buildError)}
          onClick={() => void transaction.handleSubmit()}
          type="button"
        >
          {transaction.confirmLoading ? 'Adding Liquidity...' : buildLoading ? 'Refreshing Route...' : confirmText}
        </ConfirmButton>
      </ModalContent>
    </Modal>
  )
}

export default AddLiquidityReviewModal

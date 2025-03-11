import { Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useMemo } from 'react'

import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from 'components/TransactionConfirmationModal'
import { Aggregator } from 'utils/aggregator'
import { useCurrencyConvertedToNative } from 'utils/dmm'

import SwapModalFooter from './SwapModalFooter'
import SwapModalHeader from './SwapModalHeader'

/**
 * Returns true if the trade requires a confirmation of details before we can submit it
 * @param tradeA trade A
 * @param tradeB trade B
 */
function tradeMeaningfullyDiffers(tradeA: Aggregator, tradeB: Aggregator): boolean {
  return (
    tradeA.tradeType !== tradeB.tradeType ||
    !tradeA.inputAmount.currency.equals(tradeB.inputAmount.currency) ||
    !tradeA.inputAmount.equalTo(tradeB.inputAmount) ||
    !tradeA.outputAmount.currency.equals(tradeB.outputAmount.currency) ||
    !tradeA.outputAmount.equalTo(tradeB.outputAmount)
  )
}

export default function ConfirmSwapModal({
  trade,
  originalTrade,
  allowedSlippage,
  onConfirm,
  onDismiss,
  swapErrorMessage,
  isOpen,
  attemptingTxn,
  txHash,
  tokenAddToMetaMask,
  showTxBanner,
}: {
  isOpen: boolean
  trade: Aggregator | undefined
  originalTrade: Aggregator | undefined
  attemptingTxn: boolean
  txHash: string | undefined
  allowedSlippage: number
  tokenAddToMetaMask: Currency | undefined
  onConfirm: () => void
  swapErrorMessage: string | undefined
  onDismiss: () => void
  showTxBanner?: boolean
}) {
  const showAcceptChanges = useMemo(
    () => Boolean(trade && originalTrade && tradeMeaningfullyDiffers(trade, originalTrade)),
    [originalTrade, trade],
  )

  const modalHeader = useCallback(() => {
    return trade ? <SwapModalHeader trade={trade} /> : null
  }, [trade])

  const modalBottom = useCallback(() => {
    return trade ? (
      <SwapModalFooter
        onConfirm={onConfirm}
        trade={trade}
        disabledConfirm={showAcceptChanges}
        swapErrorMessage={swapErrorMessage}
        allowedSlippage={allowedSlippage}
      />
    ) : null
  }, [allowedSlippage, onConfirm, showAcceptChanges, swapErrorMessage, trade])

  const nativeInput = useCurrencyConvertedToNative(originalTrade?.inputAmount?.currency)
  const nativeOutput = useCurrencyConvertedToNative(originalTrade?.outputAmount?.currency)
  // text to show while loading
  const pendingText = `Swapping ${originalTrade?.inputAmount?.toSignificant(6)} ${
    nativeInput?.symbol
  } for ${originalTrade?.outputAmount?.toSignificant(6)} ${nativeOutput?.symbol}`

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={swapErrorMessage} />
      ) : (
        <ConfirmationModalContent
          title={t`Confirm Swap Details`}
          onDismiss={onDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
        />
      ),
    [swapErrorMessage, onDismiss, modalHeader, modalBottom],
  )

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={confirmationContent}
      pendingText={pendingText}
      tokenAddToMetaMask={tokenAddToMetaMask}
      showTxBanner={showTxBanner}
    />
  )
}

import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { useSelector } from 'react-redux'

import Modal from 'components/Modal'
import {
  ConfirmationPendingContent,
  TransactionErrorContent,
  TransactionSubmittedContent,
} from 'components/TransactionConfirmationModal'
import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { useInputCurrency, useOutputCurrency, useSwapState } from 'state/swap/hooks'

import ConfirmSwapModalContent from './ConfirmSwapModalContent'

type Props = {
  isOpen: boolean
  attemptingTxn: boolean
  txHash: string | undefined
  tokenAddToMetaMask: Currency | undefined
  onAcceptChanges: () => void
  onConfirm: () => void
  swapErrorMessage: string | undefined
  onDismiss: () => void
  showTxBanner?: boolean
}

const SwapModal: React.FC<Props> = props => {
  const { isOpen, attemptingTxn, txHash, tokenAddToMetaMask, swapErrorMessage, onDismiss, showTxBanner } = props
  const { chainId } = useActiveWeb3React()
  const { feeConfig, typedValue } = useSwapState()

  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()
  const inputAmount = useSelector((state: AppState) => state.swap.routeSummary?.parsedAmountIn)
  const outputAmount = useSelector((state: AppState) => state.swap.routeSummary?.parsedAmountOut)

  // text to show while loading
  const pendingText = `Swapping ${!!feeConfig ? typedValue : inputAmount?.toSignificant(6)} ${
    currencyIn?.symbol
  } for ${outputAmount?.toSignificant(6)} ${currencyOut?.symbol}`

  const renderModalContent = () => {
    if (attemptingTxn) {
      return <ConfirmationPendingContent onDismiss={onDismiss} pendingText={pendingText} startedTime={undefined} />
    }

    if (txHash) {
      return (
        <TransactionSubmittedContent
          showTxBanner={showTxBanner}
          chainId={chainId}
          hash={txHash}
          onDismiss={onDismiss}
          tokenAddToMetaMask={tokenAddToMetaMask as Token}
        />
      )
    }

    if (swapErrorMessage) {
      return <TransactionErrorContent onDismiss={onDismiss} message={swapErrorMessage} />
    }

    return <ConfirmSwapModalContent {...props} />
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      {renderModalContent()}
    </Modal>
  )
}

export default SwapModal

import { Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'

import Modal from 'components/Modal'
import SetExitPriceButton from 'components/StopMarket/SetExitPriceButton'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import SwapReviewContent from 'components/SwapForm/SwapModal/SwapReviewContent'
import type { SwapReviewState } from 'components/SwapForm/hooks/useSwapReviewSession'
import {
  ConfirmationPendingContent,
  TransactionErrorContent,
  TransactionSubmittedContent,
} from 'components/TransactionConfirmationModal'
import { useActiveWeb3React } from 'hooks'
import { getERC8056DisplayAmount } from 'hooks/useERC8056Token'
import { getCurrencyDisplaySymbol } from 'utils/tokenInfo'

type SingleChainSwapModalProps = {
  isOpen: boolean
  tokenAddToMetaMask: Currency | undefined
  review: SwapReviewState
  onConfirm?: () => void
  onDismiss?: () => void
  onDismissError?: () => void
}

const SingleChainSwapModal = ({
  isOpen,
  tokenAddToMetaMask,
  onDismiss,
  onConfirm,
  onDismissError,
  review,
}: SingleChainSwapModalProps) => {
  const { buildResult, error, txHash, phase } = review
  const { chainId } = useActiveWeb3React()
  const { routeSummary, displayTypedValue, outputERC8056Info } = useSwapFormContext()
  const currencyIn = routeSummary?.parsedAmountIn?.currency
  const currencyOut = routeSummary?.parsedAmountOut?.currency

  const amountOut = currencyOut && CurrencyAmount.fromRawAmount(currencyOut, buildResult?.data?.amountOut || '0')
  const amountInDisplay = displayTypedValue || routeSummary?.parsedAmountIn?.toSignificant(6)
  const symbolIn = getCurrencyDisplaySymbol(currencyIn)
  const amountOutDisplay = getERC8056DisplayAmount(outputERC8056Info, amountOut)?.toSignificant(6)
  const symbolOut = getCurrencyDisplaySymbol(currencyOut)

  // text to show while loading
  const pendingText = t`Swapping ${amountInDisplay} ${symbolIn} for ${amountOutDisplay} ${symbolOut}`

  return (
    <Modal isOpen={isOpen} onDismiss={() => onDismiss?.()} maxHeight={90}>
      {phase === 'preparing' || phase === 'signing' ? (
        <ConfirmationPendingContent
          onDismiss={() => onDismiss?.()}
          pendingText={pendingText}
          title={phase === 'signing' ? undefined : t`Preparing Transaction`}
          subtitle={phase === 'signing' ? undefined : t`Estimating gas & network fees…`}
        />
      ) : txHash ? (
        <TransactionSubmittedContent
          chainId={chainId}
          hash={txHash}
          onDismiss={() => onDismiss?.()}
          tokenAddToMetaMask={tokenAddToMetaMask as Token}
          extraAction={
            <SetExitPriceButton currency={currencyOut} amount={routeSummary?.parsedAmountOut} onNavigate={onDismiss} />
          }
        />
      ) : error ? (
        <TransactionErrorContent onDismiss={() => onDismissError?.()} message={error} />
      ) : (
        <SwapReviewContent
          isBuildingRoute={phase === 'building'}
          buildError={buildResult?.error}
          onDismiss={() => onDismissError?.()}
          onConfirm={onConfirm}
          buildResult={buildResult}
        />
      )}
    </Modal>
  )
}

export default SingleChainSwapModal

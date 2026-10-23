import { Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useDispatch } from 'react-redux'

import Modal from 'components/Modal'
import SetExitPriceButton from 'components/StopMarket/SetExitPriceButton'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import ConfirmSwapModalContent from 'components/SwapForm/SwapModal/ConfirmSwapModalContent'
import type { SubmitReview, SwapReviewState } from 'components/SwapForm/hooks/useSwapReviewSession'
import {
  ConfirmationPendingContent,
  TransactionErrorContent,
  TransactionSubmittedContent,
} from 'components/TransactionConfirmationModal'
import { useActiveWeb3React } from 'hooks'
import { getERC8056DisplayAmount } from 'hooks/useERC8056Token'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { permitError } from 'state/swap/actions'
import { getCurrencyDisplaySymbol } from 'utils/tokenInfo'

type Props = {
  isOpen: boolean
  tokenAddToMetaMask: Currency | undefined
  review: SwapReviewState
  onConfirm: (submit: SubmitReview, onError: (message: string) => void) => Promise<void>

  onDismiss: () => void
  swapCallback: SubmitReview | undefined
}

const SwapModal = ({ isOpen, tokenAddToMetaMask, onDismiss, onConfirm, swapCallback, review }: Props) => {
  const { buildResult, error, txHash, phase } = review
  const { chainId, account, networkInfo } = useActiveWeb3React()
  const { trackingHandler } = useTracking()

  const dispatch = useDispatch()
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

  const handleError = (error: string) => {
    const isUserRejected = error.toLowerCase().includes('user rejected') || error.toLowerCase().includes('user denied')
    trackingHandler(TRACKING_EVENT_TYPE.SWAP_FAILED, {
      from_token: currencyIn?.symbol,
      to_token: currencyOut?.symbol,
      pair: currencyIn?.symbol && currencyOut?.symbol ? `${currencyIn.symbol}/${currencyOut.symbol}` : undefined,
      amount_in: displayTypedValue || routeSummary?.parsedAmountIn?.toSignificant(6),
      amount_in_usd: routeSummary?.amountInUsd ? Number(routeSummary.amountInUsd) : undefined,
      error_type: isUserRejected ? 'user_rejected' : 'tx_failed',
      error_message: error,
      max_slippage: routeSummary?.priceImpact,
      chain: networkInfo.name,
    })
  }

  const handleErrorDismiss = () => {
    if (
      ((buildResult?.error && buildResult.error.toLowerCase().includes('permit')) ||
        (error && error.toLowerCase().includes('permit'))) &&
      routeSummary &&
      account
    ) {
      dispatch(permitError({ chainId, address: routeSummary.parsedAmountIn.currency.wrapped.address, account }))
    }
    onDismiss()
  }

  const handleConfirmSwap = () => {
    if (swapCallback) void onConfirm(swapCallback, handleError)
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      {phase === 'preparing' || phase === 'signing' ? (
        <ConfirmationPendingContent
          onDismiss={onDismiss}
          pendingText={pendingText}
          title={phase === 'signing' ? undefined : t`Preparing Transaction`}
          subtitle={phase === 'signing' ? undefined : t`Estimating gas & network fees…`}
        />
      ) : txHash ? (
        <TransactionSubmittedContent
          chainId={chainId}
          hash={txHash}
          onDismiss={onDismiss}
          tokenAddToMetaMask={tokenAddToMetaMask as Token}
          extraAction={
            <SetExitPriceButton
              currency={currencyOut}
              amount={routeSummary?.parsedAmountOut}
              source="post_swap"
              onNavigate={handleDismiss}
            />
          }
        />
      ) : error ? (
        <TransactionErrorContent onDismiss={handleErrorDismiss} message={error} />
      ) : (
        <ConfirmSwapModalContent
          isBuildingRoute={phase === 'building'}
          errorWhileBuildRoute={buildResult?.error}
          onDismiss={handleErrorDismiss}
          onSwap={handleConfirmSwap}
          buildResult={buildResult}
        />
      )}
    </Modal>
  )
}

export default SwapModal

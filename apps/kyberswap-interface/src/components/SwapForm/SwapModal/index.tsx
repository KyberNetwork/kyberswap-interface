import { Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import Modal from 'components/Modal'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import {
  ConfirmationPendingContent,
  TransactionErrorContent,
  TransactionSubmittedContent,
} from 'components/TransactionConfirmationModal'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { permitError } from 'state/swap/actions'
import { getCurrencyDisplaySymbol } from 'utils/tokenInfo'

import ConfirmSwapModalContent from './ConfirmSwapModalContent'

type Props = {
  isOpen: boolean
  tokenAddToMetaMask: Currency | undefined
  buildResult: BuildRouteResult | undefined
  isBuildingRoute: boolean

  onDismiss: () => void
  swapCallback: ((onRequestSignature?: () => void) => Promise<string>) | undefined
}

const SwapModal: React.FC<Props> = props => {
  const { isOpen, tokenAddToMetaMask, onDismiss, swapCallback, buildResult, isBuildingRoute } = props
  const { chainId, account, networkInfo } = useActiveWeb3React()
  const { trackingHandler } = useTracking()

  const dispatch = useDispatch()
  // modal and loading
  const [{ error, isAttemptingTx, awaitingSignature, txHash }, setSwapState] = useState<{
    error: string
    isAttemptingTx: boolean
    // True once the tx is prepared and the wallet prompt has been requested.
    // Until then the pending modal shows a "Preparing Transaction" state.
    awaitingSignature: boolean
    txHash: string
  }>({
    error: '',
    isAttemptingTx: false,
    awaitingSignature: false,
    txHash: '',
  })

  const { routeSummary } = useSwapFormContext()
  const currencyIn = routeSummary?.parsedAmountIn?.currency
  const currencyOut = routeSummary?.parsedAmountOut?.currency

  const amountOut = currencyOut && CurrencyAmount.fromRawAmount(currencyOut, buildResult?.data?.amountOut || '0')
  const amountInDisplay = routeSummary?.parsedAmountIn?.toSignificant(6)
  const symbolIn = getCurrencyDisplaySymbol(currencyIn)
  const amountOutDisplay = amountOut?.toSignificant(6)
  const symbolOut = getCurrencyDisplaySymbol(currencyOut)

  // text to show while loading
  const pendingText = t`Swapping ${amountInDisplay} ${symbolIn} for ${amountOutDisplay} ${symbolOut}`

  const handleDismiss = useCallback(() => {
    onDismiss()
    setSwapState({
      error: '',
      isAttemptingTx: false,
      awaitingSignature: false,
      txHash: '',
    })
  }, [onDismiss])

  const handleAttemptSendTx = () => {
    setSwapState({
      error: '',
      isAttemptingTx: true,
      awaitingSignature: false,
      txHash: '',
    })
  }

  const handleTxSubmitted = (txHash: string) => {
    setSwapState({
      error: '',
      txHash,
      isAttemptingTx: false,
      awaitingSignature: false,
    })
  }

  const handleError = (error: string) => {
    const isUserRejected = error.toLowerCase().includes('user rejected') || error.toLowerCase().includes('user denied')
    trackingHandler(TRACKING_EVENT_TYPE.SWAP_FAILED, {
      from_token: currencyIn?.symbol,
      to_token: currencyOut?.symbol,
      pair: currencyIn?.symbol && currencyOut?.symbol ? `${currencyIn.symbol}/${currencyOut.symbol}` : undefined,
      amount_in: routeSummary?.parsedAmountIn?.toSignificant(6),
      amount_in_usd: routeSummary?.amountInUsd ? Number(routeSummary.amountInUsd) : undefined,
      error_type: isUserRejected ? 'user_rejected' : 'tx_failed',
      error_message: error,
      max_slippage: routeSummary?.priceImpact,
      chain: networkInfo.name,
    })

    setSwapState({
      error,
      txHash: '',
      isAttemptingTx: false,
      awaitingSignature: false,
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
    handleDismiss()
  }

  const handleConfirmSwap = async () => {
    if (!swapCallback) {
      return
    }

    handleAttemptSendTx()
    try {
      const hash = await swapCallback(() => setSwapState(prev => ({ ...prev, awaitingSignature: true })))
      handleTxSubmitted(hash)
    } catch (e) {
      handleError(e.message)
    }
  }

  const renderModalContent = () => {
    if (isAttemptingTx) {
      return (
        <ConfirmationPendingContent
          onDismiss={handleDismiss}
          pendingText={pendingText}
          title={awaitingSignature ? undefined : t`Preparing Transaction`}
          subtitle={awaitingSignature ? undefined : t`Estimating gas & network fees…`}
        />
      )
    }

    if (txHash) {
      return (
        <TransactionSubmittedContent
          chainId={chainId}
          hash={txHash}
          onDismiss={handleDismiss}
          tokenAddToMetaMask={tokenAddToMetaMask as Token}
        />
      )
    }

    if (error) {
      return <TransactionErrorContent onDismiss={handleErrorDismiss} message={error} />
    }

    return (
      <ConfirmSwapModalContent
        isBuildingRoute={isBuildingRoute}
        errorWhileBuildRoute={buildResult?.error}
        onDismiss={handleErrorDismiss}
        onSwap={handleConfirmSwap}
        buildResult={buildResult}
      />
    )
  }

  useEffect(() => {
    // dismiss the modal when user switches network
    handleDismiss()
  }, [chainId, handleDismiss])

  return (
    <Modal isOpen={isOpen} onDismiss={handleDismiss} maxHeight={90}>
      {renderModalContent()}
    </Modal>
  )
}

export default SwapModal

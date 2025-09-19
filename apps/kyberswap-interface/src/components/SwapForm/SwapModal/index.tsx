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
import { permitError } from 'state/swap/actions'
import { captureSwapError } from 'utils/sentry'

import ConfirmSwapModalContent from './ConfirmSwapModalContent'

type Props = {
  isOpen: boolean
  tokenAddToMetaMask: Currency | undefined
  buildResult: BuildRouteResult | undefined
  isBuildingRoute: boolean

  onDismiss: () => void
  swapCallback: (() => Promise<string>) | undefined
}

const SwapModal: React.FC<Props> = props => {
  const { isOpen, tokenAddToMetaMask, onDismiss, swapCallback, buildResult, isBuildingRoute } = props
  const { chainId, account } = useActiveWeb3React()

  const dispatch = useDispatch()
  // modal and loading
  const [{ error, isAttemptingTx, txHash }, setSwapState] = useState<{
    error: string
    isAttemptingTx: boolean
    txHash: string
  }>({
    error: '',
    isAttemptingTx: false,
    txHash: '',
  })

  const { routeSummary } = useSwapFormContext()
  const currencyIn = routeSummary?.parsedAmountIn?.currency
  const currencyOut = routeSummary?.parsedAmountOut?.currency

  const amountOut = currencyOut && CurrencyAmount.fromRawAmount(currencyOut, buildResult?.data?.amountOut || '0')
  const amountInDisplay = routeSummary?.parsedAmountIn?.toSignificant(6)
  const symbolIn = currencyIn?.symbol
  const amountOutDisplay = amountOut?.toSignificant(6)
  const symbolOut = currencyOut?.symbol

  // text to show while loading
  const pendingText = t`Swapping ${amountInDisplay} ${symbolIn} for ${amountOutDisplay} ${symbolOut}`

  const handleDismiss = useCallback(() => {
    onDismiss()
    setSwapState({
      error: '',
      isAttemptingTx: false,
      txHash: '',
    })
  }, [onDismiss])

  const handleAttemptSendTx = () => {
    setSwapState({
      error: '',
      isAttemptingTx: true,
      txHash: '',
    })
  }

  const handleTxSubmitted = (txHash: string) => {
    setSwapState({
      error: '',
      txHash,
      isAttemptingTx: false,
    })
  }

  const handleError = (error: string) => {
    setSwapState({
      error,
      txHash: '',
      isAttemptingTx: false,
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
      const hash = await swapCallback()
      handleTxSubmitted(hash)
    } catch (e) {
      captureSwapError(e)
      handleError(e.message)
    }
  }

  const renderModalContent = () => {
    if (isAttemptingTx) {
      return <ConfirmationPendingContent onDismiss={handleDismiss} pendingText={pendingText} />
    }

    if (txHash) {
      return (
        <TransactionSubmittedContent
          showTxBanner
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

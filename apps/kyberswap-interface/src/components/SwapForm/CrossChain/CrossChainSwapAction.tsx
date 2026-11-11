import { ChainId, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { isEvmCurrency } from 'services/crossChain/quote/utils'
import { isQuoteExecutable } from 'services/crossChain/utils'

import { ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import { CrossChainSwapConfirmation } from 'components/SwapForm/CrossChain/CrossChainSwapConfirmation'
import { useCrossChainApproval } from 'components/SwapForm/CrossChain/hooks/useCrossChainApproval'
import { useCrossChainBalance } from 'components/SwapForm/CrossChain/hooks/useCrossChainBalance'
import { useCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import SwapButtonWithPriceImpact from 'components/SwapForm/SwapActionButton/SwapButtonWithPriceImpact'
import { useSwapWallets } from 'components/SwapWallets/SwapWalletContext'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState } from 'hooks/useApproveCallback'
import { restrictedTokenMessage, useIsTokenAddressRestricted } from 'hooks/useRestrictedTokens'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { NonEvmChain, isEvmChain } from 'types/crossChain'
import { getTokenAddress } from 'utils/tokenInfo'

export const CrossChainSwapAction = () => {
  const {
    showPreview,
    reviewQuote,
    openReview,
    closeReview,
    isSubmitting,
    txHash,
    txError,
    confirmSwap,
    priceImpactAction,
    reviewHasVeryHighPriceImpact,
    amountInWei,
    fromChainId,
    toChainId,
    currencyIn,
    currencyOut,
    loading,
    allLoading,
    selectedQuote,
    recipientMessage,
    isReadOnly,
    sender,
    receiver,
  } = useCrossChainSwap()

  const wallets = useSwapWallets()
  const { chainId } = useActiveWeb3React()
  const { changeNetwork } = useChangeNetwork()
  const isAddressRestricted = useIsTokenAddressRestricted()

  const isFromEvm = isEvmChain(fromChainId)
  const isFromNear = fromChainId === NonEvmChain.Near
  const isFromSol = fromChainId === NonEvmChain.Solana
  const isFromBitcoin = fromChainId === NonEvmChain.Bitcoin

  const evmCurrencyIn = isFromEvm && isEvmCurrency(currencyIn) ? currencyIn : undefined
  const inputAmount = evmCurrencyIn ? CurrencyAmount.fromRawAmount(evmCurrencyIn, amountInWei || '0') : undefined

  const balance = useCurrencyBalance(evmCurrencyIn, isFromEvm ? (fromChainId as ChainId) : undefined)
  const nonEvmBalance = useCrossChainBalance(fromChainId, currencyIn, isFromEvm ? undefined : wallets?.inputAddress)

  const { approvalState, approve, isApproving, isChecking, isRevalidating, revalidateAllowance } =
    useCrossChainApproval({
      amount: inputAmount,
      fromChainId,
      spender: selectedQuote?.quote.contractAddress,
    })

  const isFindingRoute = loading || (allLoading && !selectedQuote)
  const isSelectedQuoteExecutable = !isReadOnly && isQuoteExecutable(selectedQuote, sender, receiver)

  // Restricted-token check applies only to EVM sides (the restricted list is keyed by EVM chainId).
  const restrictedCurrency =
    evmCurrencyIn && isAddressRestricted(fromChainId as ChainId, getTokenAddress(evmCurrencyIn))
      ? currencyIn
      : toChainId &&
        isEvmChain(toChainId) &&
        isEvmCurrency(currencyOut) &&
        isAddressRestricted(toChainId as ChainId, getTokenAddress(currencyOut))
      ? currencyOut
      : undefined

  const connectWalletLabel = isFromBitcoin
    ? t`Connect Bitcoin Wallet`
    : isFromNear
    ? t`Connect NEAR Wallet`
    : isFromSol
    ? t`Connect Solana Wallet`
    : t`Connect Wallet`

  const requestReview = () => {
    void openReview(revalidateAllowance)
  }

  // The first unmet prerequisite determines the action; keep this priority order.
  const {
    label,
    disabled = false,
    busy = false,
    readyToReview = false,
    onClick,
  } = (() => {
    if (isApproving) {
      return {
        label: t`Approving`,
        busy: true,
        disabled: true,
      }
    }

    // Recipient failures must not be presented as route refresh/loading failures.
    if (wallets?.inputAddress && recipientMessage) {
      return {
        label: recipientMessage,
        disabled: true,
      }
    }

    if (isFindingRoute) {
      return {
        label: t`Finding the best route`,
        busy: true,
        disabled: true,
      }
    }

    if (isChecking) {
      return {
        label: t`Checking approval`,
        busy: true,
        disabled: true,
      }
    }

    if (!fromChainId || !toChainId || !currencyIn || !currencyOut) {
      return {
        label: t`Please select a token`,
        disabled: true,
      }
    }

    if (restrictedCurrency) {
      return {
        label: restrictedTokenMessage(restrictedCurrency.symbol),
        disabled: true,
      }
    }

    if (!amountInWei || amountInWei === '0') {
      return {
        label: t`Please input an amount`,
        disabled: true,
      }
    }

    if (!wallets?.inputAddress) return { label: connectWalletLabel, onClick: wallets?.connectInput }

    if (!selectedQuote) return { label: t`No route found`, disabled: true }

    const hasInsufficientBalance = isFromEvm
      ? !balance || inputAmount?.greaterThan(balance)
      : nonEvmBalance === undefined || BigInt(nonEvmBalance) < BigInt(amountInWei)

    if (hasInsufficientBalance) {
      return {
        label: t`Insufficient Balance`,
        disabled: true,
      }
    }

    if (isFromEvm && chainId !== fromChainId) {
      return {
        label: t`Switch Network`,
        onClick: () => changeNetwork(fromChainId as ChainId),
      }
    }

    if (!isSelectedQuoteExecutable) {
      return {
        label: t`Refreshing route`,
        busy: true,
        disabled: true,
      }
    }

    if (approvalState === ApprovalState.NOT_APPROVED && selectedQuote.quote.contractAddress !== ZERO_ADDRESS) {
      return {
        label: t`Approve`,
        disabled: isRevalidating,
        onClick: approve,
      }
    }

    return {
      label: t`Review the Cross-chain Swap`,
      readyToReview: true,
      disabled: isRevalidating,
      onClick: requestReview,
    }
  })()

  const handleButtonClick = () => {
    if (loading) return
    onClick?.()
  }

  return (
    <>
      <CrossChainSwapConfirmation
        quote={reviewQuote}
        isOpen={showPreview}
        isSubmitting={isSubmitting}
        txHash={txHash}
        txError={txError}
        hasVeryHighPriceImpact={reviewHasVeryHighPriceImpact}
        onConfirm={confirmSwap}
        onDismiss={closeReview}
      />
      {readyToReview ? (
        <SwapButtonWithPriceImpact
          isProcessingSwap={showPreview || isSubmitting}
          showLoading={isRevalidating}
          priceImpactAction={priceImpactAction}
          isApproved
          hasRoute={isSelectedQuoteExecutable}
          onClick={requestReview}
        />
      ) : (
        <ButtonPrimary disabled={disabled} onClick={handleButtonClick}>
          {busy ? <Dots>{label}</Dots> : label}
        </ButtonPrimary>
      )}
    </>
  )
}

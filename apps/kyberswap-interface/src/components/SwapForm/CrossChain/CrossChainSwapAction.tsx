import { ChainId, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'

import { ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import { CrossChainSwapConfirmation } from 'components/SwapForm/CrossChain/CrossChainSwapConfirmation'
import { useCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useSolanaTokenBalances } from 'components/Web3Provider/SolanaProvider'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState } from 'hooks/useApproveCallback'
import { restrictedTokenMessage, useIsTokenAddressRestricted } from 'hooks/useRestrictedTokens'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { NonEvmChain, isEvmChain } from 'pages/CrossChainSwap/adapters/types'
import useAcceptTermAndPolicy from 'pages/CrossChainSwap/hooks/useAcceptTermAndPolicy'
import { useCrossChainApproval } from 'pages/CrossChainSwap/hooks/useCrossChainApproval'
import { useNearBalances } from 'pages/CrossChainSwap/hooks/useNearBalances'
import { useSolanaConnectModal } from 'pages/CrossChainSwap/provider/SolanaConnectModalProvider'
import { isEvmCurrency, isNearToken, isSolanaToken } from 'pages/CrossChainSwap/quote/utils'
import { isQuoteExecutable } from 'pages/CrossChainSwap/utils'
import { useWalletModalToggle } from 'state/application/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { getTokenAddress } from 'utils/tokenInfo'

export const CrossChainSwapAction = ({ onConnectBitcoin }: { onConnectBitcoin: () => void }) => {
  const {
    showPreview,
    reviewQuote,
    openReview,
    closeReview,
    amountInWei,
    fromChainId,
    toChainId,
    currencyIn,
    currencyOut,
    loading,
    allLoading,
    selectedQuote,
    recipient,
    sender,
    receiver,
  } = useCrossChainSwap()
  const { account, chainId } = useActiveWeb3React()
  const isFromEvm = isEvmChain(fromChainId)
  const isFromNear = fromChainId === NonEvmChain.Near
  const isFromSol = fromChainId === NonEvmChain.Solana
  const isFromBitcoin = fromChainId === NonEvmChain.Bitcoin
  const evmCurrencyIn = isFromEvm && isEvmCurrency(currencyIn) ? currencyIn : undefined
  const inputAmount = evmCurrencyIn ? CurrencyAmount.fromRawAmount(evmCurrencyIn, amountInWei || '0') : undefined

  const balance = useCurrencyBalance(evmCurrencyIn, isFromEvm ? (fromChainId as ChainId) : undefined)
  const { balances: nearBalances } = useNearBalances()
  const solanaBalances = useSolanaTokenBalances()
  const { walletInfo, balance: btcBalance } = useBitcoinWallet()
  const btcAddress = walletInfo?.address

  const { signedAccountId } = useWalletSelector()
  const { publicKey: solanaAddress } = useWallet()
  const toggleWalletModal = useWalletModalToggle()
  const { changeNetwork } = useChangeNetwork()
  const { termAndPolicyModal, onOpenWallet } = useAcceptTermAndPolicy()
  const { setIsOpen } = useSolanaConnectModal()
  const isAddressRestricted = useIsTokenAddressRestricted()

  const { approvalState, approve, isApproving, isChecking, isRevalidating, revalidateAllowance } =
    useCrossChainApproval({
      amount: inputAmount,
      fromChainId,
      spender: selectedQuote?.quote.contractAddress,
    })

  const isFindingRoute = loading || (allLoading && !selectedQuote)
  const isSelectedQuoteExecutable = isQuoteExecutable(selectedQuote, sender, receiver)

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

  const checkAllowanceAndOpenPreview = async () => {
    if (!selectedQuote || !isSelectedQuoteExecutable) return

    const hasSufficientAllowance = await revalidateAllowance()
    if (!hasSufficientAllowance) return

    openReview(selectedQuote)
  }

  const {
    label,
    disabled = false,
    busy = false,
    onClick,
  } = (() => {
    if (isApproving) {
      return {
        label: t`Approving`,
        busy: true,
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

    if (isFromBitcoin && !btcAddress) {
      return {
        label: t`Connect Bitcoin Wallet`,
        onClick: () => {
          onConnectBitcoin()
        },
      }
    }

    if (isFromEvm && !account) {
      return {
        label: t`Connect Wallet`,
        onClick: () => {
          toggleWalletModal()
        },
      }
    }

    if (isFromNear && !signedAccountId) {
      return {
        label: t`Connect NEAR Wallet`,
        onClick: () => {
          onOpenWallet('near')
        },
      }
    }

    if (isFromSol && !solanaAddress) {
      return {
        label: t`Connect Solana Wallet`,
        onClick: () => {
          setIsOpen(true)
        },
      }
    }

    if (!selectedQuote)
      return {
        label: t`No route found`,
        disabled: true,
      }

    let insufficientBalance = false
    if (isFromEvm && (!balance || inputAmount?.greaterThan(balance))) insufficientBalance = true
    if (
      isFromNear &&
      BigInt((isNearToken(currencyIn) ? nearBalances[currencyIn.assetId] : undefined) || 0) < BigInt(amountInWei)
    )
      insufficientBalance = true
    if (isFromBitcoin && BigInt(btcBalance || 0) < BigInt(amountInWei)) insufficientBalance = true
    if (
      isFromSol &&
      BigInt((isSolanaToken(currencyIn) ? solanaBalances[currencyIn.id]?.rawAmount : undefined) || '0') <
        BigInt(amountInWei)
    )
      insufficientBalance = true

    if (insufficientBalance) {
      return {
        label: t`Insufficient Balance`,
        disabled: true,
      }
    }

    if (isFromEvm && chainId !== fromChainId) {
      return {
        label: t`Switch Network`,
        onClick: () => {
          if (isFromEvm) changeNetwork(fromChainId as ChainId)
        },
      }
    }

    if (!recipient) {
      return {
        label: t`Enter Recipient`,
        disabled: true,
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
      disabled: isRevalidating,
      onClick: checkAllowanceAndOpenPreview,
    }
  })()

  return (
    <>
      {termAndPolicyModal}
      <CrossChainSwapConfirmation quote={reviewQuote} isOpen={showPreview} onDismiss={closeReview} />
      <ButtonPrimary
        disabled={disabled}
        onClick={() => {
          if (loading) return
          onClick?.()
        }}
      >
        {busy ? <Dots>{label}</Dots> : label}
      </ButtonPrimary>
    </>
  )
}

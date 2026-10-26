import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'

import { ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import { CrossChainSwapConfirmation } from 'components/SwapForm/CrossChain/CrossChainSwapConfirmation'
import { useCrossChainApproval } from 'components/SwapForm/CrossChain/hooks/useCrossChainApproval'
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
import { useNearBalances } from 'pages/CrossChainSwap/hooks/useNearBalances'
import { useSolanaConnectModal } from 'pages/CrossChainSwap/provider/SolanaConnectModalProvider'
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
  const inputAmount =
    isFromEvm && currencyIn ? CurrencyAmount.fromRawAmount(currencyIn as Currency, amountInWei || '0') : undefined

  const balance = useCurrencyBalance(
    isFromEvm ? (currencyIn as Currency) : undefined,
    isFromEvm ? (fromChainId as ChainId) : undefined,
  )
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
    isFromEvm && currencyIn && isAddressRestricted(fromChainId as ChainId, getTokenAddress(currencyIn as Currency))
      ? currencyIn
      : toChainId &&
        isEvmChain(toChainId) &&
        currencyOut &&
        isAddressRestricted(toChainId as ChainId, getTokenAddress(currencyOut as Currency))
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
    onClick,
  } = (() => {
    if (isApproving) {
      return {
        label: <Dots>{t`Approving`}</Dots>,
        disabled: true,
      }
    }
    if (isFindingRoute) {
      return {
        label: <Dots>{t`Finding the best route`}</Dots>,
        disabled: true,
      }
    }
    if (isChecking) {
      return {
        label: <Dots>{t`Checking approval`}</Dots>,
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

    let notEnougBalance = false
    if (isFromEvm && (!balance || inputAmount?.greaterThan(balance))) notEnougBalance = true
    if (isFromNear && BigInt(nearBalances[(currencyIn as any).assetId] || 0) < BigInt(amountInWei))
      notEnougBalance = true
    if (isFromBitcoin && BigInt(btcBalance || 0) < BigInt(amountInWei)) notEnougBalance = true
    if (isFromSol && BigInt(solanaBalances[(currencyIn as any).id]?.rawAmount || '0') < BigInt(amountInWei))
      notEnougBalance = true

    if (notEnougBalance) {
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
        label: <Dots>{t`Refreshing route`}</Dots>,
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
        {label}
      </ButtonPrimary>
    </>
  )
}

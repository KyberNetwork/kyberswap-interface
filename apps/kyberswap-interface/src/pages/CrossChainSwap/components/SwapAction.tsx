import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'

import { ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useSolanaTokenBalances } from 'components/Web3Provider/SolanaProvider'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState } from 'hooks/useApproveCallback'
import { restrictedTokenMessage, useIsTokenAddressRestricted } from 'hooks/useRestrictedTokens'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { NonEvmChain } from 'pages/CrossChainSwap/adapters'
import { ConfirmationPopup } from 'pages/CrossChainSwap/components/ConfirmationPopup'
import useAcceptTermAndPolicy from 'pages/CrossChainSwap/hooks/useAcceptTermAndPolicy'
import { useCrossChainApproval } from 'pages/CrossChainSwap/hooks/useCrossChainApproval'
import { useCrossChainSwap } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { useNearBalances } from 'pages/CrossChainSwap/hooks/useNearBalances'
import { useSolanaConnectModal } from 'pages/CrossChainSwap/provider/SolanaConnectModalProvider'
import { useWalletModalToggle } from 'state/application/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { isEvmChain } from 'utils'
import { getTokenAddress } from 'utils/tokenInfo'

export const SwapAction = ({ setShowBtcModal }: { setShowBtcModal: (val: boolean) => void }) => {
  const {
    showPreview,
    setShowPreview,
    amountInWei,
    fromChainId,
    toChainId,
    currencyIn,
    currencyOut,
    loading,
    allLoading,
    selectedQuote,
    recipient,
  } = useCrossChainSwap()
  const { account, chainId } = useActiveWeb3React()
  const { trackingHandler } = useTracking()

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

  const openPreview = () => {
    setShowPreview(true)
    trackingHandler(TRACKING_EVENT_TYPE.CC_REVIEW_OPENED, {
      from_token: currencyIn?.symbol,
      to_token: currencyOut?.symbol,
      from_chain: fromChainId,
      to_chain: toChainId,
      amount_in: selectedQuote?.quote.inputUsd,
      amount_out_estimated: selectedQuote?.quote.outputUsd,
      routing_source: selectedQuote?.adapter.getName(),
    })
  }

  const checkAllowanceAndOpenPreview = async () => {
    const hasSufficientAllowance = await revalidateAllowance()
    if (!hasSufficientAllowance) return

    openPreview()
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
          setShowBtcModal(true)
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
      <ConfirmationPopup
        isOpen={showPreview}
        onDismiss={() => {
          setShowPreview(false)
        }}
      />
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

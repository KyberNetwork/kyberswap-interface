import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'

import { ButtonPrimary } from 'components/Button'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useSolanaTokenBalances } from 'components/Web3Provider/SolanaProvider'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { NonEvmChain } from 'pages/CrossChainSwap/adapters'
import { ConfirmationPopup } from 'pages/CrossChainSwap/components/ConfirmationPopup'
import useAcceptTermAndPolicy from 'pages/CrossChainSwap/hooks/useAcceptTermAndPolicy'
import { useCrossChainSwap } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { useNearBalances } from 'pages/CrossChainSwap/hooks/useNearBalances'
import { useSolanaConnectModal } from 'pages/CrossChainSwap/provider/SolanaConnectModalProvider'
import { useWalletModalToggle } from 'state/application/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { isEvmChain } from 'utils'

export const SwapAction = ({ setShowBtcModal }: { setShowBtcModal: (val: boolean) => void }) => {
  const { account, chainId } = useActiveWeb3React()
  const {
    showPreview,
    setShowPreview,
    amountInWei,
    fromChainId,
    toChainId,
    currencyIn,
    currencyOut,
    allLoading,
    loading,
    selectedQuote,
    recipient,
  } = useCrossChainSwap()

  const isFromEvm = isEvmChain(fromChainId)
  const isFromNear = fromChainId === NonEvmChain.Near
  const isFromSol = fromChainId === NonEvmChain.Solana
  const isFromBitcoin = fromChainId === NonEvmChain.Bitcoin
  const balance = useCurrencyBalance(
    isFromEvm ? (currencyIn as Currency) : undefined,
    isFromEvm ? (fromChainId as ChainId) : undefined,
  )
  const { balances: nearBalances } = useNearBalances()
  const solanaBalances = useSolanaTokenBalances()
  const { walletInfo, balance: btcBalance } = useBitcoinWallet()
  const btcAddress = walletInfo?.address

  const toggleWalletModal = useWalletModalToggle()
  const { changeNetwork } = useChangeNetwork()

  const { signedAccountId } = useWalletSelector()

  const inputAmount =
    isEvmChain(fromChainId) && currencyIn
      ? CurrencyAmount.fromRawAmount(currencyIn as Currency, amountInWei || '0')
      : undefined

  const [approvalState, approve] = useApproveCallback(inputAmount, selectedQuote?.quote.contractAddress)
  const [clickedApprove, setClickedApprove] = useState(false)
  const { publicKey: solanaAddress } = useWallet()

  const { termAndPolicyModal, onOpenWallet } = useAcceptTermAndPolicy()
  const { setIsOpen } = useSolanaConnectModal()

  const {
    label,
    disabled = false,
    onClick,
  } = (() => {
    if (approvalState === ApprovalState.PENDING || clickedApprove) {
      return {
        label: t`Approving...`,
        disabled: true,
        onClick: () => {},
      }
    }
    if (allLoading)
      return {
        label: t`Finding the best route...`,
        disabled: true,
        onClick: () => {},
      }

    if (!fromChainId || !toChainId || !currencyIn || !currencyOut) {
      return {
        label: t`Please select a token`,
        disabled: true,
        onClick: () => {},
      }
    }

    if (!amountInWei || amountInWei === '0') {
      return {
        label: t`Please input an amount`,
        disabled: true,
        onClick: () => {},
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

    if (isFromEvm && !account)
      return {
        label: t`Connect Wallet`,
        onClick: () => {
          toggleWalletModal()
        },
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
        onClick: () => {},
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
        onClick: () => {},
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
        onClick: () => {},
      }
    }

    if (approvalState === 'NOT_APPROVED' && selectedQuote.quote.contractAddress !== ZERO_ADDRESS) {
      return {
        label: t`Approve`,
        onClick: () => {
          setClickedApprove(true)
          approve(inputAmount).finally(() => {
            setClickedApprove(false)
          })
        },
      }
    }

    return {
      label: t`Review the Cross-chain Swap`,
      onClick: () => {
        setShowPreview(true)
      },
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

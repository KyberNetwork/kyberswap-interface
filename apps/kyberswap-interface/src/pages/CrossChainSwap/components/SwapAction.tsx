import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useState } from 'react'

import { ButtonPrimary } from 'components/Button'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useWalletModalToggle } from 'state/application/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { isEvmChain } from 'utils'

import { NonEvmChain } from '../adapters'
import { useCrossChainSwap } from '../hooks/useCrossChainSwap'
import { useNearBalances } from '../hooks/useNearBalances'
import { ConfirmationPopup } from './ConfirmationPopup'

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
    loading,
    selectedQuote,
    recipient,
  } = useCrossChainSwap()

  const isFromEvm = isEvmChain(fromChainId)
  const isFromNear = fromChainId === NonEvmChain.Near
  const isFromBitcoin = fromChainId === NonEvmChain.Bitcoin
  const balance = useCurrencyBalance(
    isFromEvm ? (currencyIn as Currency) : undefined,
    isFromEvm ? (fromChainId as ChainId) : undefined,
  )
  const { balances: nearBalances } = useNearBalances()
  const { walletInfo, balance: btcBalance } = useBitcoinWallet()
  const btcAddress = walletInfo?.address

  const toggleWalletModal = useWalletModalToggle()
  const { changeNetwork } = useChangeNetwork()

  const { signedAccountId, signIn } = useWalletSelector()

  const inputAmount =
    isEvmChain(fromChainId) && currencyIn
      ? CurrencyAmount.fromRawAmount(currencyIn as Currency, amountInWei || '0')
      : undefined

  const [approvalState, approve] = useApproveCallback(inputAmount, selectedQuote?.quote.contractAddress)
  const [clickedApprove, setClickedApprove] = useState(false)

  const {
    label,
    disabled = false,
    onClick,
  } = (() => {
    if (approvalState === ApprovalState.PENDING || clickedApprove) {
      return {
        label: 'Approving...',
        disabled: true,
        onClick: () => {},
      }
    }
    if (loading)
      return {
        label: 'Finding the best route...',
        disabled: true,
        onClick: () => {},
      }

    if (!fromChainId || !toChainId || !currencyIn || !currencyOut) {
      return {
        label: 'Please select a token',
        disabled: true,
        onClick: () => {},
      }
    }

    if (!amountInWei || amountInWei === '0') {
      return {
        label: 'Please input an amount',
        disabled: true,
        onClick: () => {},
      }
    }

    if (isFromBitcoin && !btcAddress) {
      return {
        label: 'Connect Bitcoin Wallet',
        onClick: () => {
          setShowBtcModal(true)
        },
      }
    }

    if (isFromEvm && !account)
      return {
        label: 'Connect Wallet',
        onClick: () => {
          toggleWalletModal()
        },
      }

    if (isFromNear && !signedAccountId) {
      return {
        label: 'Connect NEAR Wallet',
        onClick: () => {
          signIn()
        },
      }
    }

    if (!selectedQuote)
      return {
        label: 'No route found',
        disabled: true,
        onClick: () => {},
      }

    let notEnougBalance = false
    if (isFromEvm && (!balance || inputAmount?.greaterThan(balance))) notEnougBalance = true
    if (isFromNear && BigInt(nearBalances[(currencyIn as any).assetId] || 0) < BigInt(amountInWei))
      notEnougBalance = true
    if (isFromBitcoin && BigInt(btcBalance || 0) < BigInt(amountInWei)) notEnougBalance = true

    if (notEnougBalance) {
      return {
        label: 'Insufficient Balance',
        disabled: true,
        onClick: () => {},
      }
    }

    if (isFromEvm && chainId !== fromChainId) {
      return {
        label: 'Switch Network',
        onClick: () => {
          if (isFromEvm) changeNetwork(fromChainId as ChainId)
        },
      }
    }

    if (!recipient) {
      return {
        label: 'Enter Recipient',
        disabled: true,
        onClick: () => {},
      }
    }

    if (approvalState === 'NOT_APPROVED' && selectedQuote.quote.contractAddress !== ZERO_ADDRESS) {
      return {
        label: `Approve`,
        onClick: () => {
          setClickedApprove(true)
          approve(inputAmount).finally(() => {
            setClickedApprove(false)
          })
        },
      }
    }

    return {
      label: 'Review the Cross-chain Swap',
      onClick: () => {
        setShowPreview(true)
      },
    }
  })()

  return (
    <>
      <ConfirmationPopup
        isOpen={showPreview}
        onDismiss={() => {
          setShowPreview(false)
        }}
      />
      <ButtonPrimary disabled={disabled} onClick={onClick}>
        {label}
      </ButtonPrimary>
    </>
  )
}

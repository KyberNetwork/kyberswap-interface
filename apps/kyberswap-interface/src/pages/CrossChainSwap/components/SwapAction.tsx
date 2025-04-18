import { ButtonPrimary } from 'components/Button'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { useCrossChainSwap } from '../hooks/useCrossChainSwap'
import { useActiveWeb3React } from 'hooks'
import { useWalletModalToggle } from 'state/application/hooks'
import { useState } from 'react'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { ZERO_ADDRESS } from 'constants/index'
import { ConfirmationPopup } from './ConfirmationPopup'

export const SwapAction = () => {
  const { account, chainId } = useActiveWeb3React()
  const { inputAmount, fromChainId, toChainId, currencyIn, currencyOut, loading, selectedQuote } = useCrossChainSwap()
  const balance = useCurrencyBalance(currencyIn, fromChainId)

  const toggleWalletModal = useWalletModalToggle()
  const { changeNetwork } = useChangeNetwork()

  const [showPreview, setShowPreview] = useState(false)

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

    if (!inputAmount || !inputAmount.greaterThan(0)) {
      return {
        label: 'Please input an amount',
        disabled: true,
        onClick: () => {},
      }
    }

    if (!account)
      return {
        label: 'Connect Wallet',
        onClick: () => {
          toggleWalletModal()
        },
      }

    if (!balance || inputAmount.greaterThan(balance)) {
      return {
        label: 'Insufficient Balance',
        disabled: true,
        onClick: () => {},
      }
    }

    if (!selectedQuote)
      return {
        label: 'No route found',
        disabled: true,
        onClick: () => {},
      }

    if (chainId !== fromChainId) {
      return {
        label: 'Switch Network',
        onClick: () => {
          changeNetwork(fromChainId)
        },
      }
    }

    if (approvalState === 'NOT_APPROVED' && selectedQuote.quote.contractAddress !== ZERO_ADDRESS) {
      return {
        label: 'Approve',
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

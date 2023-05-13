import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback } from 'react'

import Modal from 'components/Modal'
import { NUM_TOKEN_SUPPORT_REACT_WINDOW } from 'components/SearchModal/bridge/CurrencyListBridge'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import CurrencySearchBridge from './CurrencySearchBridge'

interface CurrencySearchModalBridgeProps {
  isOpen: boolean
  isOutput: boolean
  onDismiss: () => void
  onCurrencySelect: (currency: WrappedTokenInfo) => void
  tokens: WrappedTokenInfo[]
  currency: WrappedTokenInfo | undefined
  chainId: ChainId | undefined
}

export default function CurrencySearchModalBridge({
  isOpen,
  isOutput,
  onDismiss,
  onCurrencySelect,
  tokens,
  currency,
  chainId,
}: CurrencySearchModalBridgeProps) {
  const handleCurrencySelect = useCallback(
    (currency: WrappedTokenInfo) => {
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect],
  )

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      margin="auto"
      maxHeight={80}
      height={tokens.length < NUM_TOKEN_SUPPORT_REACT_WINDOW ? undefined : '95vh'}
      minHeight={isOutput ? undefined : 80}
    >
      <CurrencySearchBridge
        tokens={tokens}
        isOutput={isOutput}
        isOpen={isOpen}
        onDismiss={onDismiss}
        onCurrencySelect={handleCurrencySelect}
        currency={currency}
        chainId={chainId}
      />
    </Modal>
  )
}

import { Trans } from '@lingui/macro'
import { isMobile } from 'react-device-detect'

import Modal from 'components/Modal'
import { HStack } from 'components/Stack'
import NonEvmTokenSelectorContent from 'components/TokenSelectorModal/NonEvmTokenSelectorContent'
import { ContentWrapper } from 'components/TokenSelectorModal/components'
import { Chain, Currency, NonEvmChain } from 'pages/CrossChainSwap/adapters/types'
import { CloseIcon } from 'theme'

type Props = {
  isOpen: boolean
  onDismiss: () => void
  onSelectCurrency: (currency: Currency) => void
  selectedChain?: Chain
  selectedCurrency?: Currency
}

const TokenSelectorNonEvmModal = ({ isOpen, onDismiss, onSelectCurrency, selectedChain, selectedCurrency }: Props) => {
  const isMobileHorizontal = Math.abs(window.orientation) === 90 && isMobile
  const hasTokenList = selectedChain === NonEvmChain.Near || selectedChain === NonEvmChain.Solana
  return (
    <Modal
      isOpen={isOpen && hasTokenList}
      onDismiss={onDismiss}
      maxHeight={isMobileHorizontal ? 100 : 80}
      minHeight={80}
      height={isMobileHorizontal ? '95vh' : undefined}
    >
      {isOpen && hasTokenList && (
        <ContentWrapper className="min-h-0 gap-3 overflow-hidden p-4">
          <HStack className="shrink-0 items-center justify-between">
            <span className="text-xl font-medium">
              <Trans>Select a token</Trans>
            </span>
            <CloseIcon onClick={onDismiss} />
          </HStack>
          <NonEvmTokenSelectorContent
            chain={selectedChain}
            selectedCurrency={selectedCurrency}
            onSelect={currency => {
              // Legacy cross-chain callers read assetId for both NEAR and Solana.
              onSelectCurrency('id' in currency ? { ...currency, assetId: currency.id } : currency)
              onDismiss()
            }}
          />
        </ContentWrapper>
      )}
    </Modal>
  )
}
export default TokenSelectorNonEvmModal

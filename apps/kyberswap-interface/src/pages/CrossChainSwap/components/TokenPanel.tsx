import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { Aligner, CurrencySelect, InputRow, StyledTokenName } from 'components/CurrencyInputPanel'
import Wallet from 'components/Icons/Wallet'
import useTheme from 'hooks/useTheme'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'
import { Input as NumericalInput } from 'components/NumericalInput'
import { useEffect, useRef, useState } from 'react'
import { RowFixed } from 'components/Row'
import CurrencyLogo from 'components/CurrencyLogo'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import SelectNetwork from 'pages/Bridge/SelectNetwork'
import { MAINNET_NETWORKS } from 'constants/networks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { formatDisplayNumber } from 'utils/numbers'
import { Chain } from '../adapters'

const TokenPanelWrapper = styled.div`
  padding: 12px;
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 1rem;
`
export const TokenPanel = ({
  selectedChain,
  selectedCurrency,
  onSelectNetwork,
  value,
  amountUsd,
  onUserInput,
  disabled,
  onSelectCurrency,
}: {
  selectedChain?: ChainId
  selectedCurrency?: Currency
  onSelectNetwork: (chainId: Chain) => void
  onSelectCurrency: (currency: Currency) => void
  value: string
  amountUsd?: number
  disabled: boolean
  onUserInput: (value: string) => void
}) => {
  const theme = useTheme()
  const [modalOpen, setModalOpen] = useState(false)
  const balance = useCurrencyBalance(selectedCurrency, selectedChain)
  const ref = useRef<{ toggleNetworkModal: () => void }>(null)
  const [autoToggleTokenSelector, setAutoToggleTokenSelector] = useState(false)
  useEffect(() => {
    if (autoToggleTokenSelector && selectedChain) {
      setModalOpen(true)
      setAutoToggleTokenSelector(false)
    }
  }, [autoToggleTokenSelector, selectedChain])

  return (
    <TokenPanelWrapper>
      <Flex justifyContent="space-between" marginBottom="12px">
        <SelectNetwork
          onSelectNetwork={onSelectNetwork}
          selectedChainId={selectedChain}
          chainIds={['near', ...MAINNET_NETWORKS]}
          ref={ref}
        />
        <Flex
          sx={{ gap: '4px', cursor: 'pointer' }}
          color={theme.subText}
          fontSize="12px"
          fontWeight="500"
          alignItems="center"
          role="button"
          onClick={() => {
            if (disabled) return
            onUserInput(balance?.toExact() || '0')
          }}
        >
          <Wallet color={theme.subText} />
          {balance?.toSignificant(6) || 0}
        </Flex>
      </Flex>

      <InputRow>
        <NumericalInput
          error={false}
          className="token-amount-input"
          value={value}
          disabled={disabled}
          onUserInput={onUserInput}
        />

        {amountUsd && (
          <Text fontSize="0.875rem" marginRight="8px" fontWeight="500" color={theme.border}>
            ~{formatDisplayNumber(amountUsd, { significantDigits: 4, style: 'currency' })}
          </Text>
        )}

        <CurrencySelect
          selected={!!selectedCurrency}
          className="open-currency-select-button"
          data-testid="open-currency-select-button"
          onClick={() => {
            if (!selectedChain) {
              ref?.current?.toggleNetworkModal()
              setAutoToggleTokenSelector(true)
              return
            }
            setModalOpen(true)
          }}
          style={{ cursor: 'pointer', paddingRight: 0 }}
        >
          <Aligner>
            <RowFixed>
              {selectedCurrency && <CurrencyLogo currency={selectedCurrency} size={'20px'} />}
              <StyledTokenName
                className="token-symbol-container"
                active={Boolean(selectedCurrency?.symbol)}
                style={{ paddingRight: 0 }}
              >
                {selectedCurrency?.symbol || 'Select a token'}
              </StyledTokenName>
            </RowFixed>
            <DropdownSVG />
          </Aligner>
        </CurrencySelect>
      </InputRow>

      <CurrencySearchModal
        isOpen={modalOpen}
        onDismiss={() => setModalOpen(false)}
        onCurrencySelect={onSelectCurrency as (currency: Currency) => void}
        selectedCurrency={selectedCurrency}
        showCommonBases
        customChainId={selectedChain}
      />
    </TokenPanelWrapper>
  )
}

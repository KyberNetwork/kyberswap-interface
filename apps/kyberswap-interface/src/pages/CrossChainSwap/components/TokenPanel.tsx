import { ChainId, Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import HelpIcon from 'assets/svg/help-circle.svg'
import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { Aligner, CurrencySelect, InputRow, StyledTokenName } from 'components/CurrencyInputPanel'
import Wallet from 'components/Icons/Wallet'
import useTheme from 'hooks/useTheme'
import { Flex, Text, Box } from 'rebass'
import styled from 'styled-components'
import { Input as NumericalInput } from 'components/NumericalInput'
import { useEffect, useRef, useState } from 'react'
import { RowBetween, RowFixed } from 'components/Row'
import CurrencyLogo from 'components/CurrencyLogo'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import SelectNetwork from 'pages/Bridge/SelectNetwork'
import { MAINNET_NETWORKS } from 'constants/networks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { formatDisplayNumber } from 'utils/numbers'
import { BitcoinToken, Chain, Currency, NonEvmChain } from '../adapters'
import { isEvmChain } from 'utils'
import Modal from 'components/Modal'
import { CloseIcon } from 'theme'
import { SearchIcon, SearchInput, SearchWrapper, Separator } from 'components/SearchModal/styleds'
import { useNearTokens } from 'state/crossChainSwap'
import { isMobile } from 'react-device-detect'
import { rgba } from 'polished'

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
  selectedChain?: Chain
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
  const isEvm = isEvmChain(selectedChain as Chain)
  const { nearTokens } = useNearTokens()

  const evmBalance = useCurrencyBalance(
    isEvm ? (selectedCurrency as EvmCurrency) : undefined,
    isEvm ? (selectedChain as ChainId) : undefined,
  )

  const balance = evmBalance

  const ref = useRef<{ toggleNetworkModal: () => void }>(null)
  const [autoToggleTokenSelector, setAutoToggleTokenSelector] = useState(false)
  useEffect(() => {
    if (autoToggleTokenSelector && selectedChain) {
      setModalOpen(true)
      setAutoToggleTokenSelector(false)
    }
  }, [autoToggleTokenSelector, selectedChain])

  const [searchQuery, setSearchQuery] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  // clear the input on open
  useEffect(() => {
    if (modalOpen) {
      setSearchQuery('')
      inputRef.current?.focus()
    }
  }, [modalOpen])

  const filteredNearTokens =
    selectedChain === NonEvmChain.Bitcoin
      ? [
          {
            ...BitcoinToken,
            assetId: BitcoinToken.symbol,
          },
        ]
      : nearTokens.filter(token => {
          const q = searchQuery.toLowerCase().trim()
          return (
            token.blockchain === 'near' &&
            (token.symbol.toLowerCase().includes(q) || token.contractAddress.toLowerCase().includes(q))
          )
        })

  const isMobileHorizontal = Math.abs(window.orientation) === 90 && isMobile

  return (
    <TokenPanelWrapper>
      <Flex justifyContent="space-between" marginBottom="12px">
        <SelectNetwork
          onSelectNetwork={onSelectNetwork}
          selectedChainId={selectedChain}
          chainIds={[NonEvmChain.Bitcoin, NonEvmChain.Near, ...MAINNET_NETWORKS]}
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
              {selectedCurrency && (
                <>
                  {isEvm ? (
                    <CurrencyLogo currency={selectedCurrency as EvmCurrency} size={'20px'} />
                  ) : (
                    <img
                      src={(selectedCurrency as any).logo}
                      alt={selectedCurrency.symbol}
                      width={24}
                      height={24}
                      style={{ borderRadius: '50%' }}
                      onError={({ currentTarget }) => {
                        currentTarget.onerror = null
                        currentTarget.src = HelpIcon
                      }}
                    />
                  )}
                </>
              )}
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

      {isEvm ? (
        <CurrencySearchModal
          isOpen={modalOpen}
          onDismiss={() => setModalOpen(false)}
          onCurrencySelect={onSelectCurrency as (currency: Currency) => void}
          selectedCurrency={selectedCurrency as EvmCurrency}
          showCommonBases
          customChainId={selectedChain as ChainId}
        />
      ) : (
        <Modal
          isOpen={modalOpen}
          onDismiss={() => setModalOpen(false)}
          maxHeight={isMobileHorizontal ? 100 : 80}
          height={isMobileHorizontal ? '95vh' : undefined}
        >
          <Flex flexDirection="column" width="100%" padding="20px" sx={{ gap: '1rem' }}>
            <Flex justifyContent="space-between" alignItems="center">
              <Text fontSize={20} fontWeight={500}>
                Select a token
              </Text>
              <CloseIcon onClick={() => setModalOpen(false)} />
            </Flex>
            <SearchWrapper>
              <SearchInput
                type="text"
                id="token-search-input"
                data-testid="token-search-input"
                placeholder={'Search by token name, token symbol or address'}
                value={searchQuery}
                ref={inputRef}
                onChange={e => {
                  setSearchQuery(e.target.value)
                }}
                autoComplete="off"
              />
              <SearchIcon size={18} color={theme.border} />
            </SearchWrapper>

            <Separator />
            <Box
              sx={{
                flex: 1,
                overflowY: 'scroll',
                marginX: '-20px',
              }}
            >
              {filteredNearTokens.map(item => {
                return (
                  <CurrencyRowWrapper
                    key={item.assetId}
                    role="button"
                    onClick={() => {
                      onSelectCurrency(item)
                      setModalOpen(false)
                    }}
                  >
                    <Flex alignItems="center" style={{ gap: 8 }}>
                      <img
                        src={item.logo}
                        alt={item.symbol}
                        width={24}
                        height={24}
                        style={{ borderRadius: '50%' }}
                        onError={({ currentTarget }) => {
                          currentTarget.onerror = null
                          currentTarget.src = HelpIcon
                        }}
                      />
                      <Text fontWeight={500}>{item.symbol}</Text>
                    </Flex>
                  </CurrencyRowWrapper>
                )
              })}
            </Box>
          </Flex>
        </Modal>
      )}
    </TokenPanelWrapper>
  )
}

const CurrencyRowWrapper = styled(RowBetween)<{ hoverColor?: string }>`
  padding: 4px 20px;
  height: 56px;
  display: flex;
  gap: 16px;
  cursor: pointer;
  &[data-selected='true'] {
    background: ${({ theme }) => rgba(theme.bg6, 0.15)};
  }

  @media (hover: hover) {
    :hover {
      background: ${({ theme, hoverColor }) => hoverColor || theme.buttonBlack};
    }
  }
`

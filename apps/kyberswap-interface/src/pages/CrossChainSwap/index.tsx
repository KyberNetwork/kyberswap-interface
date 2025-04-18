import styled from 'styled-components'
import { TokenPanel } from './components/TokenPanel'
import { Flex, Text } from 'rebass'
import useTheme from 'hooks/useTheme'
import { useSearchParams } from 'react-router-dom'
import { CrossChainSwapRegistryProvider, useCrossChainSwap } from './hooks/useCrossChainSwap'
import { formatDisplayNumber } from 'utils/numbers'
import SlippageSetting from 'components/SwapForm/SlippageSetting'
import { QuoteSelector } from './components/QuoteSelector'
import { TokenLogoWithChain } from './components/TokenLogoWithChain'
import { Summary } from './components/Summary'
import { SwapAction } from './components/SwapAction'
import ReverseTokenSelectionButton from 'components/SwapForm/ReverseTokenSelectionButton'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

function CrossChainSwap() {
  const {
    amount,
    setAmount,
    selectedQuote,
    setSelectedQuote,
    fromChainId,
    toChainId,
    currencyIn,
    currencyOut,
    quotes,
  } = useCrossChainSwap()
  const theme = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()

  return (
    <Wrapper>
      <TokenPanel
        selectedChain={fromChainId}
        selectedCurrency={currencyIn || undefined}
        onSelectNetwork={chainId => {
          searchParams.set('from', chainId.toString())
          setSearchParams(searchParams)
        }}
        value={amount}
        amountUsd={selectedQuote?.quote.inputUsd}
        onUserInput={value => {
          setAmount(value)
        }}
        disabled={false}
        onSelectCurrency={currency => {
          searchParams.set(
            'tokenIn',
            (currency.isNative ? currency.symbol : currency.address) || currency.wrapped.address,
          )
          setSearchParams(searchParams)
        }}
      />

      <Flex justifyContent="space-between" alignItems="center">
        <Flex color={theme.text} fontSize="14px" alignItems="center" sx={{ gap: '4px', flex: 1 }}>
          <Text as="span" color={theme.subText}>
            Cross-chain rate:
          </Text>
          {selectedQuote && toChainId ? (
            <>
              1 <TokenLogoWithChain currency={currencyIn} chainId={fromChainId} />
              {}= {formatDisplayNumber(selectedQuote.quote.rate, { significantDigits: 6 })}
              <TokenLogoWithChain currency={currencyOut} chainId={toChainId} />
            </>
          ) : (
            '--'
          )}
        </Flex>

        <ReverseTokenSelectionButton
          onClick={() => {
            searchParams.set('from', toChainId?.toString() || '')
            searchParams.set('to', fromChainId?.toString() || '')
            searchParams.set(
              'tokenIn',
              currencyOut?.isNative ? currencyOut.symbol || '' : currencyOut?.wrapped.address || '',
            )
            searchParams.set(
              'tokenOut',
              currencyIn?.isNative ? currencyIn.symbol || '' : currencyIn?.wrapped.address || '',
            )
            setSearchParams(searchParams)
          }}
        />
      </Flex>

      <TokenPanel
        selectedChain={toChainId}
        selectedCurrency={currencyOut || undefined}
        onSelectNetwork={chainId => {
          searchParams.set('to', chainId.toString())
          setSearchParams(searchParams)
        }}
        value={quotes[0]?.quote.formattedOutputAmount || ''}
        amountUsd={selectedQuote?.quote.outputUsd}
        onUserInput={() => {
          //
        }}
        disabled
        onSelectCurrency={currency => {
          searchParams.set(
            'tokenOut',
            (currency.isNative ? currency.symbol : currency.address) || currency.wrapped.address,
          )
          setSearchParams(searchParams)
        }}
      />

      <SlippageSetting
        rightComponent={
          quotes.length > 1 && selectedQuote ? (
            <QuoteSelector
              quotes={quotes}
              selectedQuote={selectedQuote}
              onChange={newSelectedQuote => {
                setSelectedQuote(newSelectedQuote)
              }}
              tokenOut={currencyOut}
            />
          ) : null
        }
      />

      <Summary quote={selectedQuote || undefined} tokenOut={currencyOut} />

      <SwapAction />
    </Wrapper>
  )
}

export default function CrossChainSwapPage() {
  return (
    <CrossChainSwapRegistryProvider>
      <CrossChainSwap />
    </CrossChainSwapRegistryProvider>
  )
}

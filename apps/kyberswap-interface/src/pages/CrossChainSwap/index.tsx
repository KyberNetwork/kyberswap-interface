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
import { isEvmChain } from 'utils'
import { NearToken } from 'state/crossChainSwap'
import { Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'

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
          const c = currency as EvmCurrency

          searchParams.set(
            'tokenIn',
            isEvmChain(fromChainId)
              ? (c.isNative ? c.symbol : c.address) || c.wrapped.address
              : (currency as NearToken).assetId,
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
            const cIn = currencyIn as EvmCurrency
            const cOut = currencyOut as EvmCurrency
            const isFromEvm = isEvmChain(fromChainId)
            const isToEvm = toChainId && isEvmChain(toChainId)
            searchParams.set('from', toChainId?.toString() || '')
            searchParams.set('to', fromChainId?.toString() || '')
            searchParams.set(
              'tokenIn',
              isToEvm
                ? cOut?.isNative
                  ? cOut.symbol || ''
                  : cOut?.wrapped.address || ''
                : (currencyOut as NearToken).assetId,
            )
            searchParams.set(
              'tokenOut',
              isFromEvm
                ? cIn?.isNative
                  ? cIn.symbol || ''
                  : cIn?.wrapped.address || ''
                : (currencyIn as NearToken).assetId,
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
          const c = currency as EvmCurrency
          searchParams.set(
            'tokenOut',
            toChainId && isEvmChain(toChainId)
              ? (c.isNative ? c.symbol : c.address) || c.wrapped.address
              : (currency as NearToken).assetId,
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

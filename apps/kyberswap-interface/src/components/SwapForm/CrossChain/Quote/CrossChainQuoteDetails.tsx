import { Stack } from 'components/Stack'
import { CrossChainQuoteSelector } from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteSelector'
import { CrossChainQuoteSummaryRows } from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteSummary'
import { useCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { QuoteDetails } from 'components/SwapForm/Quote/QuoteDetails'
import { SwapRate } from 'components/SwapForm/Quote/SwapRate'
import SlippageSetting from 'components/SwapForm/Settings/SlippageSetting'
import { useSlippageSettingByPage } from 'state/user/hooks'
import { formatDisplayNumber } from 'utils/numbers'

export const CrossChainQuoteDetails = () => {
  const {
    selectedQuote,
    quotes,
    setSelectedAdapter,
    currencyIn,
    currencyOut,
    warning,
    slippage,
    refresh,
    fromChainId,
    toChainId,
    loading,
    allLoading,
    disable,
  } = useCrossChainSwap()
  const { isSlippageControlPinned } = useSlippageSettingByPage()
  const quote = selectedQuote?.quote
  const initialLoading = !disable && !quote && (loading || allLoading)

  return (
    <QuoteDetails className="gap-3">
      <SlippageSetting slippageInfo={warning?.slippageInfo} />
      <SwapRate
        currencyIn={currencyIn}
        currencyOut={currencyOut}
        inputChain={fromChainId}
        outputChain={toChainId}
        rate={quote ? formatDisplayNumber(quote.rate, { significantDigits: 6 }) : undefined}
        invertedRate={quote ? formatDisplayNumber(1 / quote.rate, { significantDigits: 6 }) : undefined}
        loading={initialLoading}
        refresh={refresh}
        routes={
          <CrossChainQuoteSelector
            quotes={quotes}
            selectedQuote={selectedQuote}
            tokenOut={currencyOut}
            onChange={quote => setSelectedAdapter(quote.adapter.getName())}
          />
        }
      />
      <Stack className="gap-2">
        <CrossChainQuoteSummaryRows
          loading={initialLoading}
          quote={selectedQuote || undefined}
          tokenOut={currencyOut}
          slippage={slippage}
          warning={warning}
          showSlippage={!isSlippageControlPinned}
        />
      </Stack>
    </QuoteDetails>
  )
}

import { ReactNode } from 'react'
import { isEvmCurrency } from 'services/crossChain/quote/utils'
import { getQuoteId } from 'services/crossChain/registry'

import { GasDropAmount } from 'components/GasDrop/GasDropAmount'
import { HoneypotWarning, useHoneypotWarning } from 'components/HoneypotWarning'
import { Stack } from 'components/Stack'
import {
  CrossChainPriceImpactWarning,
  CrossChainQuoteSummaryRows,
} from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteSummary'
import { QuoteDetails } from 'components/SwapForm/Quote/QuoteDetails'
import { SwapRate } from 'components/SwapForm/Quote/SwapRate'
import SlippageSetting from 'components/SwapForm/Settings/SlippageSetting'
import { QuoteSelector } from 'pages/KyberCross/components/QuoteSelector'
import { useKyberCrossSwap } from 'pages/KyberCross/hooks/useKyberCrossSwap'
import { formatDisplayNumber } from 'utils/numbers'

export const KyberCrossQuoteDetails = ({ recipient }: { recipient?: ReactNode }) => {
  const swap = useKyberCrossSwap()
  const { selectedQuote, currencyIn, currencyOut, fromChainId, toChainId, warning, slippage, refresh } = swap
  const quote = selectedQuote?.quote
  const output = isEvmCurrency(currencyOut) ? currencyOut : undefined
  const { message } = useHoneypotWarning({
    chainId: output?.chainId,
    tokenAddress: output?.wrapped.address,
    tokenSymbol: output?.symbol,
  })
  return (
    <QuoteDetails className="gap-3">
      <SlippageSetting isCrossChain slippageInfo={warning?.slippageInfo} />
      <SwapRate
        currencyIn={currencyIn}
        currencyOut={currencyOut}
        inputChain={fromChainId}
        outputChain={toChainId}
        rate={quote ? formatDisplayNumber(quote.rate, { significantDigits: 6 }) : undefined}
        invertedRate={quote ? formatDisplayNumber(1 / quote.rate, { significantDigits: 6 }) : undefined}
        loading={swap.loading && !quote}
        refresh={refresh}
        routes={
          selectedQuote && (
            <QuoteSelector
              quotes={swap.quotes}
              selectedQuote={selectedQuote}
              tokenOut={currencyOut}
              onChange={item => swap.setSelectedQuoteId(getQuoteId(item))}
            />
          )
        }
      />
      {recipient}
      <Stack className="gap-2">
        <CrossChainQuoteSummaryRows
          loading={swap.loading && !quote}
          quote={selectedQuote || undefined}
          tokenOut={currencyOut}
          slippage={slippage}
          warning={warning}
        />
        <GasDropAmount gasDrop={quote?.gasDrop} chain={toChainId} loading={swap.gasDropEnabled && swap.loading} />
        <HoneypotWarning message={message} />
        <CrossChainPriceImpactWarning warning={warning} />
      </Stack>
    </QuoteDetails>
  )
}

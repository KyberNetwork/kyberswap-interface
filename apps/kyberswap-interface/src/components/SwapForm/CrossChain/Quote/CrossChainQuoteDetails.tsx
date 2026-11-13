import { ReactNode } from 'react'

import { CrossChainQuoteLayout } from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteLayout'
import { CrossChainQuoteSelector } from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteSelector'
import { CrossChainQuoteSummaryRows } from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteSummary'
import { useCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { SwapRate } from 'components/SwapForm/Quote/SwapRate'
import { RecipientToggle } from 'components/SwapForm/RecipientInput'
import SlippageSetting from 'components/SwapForm/Settings/SlippageSetting'
import { useSlippageSettingByPage } from 'state/user/hooks'
import { formatDisplayNumber } from 'utils/numbers'

export const CrossChainQuoteDetails = ({ recipient }: { recipient?: ReactNode }) => {
  const {
    selectedQuote,
    routeOptions,
    selectRoute,
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
    showRecipientInput,
    toggleRecipient,
  } = useCrossChainSwap()
  const { isSlippageControlPinned } = useSlippageSettingByPage()
  const quote = selectedQuote?.quote
  const initialLoading = !disable && !quote && (loading || allLoading)

  const recipientToggle = recipient ? (
    <RecipientToggle expanded={showRecipientInput} onToggle={toggleRecipient} />
  ) : undefined

  return (
    <CrossChainQuoteLayout
      controls={
        (isSlippageControlPinned || recipientToggle) && (
          <div>
            {isSlippageControlPinned ? (
              <SlippageSetting isCrossChain slippageInfo={warning?.slippageInfo} rightComponent={recipientToggle} />
            ) : (
              recipientToggle && <div className="flex justify-end">{recipientToggle}</div>
            )}
            {recipient}
          </div>
        )
      }
      rate={
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
              quotes={routeOptions}
              selectedQuote={selectedQuote}
              tokenOut={currencyOut}
              onChange={selectRoute}
            />
          }
        />
      }
    >
      <CrossChainQuoteSummaryRows
        loading={initialLoading}
        quote={selectedQuote || undefined}
        tokenOut={currencyOut}
        slippage={slippage}
        warning={warning}
        showSlippage={!isSlippageControlPinned}
      />
    </CrossChainQuoteLayout>
  )
}

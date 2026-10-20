import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Repeat } from 'react-feather'

import RefreshIndicator from 'components/RefreshLoading/RefreshIndicator'
import { HStack } from 'components/Stack'
import { QuoteDetailRow, QuoteDetails } from 'components/SwapForm/QuoteDetails'
import SlippageSetting from 'components/SwapForm/SlippageSetting'
import { QuoteSelector } from 'pages/Swap/components/crossChain/QuoteSelector'
import { SummaryRows } from 'pages/Swap/components/crossChain/Summary'
import { useCrossChainSwap } from 'pages/Swap/hooks/crossChain/useCrossChainSwap'
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
    loading,
    allLoading,
    disable,
    refresh,
  } = useCrossChainSwap()
  const { isSlippageControlPinned } = useSlippageSettingByPage()
  const [revertPrice, setRevertPrice] = useState(false)
  const quote = selectedQuote?.quote

  return (
    <QuoteDetails className="gap-2">
      <SlippageSetting slippageInfo={warning?.slippageInfo} />
      <QuoteDetailRow label={<Trans>Rate</Trans>}>
        <HStack className="flex-wrap items-center justify-end gap-1">
          <RefreshIndicator {...refresh} size={20} clickable />
          {quote ? (
            <button
              type="button"
              onClick={() => setRevertPrice(value => !value)}
              className="flex cursor-pointer flex-wrap items-center gap-1 border-0 bg-transparent p-0 text-xs font-medium text-text"
            >
              1 {revertPrice ? currencyOut?.symbol : currencyIn?.symbol} ={' '}
              {formatDisplayNumber(revertPrice ? 1 / quote.rate : quote.rate, { significantDigits: 6 })}{' '}
              {revertPrice ? currencyIn?.symbol : currencyOut?.symbol}
              <Repeat size={14} className="text-subText" />
            </button>
          ) : (
            <span>--</span>
          )}
        </HStack>
      </QuoteDetailRow>
      <SummaryRows
        quote={selectedQuote || undefined}
        tokenOut={currencyOut}
        slippage={slippage}
        warning={warning}
        showSlippage={!isSlippageControlPinned}
      />
      <HStack className="min-h-5 items-center justify-end text-xs text-subText">
        {selectedQuote ? (
          <QuoteSelector
            quotes={quotes}
            selectedQuote={selectedQuote}
            tokenOut={currencyOut}
            onChange={quote => setSelectedAdapter(quote.adapter.getName())}
          />
        ) : disable ? (
          <Trans>Enter an amount</Trans>
        ) : loading || allLoading ? (
          <Trans>Finding routes...</Trans>
        ) : (
          <Trans>No route found</Trans>
        )}
      </HStack>
    </QuoteDetails>
  )
}

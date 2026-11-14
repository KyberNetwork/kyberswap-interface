import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import type { ComponentProps } from 'react'
import type { Quote } from 'services/crossChain/registry'

import { type SwapFormSelectionProps, UnifiedSwapForm } from 'components/SwapForm/UnifiedSwapForm'

export type CrossChainFormSelectionProps = SwapFormSelectionProps

type Props = ComponentProps<typeof UnifiedSwapForm> & { selectedQuote?: Quote }

/** Adapts direct KyberCross quotes to the shared form fields. */
export const CrossChainSwapForm = ({ selectedQuote, loading, action, ...props }: Props) => {
  const quote = selectedQuote?.quote
  const output = props.currencyOut && 'isNative' in props.currencyOut ? props.currencyOut : undefined
  return (
    <UnifiedSwapForm
      {...props}
      parsedAmountOut={
        output && quote ? CurrencyAmount.fromRawAmount(output, quote.outputAmount.toString()) : undefined
      }
      outputAmount={quote?.formattedOutputAmount}
      amountInUsd={quote?.inputUsd?.toString()}
      amountOutUsd={quote?.outputUsd?.toString()}
      loading={loading && !quote}
      action={action}
    />
  )
}

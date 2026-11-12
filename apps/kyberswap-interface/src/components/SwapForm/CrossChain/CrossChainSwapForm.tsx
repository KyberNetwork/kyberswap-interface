import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import type { ComponentProps } from 'react'
import type { Quote } from 'services/crossChain/registry'

import { Stack } from 'components/Stack'
import { type SwapFormSelectionProps, UnifiedSwapForm } from 'components/SwapForm/UnifiedSwapForm'

export type CrossChainFormSelectionProps = SwapFormSelectionProps

type Props = ComponentProps<typeof UnifiedSwapForm> & { selectedQuote?: Quote }

/** Legacy KyberCross adapts quotes to the shared form. */
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
      action={
        <Stack className="gap-2">
          {action}
          {!loading && selectedQuote && (
            <span className="text-center text-xs font-medium text-gray">
              <Trans>Routed via</Trans> {selectedQuote.adapter.getName()}
            </span>
          )}
        </Stack>
      }
    />
  )
}

import type { Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'

import { ButtonPrimary } from 'components/Button'
import Skeleton from 'components/Skeleton'
import { Stack } from 'components/Stack'
import {
  type CrossChainFormSelectionProps,
  CrossChainSwapForm,
} from 'components/SwapForm/CrossChain/CrossChainSwapForm'
import { CrossChainQuoteSummaryRows } from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteSummary'
import { CrossChainRoutesButton } from 'components/SwapForm/CrossChain/Quote/CrossChainRoutesButton'
import { useCrossChainPair } from 'components/SwapForm/CrossChain/hooks/useCrossChainPair'
import { QuoteDetails } from 'components/SwapForm/Quote/QuoteDetails'
import { SwapRate } from 'components/SwapForm/Quote/SwapRate'
import SlippageSetting from 'components/SwapForm/Settings/SlippageSetting'
import type { Chain } from 'pages/Swap/crossChain/adapters/types'
import { useSlippageSettingByPage } from 'state/user/hooks'

const PendingQuoteDetails = () => {
  const { rawSlippage, isSlippageControlPinned } = useSlippageSettingByPage()

  return (
    <QuoteDetails className="gap-3">
      <SlippageSetting isCrossChain />
      <SwapRate loading routes={<CrossChainRoutesButton disabled />} />
      <Stack className="gap-2">
        <CrossChainQuoteSummaryRows loading slippage={rawSlippage} showSlippage={!isSlippageControlPinned} />
      </Stack>
    </QuoteDetails>
  )
}

type Props = CrossChainFormSelectionProps & {
  amount: string
  onAmountChange: (value: string) => void
  currencyIn: EvmCurrency | undefined
  currencyOut: EvmCurrency | undefined
  fromChainId: Chain
  toChainId: Chain
  tokenIn: string
  tokenOut: string
  isInputCurrencyLoading: boolean
  isOutputCurrencyLoading: boolean
}

/** Interactive fields stay available while quote/execution code loads.
 * Metadata lookup shares the existing token caches and never starts a quote request. */
const CrossChainSwapPending = ({
  currencyIn,
  currencyOut,
  fromChainId,
  toChainId,
  tokenIn,
  tokenOut,
  isInputCurrencyLoading,
  isOutputCurrencyLoading,
  ...props
}: Props) => {
  const pair = useCrossChainPair({ fromChainId, toChainId, tokenIn, tokenOut })
  const input = currencyIn ?? pair.currencyIn
  const output = currencyOut ?? pair.currencyOut

  return (
    <CrossChainSwapForm
      {...props}
      fromChainId={fromChainId}
      toChainId={toChainId}
      currencyIn={input}
      currencyOut={output}
      isInputCurrencyLoading={isInputCurrencyLoading || (!input && !!tokenIn)}
      isOutputCurrencyLoading={isOutputCurrencyLoading || (!output && !!tokenOut)}
      loading
      recipient={<Skeleton width="100%" height={20} />}
      details={<PendingQuoteDetails />}
      action={
        <ButtonPrimary disabled>
          <Trans>Swap</Trans>
        </ButtonPrimary>
      }
    />
  )
}

export default CrossChainSwapPending

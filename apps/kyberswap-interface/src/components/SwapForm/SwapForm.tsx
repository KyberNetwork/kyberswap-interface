import { type Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Suspense, lazy, useEffect } from 'react'

import { ButtonPrimary } from 'components/Button'
import { CrossChainReceiverWalletSelector } from 'components/SwapForm/CrossChain/CrossChainReceiverWalletSelector'
import { useOptionalCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { SingleChainSwapContent } from 'components/SwapForm/SingleChain/SingleChainSwap'
import { useSingleChainSwapContext } from 'components/SwapForm/SingleChain/SingleChainSwapProvider'
import { type SwapFormSelectionProps, UnifiedSwapForm } from 'components/SwapForm/UnifiedSwapForm'
import { NETWORKS_INFO } from 'constants/networks'
import useDebounce from 'hooks/useDebounce'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { WrapType } from 'hooks/useWrapCallback'
import type { Chain } from 'types/crossChain'

const CrossChainSwap = lazy(() => import('components/SwapForm/CrossChain/CrossChainSwap'))
const CrossChainOutputFooter = lazy(() =>
  import('components/SwapForm/CrossChain/CrossChainSwap').then(module => ({ default: module.CrossChainOutputFooter })),
)

const PendingSwap = () => (
  <ButtonPrimary disabled>
    <Trans>Swap</Trans>
  </ButtonPrimary>
)

type Props = SwapFormSelectionProps & {
  isCrossChain: boolean
  inputChain: Chain
  outputChain: Chain
  currencyIn?: Currency
  currencyOut?: Currency
  amount: string
  onAmountChange: (value: string) => void
  isInputCurrencyLoading: boolean
  isOutputCurrencyLoading: boolean
}

export const SwapForm = ({
  isCrossChain,
  inputChain,
  outputChain,
  currencyIn,
  currencyOut,
  amount,
  ...props
}: Props) => {
  const single = useSingleChainSwapContext()
  const cross = useOptionalCrossChainSwap()
  const input = isCrossChain ? currencyIn ?? cross?.currencyIn : currencyIn
  const output = isCrossChain ? currencyOut ?? cross?.currencyOut : currencyOut
  const quote = cross?.selectedQuote?.quote
  const evmOutput = output && 'isNative' in output ? output : undefined
  const parsedAmountOut = isCrossChain
    ? evmOutput && quote
      ? CurrencyAmount.fromRawAmount(evmOutput, quote.outputAmount.toString())
      : undefined
    : single.routeSummary?.parsedAmountOut
  const independentWallets = typeof inputChain !== 'number' || typeof outputChain !== 'number'

  const { trackingHandler } = useTracking()
  const debouncedAmount = useDebounce(amount, 1000)
  useEffect(() => {
    if (debouncedAmount && Number(debouncedAmount) > 0 && input && 'isNative' in input) {
      trackingHandler(TRACKING_EVENT_TYPE.AMOUNT_ENTERED, {
        token_symbol: input.symbol,
        token_address: input.isNative ? 'NATIVE' : input.wrapped.address,
        amount: debouncedAmount,
        token_position: 'input',
        paired_token: output?.symbol,
        chain: NETWORKS_INFO[input.chainId].name,
      })
    }
    // Track edits, not quote refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAmount])

  return (
    <UnifiedSwapForm
      {...props}
      amount={amount}
      currencyIn={input}
      currencyOut={output}
      fromChainId={inputChain}
      toChainId={outputChain}
      parsedAmountIn={isCrossChain ? undefined : single.parsedAmount}
      parsedAmountOut={parsedAmountOut}
      outputAmount={isCrossChain ? quote?.formattedOutputAmount : single.routeSummary?.parsedAmountOut.toExact()}
      amountInUsd={isCrossChain ? quote?.inputUsd?.toString() : single.routeSummary?.amountInUsd}
      amountOutUsd={isCrossChain ? quote?.outputUsd?.toString() : single.routeSummary?.amountOutUsd}
      wrapType={isCrossChain ? WrapType.NOT_APPLICABLE : single.wrapType}
      loading={isCrossChain ? (!cross || cross.loading) && !quote : single.routeLoading}
      receiver={
        independentWallets && cross ? (
          <CrossChainReceiverWalletSelector key={outputChain} chain={outputChain} />
        ) : undefined
      }
      receiverAddress={isCrossChain ? cross?.recipient : single.recipient}
      outputFooter={
        isCrossChain && cross ? (
          <Suspense fallback={null}>
            <CrossChainOutputFooter />
          </Suspense>
        ) : undefined
      }
      details={
        isCrossChain ? (
          cross ? (
            <Suspense fallback={<PendingSwap />}>
              <CrossChainSwap />
            </Suspense>
          ) : (
            <PendingSwap />
          )
        ) : (
          <SingleChainSwapContent />
        )
      }
      action={null}
    />
  )
}

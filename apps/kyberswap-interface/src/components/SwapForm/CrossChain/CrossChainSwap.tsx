import { memo, useEffect, useState } from 'react'

import { HoneypotWarning, useHoneypotWarning } from 'components/HoneypotWarning'
import { Stack } from 'components/Stack'
import { CrossChainRecipient } from 'components/SwapForm/CrossChain/CrossChainRecipient'
import { CrossChainSwapAction } from 'components/SwapForm/CrossChain/CrossChainSwapAction'
import {
  type CrossChainFormSelectionProps,
  CrossChainSwapForm,
} from 'components/SwapForm/CrossChain/CrossChainSwapForm'
import { CrossChainQuoteDetails } from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteDetails'
import { CrossChainPriceImpactWarning } from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteSummary'
import { useCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { NETWORKS_INFO } from 'constants/networks'
import useDebounce from 'hooks/useDebounce'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { BitcoinConnectModal } from 'pages/CrossChainSwap/components/BitcoinConnectModal'

type Props = CrossChainFormSelectionProps

/** Connects the shared form to the single quote provider mounted by the consuming page. */
const CrossChainSwap = (props: Props) => {
  const { amount, onAmountChange, currencyIn, currencyOut, fromChainId, toChainId, selectedQuote, loading, warning } =
    useCrossChainSwap()
  const { trackingHandler } = useTracking()
  const [showBitcoin, setShowBitcoin] = useState(false)
  const debouncedAmount = useDebounce(amount, 1000)

  const input = currencyIn && 'isNative' in currencyIn ? currencyIn : undefined
  const output = currencyOut && 'isNative' in currencyOut ? currencyOut : undefined
  const { message } = useHoneypotWarning({
    chainId: output?.chainId,
    tokenAddress: output?.wrapped.address,
    tokenSymbol: output?.symbol,
  })

  useEffect(() => {
    if (debouncedAmount && Number(debouncedAmount) > 0 && input) {
      trackingHandler(TRACKING_EVENT_TYPE.AMOUNT_ENTERED, {
        token_symbol: input.symbol,
        token_address: input.isNative ? 'NATIVE' : input.wrapped.address,
        amount: debouncedAmount,
        token_position: 'input',
        paired_token: currencyOut?.symbol,
        chain: NETWORKS_INFO[input.chainId].name,
      })
    }
    // Amount tracking follows user edits, not quote refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAmount])

  return (
    <>
      <CrossChainSwapForm
        {...props}
        amount={amount}
        onAmountChange={onAmountChange}
        currencyIn={currencyIn}
        currencyOut={currencyOut}
        fromChainId={fromChainId}
        toChainId={toChainId}
        selectedQuote={selectedQuote || undefined}
        loading={loading}
        recipient={<CrossChainRecipient />}
        details={
          <Stack className="gap-2">
            <CrossChainQuoteDetails />
            <HoneypotWarning message={message} />
            <CrossChainPriceImpactWarning warning={warning} />
          </Stack>
        }
        action={<CrossChainSwapAction onConnectBitcoin={() => setShowBitcoin(true)} />}
      />
      <BitcoinConnectModal isOpen={showBitcoin} onDismiss={() => setShowBitcoin(false)} />
    </>
  )
}

export default memo(CrossChainSwap)

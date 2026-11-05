import { memo, useEffect, useState } from 'react'

import { HoneypotWarning, useHoneypotWarning } from 'components/HoneypotWarning'
import { Stack } from 'components/Stack'
import { CrossChainReceiverWalletSelector } from 'components/SwapForm/CrossChain/CrossChainReceiverWalletSelector'
import { CrossChainRecipient } from 'components/SwapForm/CrossChain/CrossChainRecipient'
import { CrossChainSwapAction } from 'components/SwapForm/CrossChain/CrossChainSwapAction'
import {
  type CrossChainFormSelectionProps,
  CrossChainSwapForm,
} from 'components/SwapForm/CrossChain/CrossChainSwapForm'
import { CrossChainQuoteDetails } from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteDetails'
import { CrossChainPriceImpactWarning } from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteSummary'
import { GasDropOption } from 'components/SwapForm/CrossChain/Quote/GasDrop'
import { useCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { useCrossChainWalletIntent } from 'components/SwapForm/CrossChain/hooks/useCrossChainWalletIntent'
import { NETWORKS_INFO } from 'constants/networks'
import useDebounce from 'hooks/useDebounce'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { BitcoinConnectModal } from 'pages/Swap/crossChain/components/BitcoinConnectModal'
import { isNonEvmChain } from 'types/crossChain'

type Props = CrossChainFormSelectionProps

/** Connects the shared form to the single quote provider mounted by the consuming page. */
const CrossChainSwap = (props: Props) => {
  const {
    amount,
    setAmount,
    currencyIn,
    currencyOut,
    fromChainId,
    toChainId,
    selectedQuote,
    gasDropAvailable,
    gasDropEnabled,
    setGasDropEnabled,
    loading,
    warning,
    recipient,
    isPastedRecipient,
  } = useCrossChainSwap()
  const { trackingHandler } = useTracking()
  const [showBitcoin, setShowBitcoin] = useState(false)
  const walletIntentModal = useCrossChainWalletIntent(fromChainId, () => setShowBitcoin(true))
  const debouncedAmount = useDebounce(amount, 1000)

  const hasNonEvmChain = isNonEvmChain(fromChainId) || isNonEvmChain(toChainId)
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
      {walletIntentModal}
      <CrossChainSwapForm
        {...props}
        amount={amount}
        onAmountChange={setAmount}
        currencyIn={currencyIn}
        currencyOut={currencyOut}
        fromChainId={fromChainId}
        toChainId={toChainId}
        selectedQuote={selectedQuote || undefined}
        loading={loading}
        receiver={hasNonEvmChain ? <CrossChainReceiverWalletSelector key={toChainId} chain={toChainId} /> : undefined}
        receiverAddress={recipient}
        outputFooter={
          gasDropAvailable && (
            <GasDropOption
              chain={toChainId}
              provider={selectedQuote?.adapter.getName()}
              outputSymbol={currencyOut?.symbol}
              gasDrop={selectedQuote?.quote.gasDrop}
              enabled={gasDropEnabled}
              onChange={setGasDropEnabled}
            />
          )
        }
        details={
          <Stack className="gap-2">
            <CrossChainQuoteDetails
              recipient={!hasNonEvmChain || isPastedRecipient ? <CrossChainRecipient /> : undefined}
            />
            <HoneypotWarning message={message} />
            <CrossChainPriceImpactWarning warning={warning} />
          </Stack>
        }
        action={<CrossChainSwapAction />}
      />
      <BitcoinConnectModal isOpen={showBitcoin} onDismiss={() => setShowBitcoin(false)} />
    </>
  )
}

export default memo(CrossChainSwap)

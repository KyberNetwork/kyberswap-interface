import { Trans } from '@lingui/macro'
import { useState } from 'react'

import { BitcoinConnectModal } from 'components/Header/web3/WalletModal/BitcoinConnectModal'
import { HoneypotWarning, useHoneypotWarning } from 'components/HoneypotWarning'
import { Stack } from 'components/Stack'
import { CrossChainRecipient } from 'components/SwapForm/CrossChain/CrossChainRecipient'
import { CrossChainSwapAction } from 'components/SwapForm/CrossChain/CrossChainSwapAction'
import { CrossChainQuoteDetails } from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteDetails'
import { CrossChainPriceImpactWarning } from 'components/SwapForm/CrossChain/Quote/CrossChainQuoteSummary'
import { GasDropOption } from 'components/SwapForm/CrossChain/Quote/GasDrop'
import { useCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { useCrossChainWalletIntent } from 'components/SwapWallets/useCrossChainWalletIntent'
import { isEvmChain } from 'types/crossChain'

export const CrossChainOutputFooter = () => {
  const swap = useCrossChainSwap()
  if (!swap.gasDropAvailable) return null
  return (
    <GasDropOption
      chain={swap.toChainId}
      provider={swap.selectedQuote?.adapter.getName()}
      outputSymbol={swap.currencyOut?.symbol}
      gasDrop={swap.selectedQuote?.quote.gasDrop}
      enabled={swap.gasDropEnabled}
      unsupported={swap.gasDropUnsupported}
      loading={swap.gasDropEnabled && swap.loading && !swap.selectedQuote}
      onRequest={swap.prepareGasDrop}
      onChange={swap.setGasDropEnabled}
    />
  )
}

/** Cross-chain information and execution, independent of the shared fields. */
const CrossChainSwap = () => {
  const { currencyOut, fromChainId, toChainId, selectedQuote, loading, warning, hasCustomRecipient } =
    useCrossChainSwap()
  const [showBitcoin, setShowBitcoin] = useState(false)
  const walletIntentModal = useCrossChainWalletIntent(fromChainId, () => setShowBitcoin(true))
  const output = currencyOut && 'isNative' in currencyOut ? currencyOut : undefined
  const showRecipient = hasCustomRecipient || (isEvmChain(fromChainId) && !!toChainId && isEvmChain(toChainId))
  const { message } = useHoneypotWarning({
    chainId: output?.chainId,
    tokenAddress: output?.wrapped.address,
    tokenSymbol: output?.symbol,
  })
  return (
    <>
      {walletIntentModal}
      <Stack className="gap-2">
        <CrossChainQuoteDetails recipient={showRecipient ? <CrossChainRecipient /> : undefined} />
        <HoneypotWarning message={message} />
        <CrossChainPriceImpactWarning warning={warning} />
      </Stack>
      <Stack className="gap-2">
        <CrossChainSwapAction />
        {!loading && selectedQuote && (
          <span className="text-center text-xs font-medium text-gray">
            <Trans>Routed via</Trans> {selectedQuote.adapter.getName()}
          </span>
        )}
      </Stack>
      <BitcoinConnectModal isOpen={showBitcoin} onDismiss={() => setShowBitcoin(false)} />
    </>
  )
}

export default CrossChainSwap
